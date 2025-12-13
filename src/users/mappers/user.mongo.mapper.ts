import { RoleEnum, UserDocument } from "src/mongoose/schemas/user.schema";
import { Role } from "src/common/enums/roles.enums";
import { UpdateUserDto } from "../dto/update-user.dto";
import { Types } from "mongoose";

export class UserMapper {
    
    static toDomain(user: any): any | null {

        if (user == null || user == undefined) return null;
        
        return {
            id: user._id?.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            subArea: user.subArea,
            fechaRegistro: user.fechaRegistro,
            deletedAt: user.deletedAt
        };
    }

    // Similar to toDomain but includes the password field (for internal use only,
    // e.g. authentication flow). Keep this separate so public API objects don't
    // accidentally leak the hash.
    static toDomainWithPassword(user: any): any | null {
        if (user == null || user == undefined) return null;

        return {
            id: user._id?.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            subArea: user.subArea,
            fechaRegistro: user.fechaRegistro,
            deletedAt: user.deletedAt,
            password: (user as any).password,
        };
    }

    static toCreatePersistance(user: any): any {
        return {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: user.password,
            phone: user.phone,
            role: user.role ?? Role.USER,
            subArea: user.subArea ?? undefined
        };
    }

    static toUpdatePersistance(dto: UpdateUserDto): any {
        
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