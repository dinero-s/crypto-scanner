import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepositoryService } from './users-repository.service';
import { UsersEntity } from '../entities/users.entity';
import { UpdateUserNotificationSettingsDto } from '../dtos/update-user-notification-settings.dto';

/** Настройки уведомлений */
export interface UserNotificationSettingsDto {
    pushNotifications: boolean;
    emailNewsletter: boolean;
    notificationSound: boolean;
}

/** Профиль пользователя */
export interface UserProfileDto {
    id: string;
    avatar?: string;
    email: string;
    fullName?: string;
    birthYear?: number;
    notificationSettings: UserNotificationSettingsDto;
}

@Injectable()
export class UsersProfileService {
    constructor(
        private readonly usersRepository: UsersRepositoryService,
    ) {}

    /** Профиль пользователя */
    async getProfile(userId: string): Promise<UserProfileDto> {
        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        return {
            id: String(user._id),
            email: user.email ?? '',
            fullName: user.fullName ?? undefined,
            birthYear: user.birthYear ?? undefined,
            avatar: user.avatar ?? undefined,
            notificationSettings: this.mapNotificationSettings(user),
        };
    }

    /** Текущие настройки уведомлений */
    async getNotificationSettings(
        userId: string,
    ): Promise<UserNotificationSettingsDto> {
        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }
        return this.mapNotificationSettings(user);
    }

    /** Обновление переключателей с экрана настроек (PATCH, частично) */
    async updateNotificationSettings(
        userId: string,
        dto: UpdateUserNotificationSettingsDto,
    ): Promise<UserNotificationSettingsDto> {
        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }
        const patch: Partial<UsersEntity> = {};
        if (dto.pushNotifications !== undefined) {
            patch.pushNotificationsEnabled = dto.pushNotifications;
        }
        if (dto.emailNewsletter !== undefined) {
            patch.emailNewsletterEnabled = dto.emailNewsletter;
        }
        if (dto.notificationSound !== undefined) {
            patch.notificationSoundEnabled = dto.notificationSound;
        }
        if (Object.keys(patch).length > 0) {
            await this.usersRepository.updatePartial(userId, patch);
        }
        const updated = await this.usersRepository.findById(userId);
        if (!updated) {
            throw new NotFoundException('Пользователь не найден');
        }
        return this.mapNotificationSettings(updated);
    }

    private mapNotificationSettings(user: UsersEntity): UserNotificationSettingsDto {
        return {
            pushNotifications: user.pushNotificationsEnabled !== false,
            emailNewsletter: user.emailNewsletterEnabled !== false,
            notificationSound: user.notificationSoundEnabled !== false,
        };
    }
}
