import {
    DatabaseProp,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { AppUserRole } from 'src/common/constants/app-role.constant';

import { ApiProperty } from '@nestjs/swagger';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const TableName = 'users';

@Schema({
    collection: TableName,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})
export class UsersEntity extends Document {
    @DatabaseProp({ type: String, default: null })
    @ApiProperty({ description: 'Аватар пользователя' })
    avatar?: string;

    @ApiProperty({ description: 'Телефон пользователя' })
    @Prop({ type: String, required: false })
    phone: string;

    @ApiProperty({ description: 'Хэш пароля (опционально при OAuth Apple/Google, TZ п.2)' })
    @Prop({ type: String, required: false })
    password?: string;

    @ApiProperty({ description: 'Apple ID (OAuth, TZ п.2)', required: false })
    @Prop({ type: String, required: false, unique: true, sparse: true })
    appleId?: string;

    @ApiProperty({ description: 'Google ID (OAuth, TZ п.2)', required: false })
    @Prop({ type: String, required: false, unique: true, sparse: true })
    googleId?: string;

    @ApiProperty({ description: 'Полное имя пользователя (ФИО)' })
    @Prop({ type: String, required: false, default: '' })
    fullName?: string;

    @ApiProperty({ description: 'Город пользователя' })
    @Prop({ type: String, required: false, default: '' })
    city?: string;

    @ApiProperty({ description: 'Год рождения (для рекомендаций по возрасту)', required: false })
    @Prop({ type: Number, required: false })
    birthYear?: number;

    @ApiProperty({ description: 'Email пользователя' })
    @Prop({ type: String, required: false })
    email: string;

    @ApiProperty({ description: 'Компания (необязательно)' })
    @Prop({ type: String, required: false })
    company?: string;

    @ApiProperty({
        description: 'Тип клиента (B2C или B2B)',
        enum: ['B2C', 'B2B'],
    })
    @Prop({
        type: String,
        required: true,
        default: 'B2C',
        enum: ['B2C', 'B2B'],
    })
    clientType: string;

    /** Роль пользователя (TZ п.2) */
    @ApiProperty({
        description: 'Роль пользователя на платформе',
        enum: AppUserRole,
        example: AppUserRole.USER,
    })
    @Prop({
        type: String,
        enum: Object.values(AppUserRole),
        default: AppUserRole.USER,
    })
    role: AppUserRole;

    @ApiProperty({ description: 'Активен ли пользователь' })
    @Prop({ type: Boolean, default: true })
    isActive: boolean;

    @DatabaseProp({ type: String, default: null })
    @ApiProperty({ description: 'Код для подтверждения телефона' })
    phoneConfirmationCode?: string;

    @DatabaseProp({ type: String, default: null })
    @ApiProperty({ description: 'Код для восстановления пароля' })
    passwordResetCode?: string;

    @DatabaseProp({ type: String, default: null })
    @ApiProperty({ description: 'Код для подтверждения email' })
    emailConfirmationCode?: string;

    @DatabaseProp({ type: Boolean, default: false })
    @ApiProperty({ description: 'Подтвержден ли email' })
    isEmailConfirmed: boolean;

    @DatabaseProp({ type: Date, default: Date.now })
    @ApiProperty({ description: 'Дата регистрации' })
    registrationDate: Date;

    @DatabaseProp({ type: Boolean, default: false })
    @ApiProperty({ description: 'Статус блокировки (санкция)' })
    isBlocked: boolean;

    @DatabaseProp({ type: String, default: null })
    @ApiProperty({ description: 'Причина блокировки', required: false })
    blockReason?: string;

    @DatabaseProp({ type: Boolean, default: false })
    @ApiProperty({ description: 'Отключение (подписка истекла или ручное отключение)' })
    isDisabled: boolean;

    @DatabaseProp({ type: Date, default: null })
    @ApiProperty({ description: 'Дата последней отправки кода (SMS/Email)' })
    lastCodeSentAt: Date;

    @DatabaseProp({ type: Boolean, default: false })
    @ApiProperty({ description: 'Удален ли пользователь' })
    isDeleted: boolean;

    /** Экран настроек: push-уведомления */
    @DatabaseProp({ type: Boolean, default: true })
    @ApiProperty({ description: 'Push-уведомления', default: true })
    pushNotificationsEnabled: boolean;

    /** Экран настроек: маркетинговая e-mail рассылка */
    @DatabaseProp({ type: Boolean, default: true })
    @ApiProperty({ description: 'E-mail рассылка (новости и предложения)', default: true })
    emailNewsletterEnabled: boolean;

    /** Экран настроек: звук при уведомлениях */
    @DatabaseProp({ type: Boolean, default: true })
    @ApiProperty({ description: 'Звук при push-уведомлениях', default: true })
    notificationSoundEnabled: boolean;

    // ========================================
    // ПОЛЯ ДЛЯ СТАТИСТИКИ ЗАКАЗОВ
    // ========================================
    // Эти поля будут обновляться при создании/изменении заказов
    // через hooks или отдельный сервис синхронизации

    @ApiProperty({ description: 'Количество заказов пользователя' })
    @Prop({ type: Number, default: 0, index: true })
    ordersCount: number;

    @ApiProperty({ description: 'Общая сумма всех заказов' })
    @Prop({ type: Number, default: 0, index: true })
    totalOrdersAmount: number;

    @ApiProperty({ description: 'Дата первого заказа' })
    @Prop({ type: Date, default: null })
    firstOrderDate?: Date;

    @ApiProperty({ description: 'Дата последнего заказа' })
    @Prop({ type: Date, default: null, index: true })
    lastOrderDate?: Date;

    @ApiProperty({ description: 'Средний чек заказа' })
    @Prop({ type: Number, default: 0 })
    averageOrderAmount: number;

    @ApiProperty({ description: 'Дата последней активности (логин, заказ, просмотр и т.д.)' })
    @Prop({ type: Date, default: null, index: true })
    lastActivityAt?: Date;

    @ApiProperty({ description: 'Количество логинов за всё время' })
    @Prop({ type: Number, default: 0 })
    loginCount: number;

    @ApiProperty({ description: 'Дата последнего логина' })
    @Prop({ type: Date, default: null })
    lastLoginAt?: Date;
}

export const UsersSchema = SchemaFactory.createForClass(UsersEntity);
// sparse: несколько пользователей без телефона (регистрация по email) — не дубликат по null
UsersSchema.index({ phone: 1 }, { unique: true, sparse: true });
UsersSchema.index(
    { email: 1 },
    {
        unique: true,
        partialFilterExpression: {
            email: { $exists: true, $type: 'string', $ne: '' },
        },
    },
);
// Индексы для статистики заказов и фильтров
UsersSchema.index({ ordersCount: 1, totalOrdersAmount: 1 });
UsersSchema.index({ lastActivityAt: 1, isActive: 1 });
UsersSchema.index({ clientType: 1, city: 1 });
UsersSchema.index({ isDeleted: 1, isBlocked: 1, isDisabled: 1, isActive: 1 });
UsersSchema.index({ role: 1 });
export type UsersDoc = IDatabaseDocument<UsersEntity>;
