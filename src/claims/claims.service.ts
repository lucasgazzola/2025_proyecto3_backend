import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ClaimStateHistory, ClaimStateHistoryDocument } from '../mongoose/schemas/claim-state-history.schema';
import { RoleEnum } from '../mongoose/schemas/user.schema';
import { Project, ProjectDocument } from '../mongoose/schemas/project.schema';
import { SubArea, SubAreaDocument } from '../mongoose/schemas/subarea.schema';
import { ClaimMessage, ClaimMessageDocument } from '../mongoose/schemas/claim-message.schema';
import { File as FileEntity, FileDocument, FileTypeEnum } from '../mongoose/schemas/file.schema';
import { Payload } from 'src/common/interfaces/payload';
import { CLAIM_REPOSITORY } from './repositories/claim.repository.interface';
import type { IClaimRepository } from './repositories/claim.repository.interface';
import { ClaimMapper } from './mapper/claim.mongo.mapper';
import { ClaimStatus } from 'src/common/enums/claims.enums';

@Injectable()
export class ClaimsService {
  constructor(
    @Inject(CLAIM_REPOSITORY)
    private readonly claimRepository: IClaimRepository,
    @InjectModel(ClaimStateHistory.name)
    private readonly historyModel: Model<ClaimStateHistoryDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(SubArea.name)
    private readonly subAreaModel: Model<SubAreaDocument>,
    @InjectModel(ClaimMessage.name)
    private readonly messageModel: Model<ClaimMessageDocument>,
    @InjectModel(FileEntity.name)
    private readonly fileModel: Model<FileDocument>,
  ) {}

