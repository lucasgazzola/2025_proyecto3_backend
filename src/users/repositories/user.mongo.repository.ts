import { User } from "../user.entity";
import { UserMapper } from "../mappers/user.mongo.mapper";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserDocument } from "src/mongoose/schemas/user.schema";
import { CreateUserDto } from "../dto/create-user.dto";
import { Types } from "mongoose";

export class UserRepository implements UserRepository{

    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ){}

    async create(data: CreateUserDto): Promise<User> {
        const created = new this.userModel(data);

        return UserMapper.toDomain(await created.save());
    }

    async findAll(): Promise<User[]> {
        const users = await this.userModel.find().exec();

        return users.map(UserMapper.toDomain);
    }

    async findById(id: string): Promise<User | null> {

        if (!Types.ObjectId.isValid(id))
            return null;

        const user = await this.userModel.findById(id).exec();

        return UserMapper.toDomain(user);
    }

    async findByEmail(email: string): Promise<User | null> {

        const user = await this.userModel.findOne({ email }).exec();

        return UserMapper.toDomain(user);
    }

    async findByEmailWithPassword(email: string): Promise<User | null> {

        const user = await this.userModel.findOne({ email }).select('+password').exec();

        return UserMapper.toDomain(user);
    }

    async update(id: string, data: any): Promise<any> {

        return this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
    }

    async delete(id: string): Promise<any> {

        const user = await this.userModel.findOneAndUpdate(
            { _id: id },
            { deletedAt: new Date() },
            { new: true },
        ).exec();

        return UserMapper.toDomain(user);
    }
}