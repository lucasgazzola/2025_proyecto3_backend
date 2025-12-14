import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Claim, ClaimDocument } from '../mongoose/schemas/claim.schema';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ClaimStateHistory, ClaimStateHistoryDocument, ClaimStatusEnum } from '../mongoose/schemas/claim-state-history.schema';
import { RoleEnum, UserDocument, User } from '../mongoose/schemas/user.schema';
import { Project, ProjectDocument } from '../mongoose/schemas/project.schema';
import { Area, AreaDocument } from '../mongoose/schemas/area.schema';
import { SubArea, SubAreaDocument } from '../mongoose/schemas/subarea.schema';
import { ClaimMessage, ClaimMessageDocument } from '../mongoose/schemas/claim-message.schema';

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
          .sort({ startDate: -1 })
          .select('claimStatus startDate area')
          .lean()
          .exec();

        const latestStatus: ClaimStatusEnum | undefined = lastHistory?.claimStatus;
        // remove `area` from the returned claim (we store area snapshots in histories instead)
        const { history, area, ...rest } = claim as Record<string, unknown>;
        return {
          ...rest,
          claimStatus: latestStatus,
          area: lastHistory?.area,
        };
      }),
    );

    return claimsWithStatus;
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Claim not found');
    return this.claimModel
      .findById(id)
      .populate({ path: 'project', populate: { path: 'user', select: 'email firstName lastName role phone' } })
      .populate({
        path: 'history',
        select: 'action startTime endTime startDate endDate claimStatus priority criticality user area',
        populate: { path: 'user', select: 'email firstName lastName role phone' },
      })
      .lean()
      .exec();
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
    // Como el área ya no viene en el DTO, derivamos el área desde la subárea (si se envía)
    let areaSnapshot: undefined | { _id: Types.ObjectId; name: string; subarea?: { _id: Types.ObjectId; name: string } } = undefined;
    if (updateClaimDto.subarea && Types.ObjectId.isValid(updateClaimDto.subarea)) {
      const subDoc = await this.subAreaModel
        .findById(updateClaimDto.subarea)
        .populate({ path: 'area', select: 'name' })
        .lean()
        .exec();
      if (subDoc && subDoc.area && (subDoc.area as any)._id) {
        areaSnapshot = {
          _id: (subDoc.area as any)._id,
          name: (subDoc.area as any).name,
          subarea: { _id: subDoc._id, name: subDoc.name },
        };
      }
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
      ...(areaSnapshot ? { area: areaSnapshot } : {}),
    });
    await history.save();
    await this.claimModel.findByIdAndUpdate(id, { $push: { history: history._id } });

    // Devolver el claim actualizado enriquecido con el último estado y el snapshot de área
    const fullClaim = await this.findOne(id);
    return {
      ...fullClaim,
      claimStatus: history.claimStatus,
      area: history.area,
    };
  }

  async remove(id: string) {
    return this.claimModel.findByIdAndDelete(id).exec();
  }

  async getHistory(claimId: string) {
    if (!Types.ObjectId.isValid(claimId)) throw new NotFoundException('Claim not found');
    return this.historyModel
      .find({ claim: new Types.ObjectId(claimId) })
      .populate({ path: 'user', select: 'email firstName lastName role phone' })
      .lean()
      .exec();
  }

  async postMessage(
    claimId: string,
    user: Partial<User> & { id?: string; _id?: Types.ObjectId | string },
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
}