  private buildAbsoluteUrl(relativeUrl: string): string {
    const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT ?? 3000}`;
    // asegurar que relativeUrl comience con '/'
    const rel = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    return `${base}${rel}`;
  }

async create(
  createClaimDto: CreateClaimDto,
  userId: string,
  files: Express.Multer.File[] = [],
) {
  // 1. Armar el objeto base del reclamo con el mapper
  const claimData = ClaimMapper.toCreatePersistence(createClaimDto, userId);
  const claim = await this.claimRepository.create(claimData);

  // 2. Manejo de archivos
  if (files.length) {
    if (files.length > 2) {
      throw new BadRequestException('Maximum 2 files allowed');
    }

    const createdFiles = await Promise.all(
      files.map(async (f) => {
        const ext = (f.originalname.split('.').pop() || '').toLowerCase();
        const type: FileTypeEnum = ['png', 'jpg', 'jpeg'].includes(ext)
          ? FileTypeEnum.IMAGE
          : FileTypeEnum.PDF;

        const publicUrl = `/uploads/${f.filename}`;
        const doc = new this.fileModel({
          name: f.originalname,
          fileType: type,
          url: publicUrl,
        });
        return doc.save();
      }),
    );

    await this.claimRepository.pushFiles(
      claim._id,
      createdFiles.map((d) => d._id),
    );
  }

  // 3. Historial inicial
  const historyData = ClaimMapper.toCreateHistoryPersistence({
    action: 'Creación del reclamo',
    claimId: String(claim._id),
    userId,
    claimStatus: createClaimDto.claimStatus,   // ✅ usa enums de common/enums
    claimType: createClaimDto.claimType,
    priority: createClaimDto.priority,
    criticality: createClaimDto.criticality,
    subarea: createClaimDto.subarea,
  });

  const history = new this.historyModel(historyData);
  await history.save();
  await this.claimRepository.pushHistory(claim._id, history._id);

  // 4. Asociar el reclamo al proyecto
  await this.projectModel.findByIdAndUpdate(claim.project, {
    $push: { claims: claim._id },
  });

  return claim;
}

async findAllForUser(user: Payload) {
  const query: Record<string, unknown> = {};

  // casteo explícito de role a RoleEnum
  if (user?.role && user.role === RoleEnum.CUSTOMER) {
    query.user = new Types.ObjectId(user.id || user._id);
  }

  const claims = await this.claimRepository.findAll(query);

  const claimsWithStatus = await Promise.all(
    (claims || []).map(async (claim) => {
      const lastHistory = await this.historyModel
        .findOne({ claim: new Types.ObjectId(claim._id) })
        .sort({ createdAt: -1 })
        .select('priority criticality claimType claimStatus startDate subarea')
        .populate({
          path: 'subarea',
          select: 'name area',
          populate: { path: 'area', select: 'name' },
        })
        .lean()
        .exec();

      const { history, files, ...rest } = claim as any;

      let subareaSnapshot: any = undefined;
      if (lastHistory?.subarea) {
        subareaSnapshot = {
          _id: (lastHistory.subarea as any)._id,
          name: (lastHistory.subarea as any).name,
          area: {
            _id: (lastHistory.subarea as any).area?._id,
            name: (lastHistory.subarea as any).area?.name,
          },
        };
      }

      const filesWithAbsolute = Array.isArray(files)
        ? files.map((f: any) => ({
            _id: f._id,
            name: f.name,
            fileType: f.fileType,
            url: this.buildAbsoluteUrl(f.url),
          }))
        : [];

      return {
        ...rest,
        claimStatus: lastHistory?.claimStatus,
        claimType: lastHistory?.claimType,
        priority: lastHistory?.priority,
        criticality: lastHistory?.criticality,
        ...(filesWithAbsolute.length ? { files: filesWithAbsolute } : {}),
        ...(subareaSnapshot ? { subarea: subareaSnapshot } : {}),
      };
    }),
  );

  return claimsWithStatus;
}



async findOne(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Claim not found');
  const claim = await this.claimRepository.findById(id); // ✅ repositorio
  if (!claim) throw new NotFoundException('Claim not found');

  if (claim?.history && Array.isArray(claim.history)) {
    claim.history = (claim.history as any[]).map((h: any) => {
      const sub = h?.subarea
        ? {
            _id: h.subarea._id,
            name: h.subarea.name,
            area: h.subarea.area
              ? { _id: h.subarea.area._id, name: h.subarea.area.name }
              : undefined,
          }
        : undefined;
      return { ...h, ...(sub ? { subarea: sub } : {}) };
    });
  }

  if (claim && Array.isArray((claim as any).files)) {
    (claim as any).files = (claim as any).files.map((f: any) => ({
      _id: f._id,
      name: f.name,
      fileType: f.fileType,
      url: this.buildAbsoluteUrl(f.url),
    }));
  }

  return claim;
}


  async updateWithHistory(
    id: string,
    updateClaimDto: UpdateClaimDto,
    currentUser?: { id?: string; _id?: string },
  ) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Claim not found');

    const lastHistory = await this.historyModel
      .findOne({ claim: new Types.ObjectId(id) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (lastHistory?.claimStatus === ClaimStatus.RESOLVED) {
      throw new ConflictException('This claim has been resolved and cannot be updated.');
    }

    const updated = await this.claimRepository.updateBase(
      id,
      ClaimMapper.toUpdatePersistence(updateClaimDto), // ✅ mapper
    );
    if (!updated) throw new NotFoundException('Claim not found');

    let subareaIdToStore: Types.ObjectId | undefined = undefined;
    if (updateClaimDto.subarea && Types.ObjectId.isValid(updateClaimDto.subarea)) {
      subareaIdToStore = new Types.ObjectId(updateClaimDto.subarea);
    } else if ((updated as any)?.subarea) {
      subareaIdToStore = new Types.ObjectId(String((updated as any).subarea));
    }

    if (lastHistory?._id) {
      await this.historyModel.findByIdAndUpdate(lastHistory._id, {
        endTime: new Date(),
        endDate: new Date(),
      });
    }

    const history = new this.historyModel(
      ClaimMapper.toCreateHistoryPersistence({
        action: updateClaimDto.actions || 'Actualización de reclamo',
        claimId: id,
        userId: currentUser?.id ?? String(currentUser?._id ?? updated.user),
        claimStatus: updateClaimDto.claimStatus,
        priority: updateClaimDto.priority,
        criticality: updateClaimDto.criticality,
        claimType: updateClaimDto.claimType,
        subarea: updateClaimDto.subarea,
      }),
    );
    await history.save();
    await this.claimRepository.pushHistory(new Types.ObjectId(id), history._id);

    const fullClaim = await this.findOne(id);
    let subareaSnapshot: any = undefined;
    if (subareaIdToStore) {
      const sub = await this.subAreaModel
        .findById(subareaIdToStore)
        .populate({ path: 'area', select: 'name' })
        .lean()
        .exec();
      if (sub) {
        subareaSnapshot = {
          _id: sub._id,
          name: sub.name,
          area: sub.area
            ? { _id: (sub.area as any)._id, name: (sub.area as any).name }
            : undefined,
        };
      }
    }

    return {
      ...fullClaim,
      claimStatus: history.claimStatus,
      ...(subareaSnapshot ? { subarea: subareaSnapshot } : {}),
    };
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Claim not found');
    await this.claimRepository.delete(id);
  }

  async getHistory(claimId: string) {
    if (!Types.ObjectId.isValid(claimId)) throw new NotFoundException('Claim not found');
    const histories = await this.historyModel
      .find({ claim: new Types.ObjectId(claimId) })
      .populate({ path: 'user', select: 'email firstName lastName role phone' })
      .populate({ path: 'subarea', select: 'name area', populate: { path: 'area', select: 'name' } })
      .lean()
      .exec();

    return (histories || []).map((h: any) => {
      const sub = h?.subarea
        ? {
            _id: h.subarea._id,
            name: h.subarea.name,
            area: h.subarea.area ? { _id: h.subarea.area._id, name: h.subarea.area.name } : undefined,
          }
        : undefined;
      const { /* keep others intact */ ...rest } = h as Record<string, unknown>;
      return {
        ...rest,
        ...(sub ? { subarea: sub } : {}),
      };
    });
  }

  async postMessage(
    claimId: string,
    user: Payload & { id?: string; _id?: Types.ObjectId | string },
    body: { content: string; state: 'PRIVADO' | 'PUBLICO' },
  ) {
    const msg = new this.messageModel({
      claim: new Types.ObjectId(claimId),
      user: new Types.ObjectId(user.id ?? user._id),
      content: body.content,
      state: body.state,
    });
    return msg.save();
  }

  async getMessages(claimId: string) {
    return this.messageModel
      .find({ claim: new Types.ObjectId(claimId) })
      .populate({ path: 'user', select: 'firstName lastName' })
      .lean()
      .exec();
  }

  async attachFilesToClaim(claimId: string, files: Express.Multer.File[] = []) {
    if (!Types.ObjectId.isValid(claimId)) throw new NotFoundException('Claim not found');
    const claim = await this.claimRepository.findById(claimId);
    if (!claim) throw new NotFoundException('Claim not found');

    const maxFiles = 2;
    if (files.length === 0) throw new BadRequestException('No files uploaded');
    if (files.length > maxFiles) throw new BadRequestException('Maximum 2 files allowed');

    const toCreate = await Promise.all(
      files.map(async (f) => {
        const ext = (f.originalname.split('.').pop() || '').toLowerCase();
        const type: FileTypeEnum = ['png', 'jpg', 'jpeg'].includes(ext)
          ? FileTypeEnum.IMAGE
          : FileTypeEnum.PDF;
        const publicUrl = `/uploads/${f.filename}`;
        const created = new this.fileModel({
          name: f.originalname,
          fileType: type,
          url: publicUrl,
        });
        return created.save();
      }),
    );

    const ids = toCreate.map((doc) => doc._id);
    await this.claimRepository.pushFiles(new Types.ObjectId(claimId), ids);

    return {
      claimId,
      files: toCreate.map((doc) => ({
        _id: doc._id,
        name: doc.name,
        fileType: doc.fileType,
        url: this.buildAbsoluteUrl(doc.url),
      })),
    };
  }
}
