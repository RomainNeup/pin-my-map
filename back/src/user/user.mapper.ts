import { UserDto, UserInfoDto } from "src/user/user.dto";
import { User } from "src/user/user.entity";

export class UserMapper {
    static mapToDto(entity: User): UserDto {
        return {
            name: entity.name,
            email: entity.email
        };
    }

    static mapToInfoDto(entity: User & { _id: any }): UserInfoDto {
        return {
            id: entity._id.toHexString(),
            name: entity.name,
            email: entity.email,
            password: entity.password
        };
    }

    static mapToInfoDtoList(entities: (User & { _id: any })[]): UserInfoDto[] {
        return entities.map(entity => this.mapToInfoDto(entity));
    }

    static userInfoDtoToUserDto(userInfoDto: UserInfoDto): UserDto {
        return {
            name: userInfoDto.name,
            email: userInfoDto.email
        };
    }
}