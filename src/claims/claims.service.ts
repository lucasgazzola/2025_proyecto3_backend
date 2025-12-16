import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Claim, ClaimCriticalityEnum, ClaimDocument, ClaimPriorityEnum, ClaimTypeEnum } from '../mongoose/schemas/claim.schema';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ClaimStateHistory, ClaimStateHistoryDocument, ClaimStatusEnum } from '../mongoose/schemas/claim-state-history.schema';
import { RoleEnum, UserDocument, User } from '../mongoose/schemas/user.schema';
import { Project, ProjectDocument } from '../mongoose/schemas/project.schema';
import { Area, AreaDocument } from '../mongoose/schemas/area.schema';
import { SubArea, SubAreaDocument } from '../mongoose/schemas/subarea.schema';
import { ClaimMessage, ClaimMessageDocument } from '../mongoose/schemas/claim-message.schema';
import { File as FileEntity, FileDocument, FileTypeEnum } from '../mongoose/schemas/file.schema';
import { Payload } from 'src/common/interfaces/payload';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectModel(Claim.name) private claimModel: Model<ClaimDocument>,
    @InjectModel(ClaimStateHistory.name) private historyModel: Model<ClaimStateHistoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Area.name) private areaModel: Model<AreaDocument>,
    @InjectModel(SubArea.name) private subAreaModel: Model<SubAreaDocument>,
    @InjectModel(ClaimMessage.name) private messageModel: Model<ClaimMessageDocument>,
    @InjectModel(FileEntity.name) private fileModel: Model<FileDocument>,
  ) {}

  async create(createClaimDto: CreateClaimDto, userId: string) {
    const created = new this.claimModel({
      description: createClaimDto.description,
      project: new Types.ObjectId(createClaimDto.project),
      user: new Types.ObjectId(userId),
      // ...(createClaimDto.file && { file: new Types.ObjectId(createClaimDto.file) }),
    });
    const claim = await created.save();

    const history = new this.historyModel({
      action: 'Creación del reclamo',
      startTime: new Date(),
      startDate: new Date(),
      claim: claim._id,
      claimStatus: ClaimStatusEnum.PENDING,
      claimType: createClaimDto.claimType,
      priority: createClaimDto.priority,
      criticality: createClaimDto.criticality,
      user: claim.user,
    });
    await history.save();
    await this.claimModel.findByIdAndUpdate(claim._id, { $push: { history: history._id } });
    await this.projectModel.findByIdAndUpdate(claim.project, { $push: { claims: claim._id } });
    return claim;
  }

  async findAllForUser(user: any) {
    const query: any = {};
    if (user?.role === RoleEnum.CUSTOMER) {
      query.user = new Types.ObjectId(user.id || user._id);
    }

    const claims = await this.claimModel
      .find(query)
      .populate({ path: 'project', populate: { path: 'user', select: 'email firstName lastName role phone' } })
      .lean()
      .exec();

    // Para cada claim buscamos el último historial directamente en la colección de historiales
    const claimsWithStatus = await Promise.all(
      (claims || []).map(async (claim: any) => {
        const lastHistory = await this.historyModel
          .findOne({ claim: new Types.ObjectId(claim._id) })
          .sort({ createdAt: -1 })
          .select('priority criticality claimType claimStatus startDate subarea')
          .populate({ path: 'subarea', select: 'name area', populate: { path: 'area', select: 'name' } })
          .lean()
          .exec();

        const latestStatus: ClaimStatusEnum | undefined = lastHistory?.claimStatus;
        const latestType: ClaimTypeEnum | undefined = lastHistory?.claimType;
        const latestPriority: ClaimPriorityEnum | undefined = lastHistory?.priority;
        const latestCriticality: ClaimCriticalityEnum | undefined = lastHistory?.criticality;
        // removemos `history` del claim base, el subarea se arma desde el último historial
        const { history, ...rest } = claim as Record<string, unknown>;

        // Transform snapshot to desired shape: subarea with nested area
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

        return {
          ...rest,
          claimStatus: latestStatus,
          claimType: latestType,
          priority: latestPriority,
          criticality: latestCriticality,
          ...(subareaSnapshot ? { subarea: subareaSnapshot } : {}),
        };
      }),
    );

    return claimsWithStatus;
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Claim not found');
    const claim = await this.claimModel
      .findById(id)
      .populate({ path: 'project', populate: { path: 'user', select: 'email firstName lastName role phone' } })
      .populate({
        path: 'history',
        select: 'action startTime endTime startDate endDate claimStatus priority criticality user subarea',
        populate: [
          { path: 'user', select: 'email firstName lastName role phone' },
          { path: 'subarea', select: 'name area', populate: { path: 'area', select: 'name' } },
        ],
      })
      .lean()
      .exec();

    // Ajustar el shape de cada entrada del historial a { subarea: { _id, name, area: { _id, name } } }
    if (claim?.history && Array.isArray(claim.history)) {
      claim.history = (claim.history as any[]).map((h: any) => {
        const sub = h?.subarea
          ? {
              _id: h.subarea._id,
              name: h.subarea.name,
              area: h.subarea.area ? { _id: h.subarea.area._id, name: h.subarea.area.name } : undefined,
            }
          : undefined;
        return {
          ...h,
          ...(sub ? { subarea: sub } : {}),
        };
      });
    }

    return claim;
  }

  async updateWithHistory(id: string, updateClaimDto: UpdateClaimDto, currentUser?: { id?: string; _id?: string }) {
    // Validar que `id` es un ObjectId válido antes de usarlo
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Claim not found');

    // Si el último historial está RESOLVED, no permitir cambios
    const lastHistory = await this.historyModel
      .findOne({ claim: new Types.ObjectId(id) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (lastHistory?.claimStatus === ClaimStatusEnum.RESOLVED) {
      throw new ConflictException('This claim has been resolved and cannot be updated.');
    }
    // Validate project id in DTO before casting to ObjectId
    const projectUpdate: any = updateClaimDto.project && Types.ObjectId.isValid(updateClaimDto.project)
      ? { project: new Types.ObjectId(updateClaimDto.project) }
      : (updateClaimDto.project ? (() => { throw new BadRequestException('Invalid project id'); })() : {});

    const updated = await this.claimModel.findByIdAndUpdate(
      id,
      {
        // claimType/priority/criticality ya no viven en Claim; quedan en el historial
        ...projectUpdate,
        ...(updateClaimDto.subarea && Types.ObjectId.isValid(updateClaimDto.subarea) && { subarea: new Types.ObjectId(updateClaimDto.subarea) })
      },
      { new: true },
    ).exec();
    if (!updated) throw new NotFoundException('Claim not found');

    // Registrar SIEMPRE una nueva entrada en el historial en cada actualización
    // Guardar referencia a la subárea (que ya está asociada a un área vía relación)
    let subareaIdToStore: Types.ObjectId | undefined = undefined;
    if (updateClaimDto.subarea && Types.ObjectId.isValid(updateClaimDto.subarea)) {
      subareaIdToStore = new Types.ObjectId(updateClaimDto.subarea);
    } else if ((updated as any)?.subarea) {
      subareaIdToStore = new Types.ObjectId(String((updated as any).subarea));
    }

    // Cerrar el historial previo (si existe) estableciendo fecha de fin
    if (lastHistory?._id) {
      await this.historyModel.findByIdAndUpdate(lastHistory._id, {
        endTime: new Date(),
        endDate: new Date(),
      });
    }

    const history = new this.historyModel({
      action: updateClaimDto.actions || 'Actualización de reclamo',
      startTime: new Date(),
      startDate: new Date(),
      claim: new Types.ObjectId(id),
      claimStatus: updateClaimDto.claimStatus,
      priority: updateClaimDto.priority,
      criticality: updateClaimDto.criticality,
      claimType: updateClaimDto.claimType,
      user: new Types.ObjectId(currentUser?.id ?? currentUser?._id ?? String(updated.user)),
      ...(subareaIdToStore ? { subarea: subareaIdToStore } : {}),
    });
    await history.save();
    await this.claimModel.findByIdAndUpdate(id, { $push: { history: history._id } });

    // Devolver el claim actualizado enriquecido con el último estado y el snapshot de subarea+area
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
          area: sub.area ? { _id: (sub.area as any)._id, name: (sub.area as any).name } : undefined,
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
    return this.claimModel.findByIdAndDelete(id).exec();
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

  async attachFilesToClaim(claimId: string, files?: any[]) {
    if (!Types.ObjectId.isValid(claimId)) throw new NotFoundException('Claim not found');
    const claim = await this.claimModel.findById(claimId).exec();
    if (!claim) throw new NotFoundException('Claim not found');

    const maxFiles = 2;
    const incoming = files || [];
    if (incoming.length === 0) throw new BadRequestException('No files uploaded');
    if (incoming.length > maxFiles) throw new BadRequestException('Maximum 2 files allowed');

    const toCreate = await Promise.all(
      incoming.map(async (f) => {
        const ext = (f.originalname.split('.').pop() || '').toLowerCase();
        const type: FileTypeEnum = ['png', 'jpg', 'jpeg'].includes(ext)
          ? FileTypeEnum.IMAGE
          : FileTypeEnum.PDF;
        const publicUrl = `/uploads/${f.filename}`;
        const created = new this.fileModel({ name: f.originalname, fileType: type, url: publicUrl });
        return created.save();
      }),
    );

    const ids = toCreate.map((doc) => doc._id);
    await this.claimModel.findByIdAndUpdate(claimId, { $push: { files: { $each: ids } } }).exec();

    return {
      claimId,
      files: toCreate.map((doc) => ({ _id: doc._id, name: doc.name, fileType: doc.fileType, url: doc.url })),
    };
  }
}
