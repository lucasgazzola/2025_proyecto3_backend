import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Claim, ClaimDocument } from '../mongoose/schemas/claim.schema';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';

@Injectable()
export class ClaimsService {
  constructor(@InjectModel(Claim.name) private claimModel: Model<ClaimDocument>) {}

  async create(createClaimDto: CreateClaimDto) {
    const created = new this.claimModel(createClaimDto as any);
    return created.save();
  }

  async findAll() {
    return this.claimModel.find().exec();
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Claim not found');
    return this.claimModel.findById(id).exec();
  }

  async update(id: string, updateClaimDto: UpdateClaimDto) {
    return this.claimModel.findByIdAndUpdate(id, updateClaimDto as any, { new: true }).exec();
  }

  async remove(id: string) {
    return this.claimModel.findByIdAndDelete(id).exec();
  }
}
