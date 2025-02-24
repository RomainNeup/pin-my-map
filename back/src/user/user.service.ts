import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserRegisterDto, UserDto, UserInfoDto } from "src/user/user.dto";
import { User } from "src/user/user.entity";
import { UserMapper } from "src/user/user.mapper";

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>
    ) {}

    async create(createUserDto: UserRegisterDto): Promise<UserDto> {
        const user = new this.userModel(createUserDto);
        const result = await user.save();

        return UserMapper.mapToDto(result);
    }

    async findAll(): Promise<UserInfoDto[]> {
        const result = await this.userModel.find().exec();
        return UserMapper.mapToInfoDtoList(result);
    }

    async findOne(id: string): Promise<UserInfoDto> {
        const result = await this.userModel.findById(id).exec();

        if (!result) {
            throw new NotFoundException('User not found');
        }

        return UserMapper.mapToInfoDto(result);
    }

    async findByEmail(email: string): Promise<UserInfoDto> {
        const result = await this.userModel.findOne({email}).exec();

        if (!result) {
            throw new NotFoundException('User not found');
        }

        return UserMapper.mapToInfoDto(result);
    }

    async exists(email: string): Promise<boolean> {
        try {
            await this.findByEmail(email);
            return true;
        }
        catch (e) {
            return false;
        }
    }
}