import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Claim, ClaimDocument } from 'src/mongoose/schemas/claim.schema';
import { IClaimRepository } from './claim.repository.interface';
import { ClaimPopulated } from './claim.repository.interface';

@Injectable()
export class ClaimRepository implements IClaimRepository {

  constructor(
    @InjectModel(Claim.name)
    private readonly claimModel: Model<ClaimDocument>,
  ) {}
async create(data: Partial<ClaimDocument>, session?: ClientSession): Promise<ClaimDocument> {
  const claim = new this.claimModel(data);
  if (session) {
    return claim.save({ session });
  }
  return claim.save();
}

  async findAll(query: Record<string, unknown>): Promise<ClaimPopulated[]> {
    const results = await this.claimModel
      .find(query)
      .populate({
        path: 'project',
        populate: { path: 'user', select: 'email firstName lastName role phone' },
      })
      .populate({ path: 'files', select: 'name fileType url' })
      .lean()
      .exec();

    return results as ClaimPopulated[];
  }

  async findById(id: string, session?: ClientSession): Promise<ClaimPopulated | null> {
    const result = await this.claimModel
      .findById(id, null, { session })
      .populate({
        path: 'project',
        populate: { path: 'user', select: 'email firstName lastName role phone' },
      })
      .populate({
        path: 'history',
        select: 'action startTime endTime startDate endDate claimStatus priority criticality user subarea',
        populate: [
          { path: 'user', select: 'email firstName lastName role phone' },
          { path: 'subarea', select: 'name area', populate: { path: 'area', select: 'name' } },
        ],
      })
      .populate({ path: 'files', select: 'name fileType url' })
      .lean()
      .exec();

    return result as unknown as ClaimPopulated | null;
  }

  async updateBase(
    id: string,
    data: { project?: Types.ObjectId; subarea?: Types.ObjectId },
    session?: ClientSession,
  ): Promise<ClaimDocument | null> {
    return this.claimModel.findByIdAndUpdate(id, data, { new: true, session }).exec();
  }

  async delete(id: string, session?: ClientSession): Promise<void> {
    await this.claimModel.findByIdAndDelete(id, { session }).exec();
  }

async pushHistory(
  claimId: Types.ObjectId,
  historyId: Types.ObjectId,
  session?: ClientSession,
): Promise<void> {
  await this.claimModel.findByIdAndUpdate(
    claimId,
    { $push: { history: historyId } },
    { session },
  );
}



  async pushFiles(
    claimId: Types.ObjectId,
    fileIds: Types.ObjectId[],
    session?: ClientSession,
  ): Promise<void> {
    await this.claimModel.findByIdAndUpdate(
      claimId,
      { $push: { files: { $each: fileIds } } },
      { session },
    );
  }


}
