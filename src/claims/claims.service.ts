import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Claim, ClaimDocument, ClaimPriorityEnum, ClaimCriticalityEnum, ClaimTypeEnum } from '../mongoose/schemas/claim.schema';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ClaimStateHistory, ClaimStateHistoryDocument, ClaimStatusEnum } from '../mongoose/schemas/claim-state-history.schema';
import { RoleEnum, UserDocument, User } from '../mongoose/schemas/user.schema';
import { Project, ProjectDocument } from '../mongoose/schemas/project.schema';
import { ClaimMessage, ClaimMessageDocument } from '../mongoose/schemas/claim-message.schema';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectModel(Claim.name) private claimModel: Model<ClaimDocument>,
    @InjectModel(ClaimStateHistory.name) private historyModel: Model<ClaimStateHistoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(ClaimMessage.name) private messageModel: Model<ClaimMessageDocument>,
  ) {}

  async create(createClaimDto: CreateClaimDto, userId: string) {
    const created = new this.claimModel({
      code: createClaimDto.code,
      description: createClaimDto.description,
      claimType: createClaimDto.claimType,
      priority: createClaimDto.priority,
      criticality: createClaimDto.criticality,
      project: new Types.ObjectId(createClaimDto.project),
      user: new Types.ObjectId(userId),
      ...(createClaimDto.file && { file: new Types.ObjectId(createClaimDto.file) }),
    });
    const claim = await created.save();

    const history = new this.historyModel({
      action: 'Creación del reclamo',
      startTime: new Date(),
      startDate: new Date(),
      claim: claim._id,
      claimState: ClaimStatusEnum.PENDING,
      priority: claim.priority,
      severity: claim.severity,
      user: claim.user,
    });
    await history.save();
    await this.claimModel.findByIdAndUpdate(claim._id, { $push: { history: history._id } });
    return claim;
  }

  async findAllForUser(user: any) {
    const query: any = {};
    if (user?.role === RoleEnum.CUSTOMER) {
      query.user = new Types.ObjectId(user.id || user._id);
    }
    return this.claimModel
      .find(query)
      .populate({ path: 'project', populate: { path: 'user', select: 'email firstName lastName role phone' } })
      .populate({ path: 'area', select: 'name' })
      .lean()
      .exec();
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Claim not found');
    return this.claimModel.findById(id).exec();
  }

  async updateWithHistory(id: string, updateClaimDto: UpdateClaimDto) {
    const updated = await this.claimModel.findByIdAndUpdate(
      id,
      {
        ...(updateClaimDto.claimStatus && { claimStatus: updateClaimDto.claimStatus }),
        ...(updateClaimDto.claimType && { claimType: updateClaimDto.claimType }),
        ...(updateClaimDto.priority && { priority: updateClaimDto.priority }),
        ...(updateClaimDto.criticality && { severity: updateClaimDto.criticality }),
        ...(updateClaimDto.project && { project: new Types.ObjectId(updateClaimDto.project) }),
        ...(updateClaimDto.subarea && { subarea: updateClaimDto.subarea }),
        ...(updateClaimDto.area && { area: updateClaimDto.area }),
      } as any,
      { new: true },
    ).exec();
    if (!updated) throw new NotFoundException('Claim not found');

    if (updateClaimDto.actions || updateClaimDto.claimStatus) {
      const history = new this.historyModel({
        action: updateClaimDto.actions || 'Actualización de reclamo',
        startTime: new Date(),
        startDate: new Date(),
        claim: new Types.ObjectId(id),
        claimState: (updateClaimDto.claimStatus as any) || ClaimStatusEnum.IN_PROGRESS,
        priority: updated.priority,
        severity: updated.severity,
        user: updated.user,
      } as any);
      await history.save();
      await this.claimModel.findByIdAndUpdate(id, { $push: { history: history._id } });
    }
    return updated;
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

  async postMessage(claimId: string, user: any, body: { content: string; state: 'PRIVADO' | 'PUBLICO' }) {
    const msg = new this.messageModel({
      claim: new Types.ObjectId(claimId),
      user: new Types.ObjectId(user.id || user._id),
      content: body.content,
      state: body.state,
    } as any);
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
