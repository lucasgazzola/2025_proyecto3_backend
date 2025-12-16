import { RoleEnum, UserDocument } from "src/mongoose/schemas/user.schema";
import { Role } from "src/common/enums/roles.enums";
import { UpdateUserDto } from "../dto/update-user.dto";
import { Types } from "mongoose";

export type UserDomain = {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: RoleEnum;
    subArea?: Types.ObjectId | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
};

export type UserDomainWithPassword = UserDomain & {
    password: string;
};

export class UserMapper {

    static toDomain(user: UserDocument | null): UserDomain | null {

        if (user == null || user == undefined) return null;

        return {
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            subArea: user.subArea ?? null,
            createdAt: user.createdAt,
            deletedAt: user.deletedAt
        };
    }

    static toDomainWithPassword(user: UserDocument | null): UserDomainWithPassword | null {

        if (user == null || user == undefined) return null;

        return {
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: user.password,
            phone: user.phone,
            role: user.role,
            subArea: user.subArea ?? null,
            createdAt: user.createdAt,
            deletedAt: user.deletedAt
        };
    }

    static toCreatePersistance(user: Partial<UserDomain> & { password: string }): Partial<UserDocument> {
        return {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: user.password,
            phone: user.phone,
            role: (user.role as RoleEnum) ?? Role.USER,
            subArea: user.subArea ?? undefined
        };
    }

    static toUpdatePersistance(dto: UpdateUserDto): Partial<UserDocument> {

        const data: Partial<UserDocument> = {};

        if (dto.firstName) data.firstName = dto.firstName;
        if (dto.lastName) data.lastName = dto.lastName;
        if (dto.email) data.email = dto.email;
        if (dto.password) data.password = dto.password;
        if (dto.phone) data.phone = dto.phone;
        if (dto.role) data.role = dto.role as unknown as RoleEnum;
        if (dto.subArea) {
            data.subArea = new Types.ObjectId(dto.subArea);
        }

        return data;
    }
}