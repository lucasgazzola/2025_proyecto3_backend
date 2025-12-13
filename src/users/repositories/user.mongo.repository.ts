import { User } from "../user.entity";
import { UserMapper, UserDomain } from "../mappers/user.mongo.mapper";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserDocument } from "src/mongoose/schemas/user.schema";
import { CreateUserDto } from "../dto/create-user.dto";
import { Types } from "mongoose";

export class UserRepository implements UserRepository{

    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ){}

    async create(data: CreateUserDto): Promise<UserDomain> {
        const created = new this.userModel(data);
        const saved = await created.save();
        const domain = UserMapper.toDomain(saved);
        // Al crear, no esperamos null; si ocurre, lanzamos error lógico
        if (!domain) throw new Error('Failed to map created user');
        return domain;
    }

    async findAll(): Promise<UserDomain[]> {
        const users = await this.userModel.find().exec();

        return users.map((u) => UserMapper.toDomain(u)!).filter(Boolean);
    }

    async findById(id: string): Promise<UserDomain | null> {

        if (!Types.ObjectId.isValid(id))
            return null;

        const user = await this.userModel.findById(id).exec();

        return UserMapper.toDomain(user);
    }

    async findByEmail(email: string): Promise<UserDomain | null> {

        const user = await this.userModel.findOne({ email }).exec();

        return UserMapper.toDomain(user);
    }

    async findByEmailWithPassword(email: string): Promise<UserDomain | null> {

        const user = await this.userModel.findOne({ email }).select('+password').exec();

        // return a domain object that includes the password hash for internal
        // authentication usage (AuthService). Do NOT expose this object
        // through public APIs.
        return UserMapper.toDomainWithPassword(user);
    }

    async update(id: string, data: Partial<UserDocument>): Promise<UserDomain | null> {

        const updated = await this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
        return UserMapper.toDomain(updated);
    }

    async delete(id: string): Promise<UserDomain | null> {

        const user = await this.userModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: new Date() },
            { new: true },
        ).exec();

        return UserMapper.toDomain(user);
    }
}