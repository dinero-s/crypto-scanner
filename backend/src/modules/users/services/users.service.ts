import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersEntity } from '../entities/users.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UpdateUserProfileDto } from '../dtos/update-user-profile.dto';
import {
    RegisterDto,
    LoginDto,
    LoginByCodeDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    ConfirmEmailDto,
    LoginWithGoogleDto,
    LoginWithAppleDto,
} from '../dtos/auth.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UsersRepositoryService } from './users-repository.service';
import { UsersAuthService } from './users-auth.service';
import { UsersManagementService, FindAllOptions } from './users-management.service';
import { UsersExportService } from './users-export.service';
import { StorageService } from 'src/common/storage/storage.service';
import { extname } from 'path';

/** Фасад: делегирует вызовы подсервисам */
@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepositoryService,
        private readonly usersAuth: UsersAuthService,
        private readonly usersManagement: UsersManagementService,
        private readonly usersExport: UsersExportService,
        private readonly storageService: StorageService,
    ) {}

    async findByPhone(phone: string) {
        return this.usersRepository.findByPhone(phone);
    }

    async updatePartial(
        id: string | Types.ObjectId,
        update: Partial<UsersEntity>,
    ) {
        return this.usersRepository.updatePartial(id, update);
    }

    async confirmEmail(confirmEmailDto: ConfirmEmailDto) {
        return this.usersAuth.confirmEmail(confirmEmailDto);
    }

    async resendEmailConfirmation(email: string) {
        return this.usersAuth.resendEmailConfirmation(email);
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        return this.usersAuth.forgotPassword(forgotPasswordDto);
    }

    async changePassword(
        userId: string,
        changePasswordDto: ChangePasswordDto,
        opts?: { resetSession?: boolean },
    ) {
        return this.usersAuth.changePassword(userId, changePasswordDto, opts);
    }

    async loginByCode(loginByCodeDto: LoginByCodeDto) {
        return this.usersAuth.loginByCode(loginByCodeDto);
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        return this.usersAuth.resetPassword(resetPasswordDto);
    }

    async register(registerDto: RegisterDto) {
        return this.usersAuth.register(registerDto);
    }

    async login(loginDto: LoginDto) {
        return this.usersAuth.login(loginDto);
    }

    async loginWithGoogle(loginWithGoogleDto: LoginWithGoogleDto) {
        return this.usersAuth.loginWithGoogle(loginWithGoogleDto);
    }

    async loginWithApple(loginWithAppleDto: LoginWithAppleDto) {
        return this.usersAuth.loginWithApple(loginWithAppleDto);
    }

    async refreshTokens(refreshToken: string) {
        return this.usersAuth.refreshTokens(refreshToken);
    }

    async findAll(options: FindAllOptions) {
        return this.usersManagement.findAll(options);
    }

    async findOne(id: string) {
        return this.usersManagement.findOne(id);
    }

    async findOneAdmin(id: string) {
        return this.usersManagement.findOneAdmin(id);
    }

    async update(id: string, updateData: UpdateUserDto) {
        return this.usersManagement.update(id, updateData);
    }

    async updateProfile(
        id: string,
        updateData: UpdateUserProfileDto,
        file: Express.Multer.File,
    ) {
        const profileRest = { ...updateData };

        if (file) {
            const extension = extname(file.originalname) || '.bin';
            const avatarKey = `users/${id}/avatar${extension}`;
            profileRest.avatar = await this.storageService.uploadFile(
                file,
                avatarKey,
            );
        }

        return this.usersManagement.update(
            id,
            profileRest as unknown as UpdateUserDto,
        );
    }

    async blockUser(id: string, reason: string) {
        return this.usersManagement.blockUser(id, reason);
    }

    async unblockUser(id: string) {
        return this.usersManagement.unblockUser(id);
    }

    async disableUser(id: string) {
        return this.usersManagement.disableUser(id);
    }

    async enableUser(id: string) {
        return this.usersManagement.enableUser(id);
    }

    async updateAdmin(id: string, updateData: UpdateUserDto) {
        return this.usersManagement.updateAdmin(id, updateData);
    }

    async remove(id: string) {
        return this.usersManagement.remove(id);
    }

    async findByEmail(email: string): Promise<UsersEntity | null> {
        return this.usersRepository.findByEmail(email);
    }

    async findById(id: string): Promise<UsersEntity | null> {
        return this.usersRepository.findById(id);
    }

    async findByObjectId(id: Types.ObjectId): Promise<UsersEntity | null> {
        return this.usersRepository.findByObjectId(id);
    }

    async deleteUser(userId: string) {
        return this.usersManagement.deleteUser(userId);
    }

    async exportToCsv(options: FindAllOptions): Promise<string> {
        return this.usersExport.exportToCsv(options);
    }
}
