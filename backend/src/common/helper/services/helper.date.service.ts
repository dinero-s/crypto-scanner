import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import moment, { ISO_8601 } from 'moment-timezone';
import {
    ENUM_HELPER_DATE_DIFF,
    ENUM_HELPER_DATE_FORMAT,
} from 'src/common/helper/constants/helper.enum.constant';
import { IHelperDateService } from 'src/common/helper/interfaces/helper.date-service.interface';
import {
    IHelperDateSetTimeOptions,
    IHelperDateFormatOptions,
    IHelperDateDiffOptions,
    IHelperDateCreateOptions,
    IHelperDateForwardOptions,
    IHelperDateBackwardOptions,
    IHelperDateRoundDownOptions,
} from 'src/common/helper/interfaces/helper.interface';

/** Утилиты работы с датами/временем с учётом таймзоны приложения */
@Injectable()
export class HelperDateService implements IHelperDateService {
    private readonly defTz: string;

    constructor(private readonly configService: ConfigService) {
        this.defTz = this.configService.get<string>('app.timezone');
    }

    /** Считает возраст по дате рождения, опционально на заданный год */
    calculateAge(dateOfBirth: Date, year?: number): number {
        const m = moment().tz(this.defTz);

        if (year) {
            m.set('year', year);
        }

        return m.diff(dateOfBirth, 'years');
    }

    /** Считает разницу между датами в нужных единицах */
    diff(
        dateOne: Date,
        dateTwoMoreThanDateOne: Date,
        options?: IHelperDateDiffOptions
    ): number {
        const mDateOne = moment(dateOne).tz(this.defTz);
        const mDateTwo = moment(dateTwoMoreThanDateOne).tz(this.defTz);
        const diff = moment.duration(mDateTwo.diff(mDateOne));

        if (options?.format === ENUM_HELPER_DATE_DIFF.MILIS) {
            return diff.asMilliseconds();
        } else if (options?.format === ENUM_HELPER_DATE_DIFF.SECONDS) {
            return diff.asSeconds();
        } else if (options?.format === ENUM_HELPER_DATE_DIFF.HOURS) {
            return diff.asHours();
        } else if (options?.format === ENUM_HELPER_DATE_DIFF.MINUTES) {
            return diff.asMinutes();
        } else {
            return diff.asDays();
        }
    }

    /** Проверяет корректность даты в формате YYYY-MM-DD */
    check(date: string | Date | number): boolean {
        return moment(date, 'YYYY-MM-DD', true).tz(this.defTz).isValid();
    }

    /** Проверяет корректность ISO-даты */
    checkIso(date: string | Date | number): boolean {
        return moment(date, ISO_8601, true).tz(this.defTz).isValid();
    }

    /** Проверяет корректность timestamp */
    checkTimestamp(timestamp: number): boolean {
        return moment(timestamp, true).tz(this.defTz).isValid();
    }

    /** Создаёт дату с учётом таймзоны, опционально в начале дня */
    create(
        date?: string | number | Date,
        options?: IHelperDateCreateOptions
    ): Date {
        const mDate = moment(date ?? undefined).tz(this.defTz);

        if (options?.startOfDay) {
            mDate.startOf('day');
        }

        return mDate.toDate();
    }

    /** Создаёт timestamp с учётом таймзоны, опционально в начале дня */
    createTimestamp(
        date?: string | number | Date,
        options?: IHelperDateCreateOptions
    ): number {
        const mDate = moment(date ?? undefined).tz(this.defTz);

        if (options?.startOfDay) {
            mDate.startOf('day');
        }

        return mDate.valueOf();
    }

    /** Форматирует дату по шаблону/локали */
    format(date: Date, options?: IHelperDateFormatOptions): string {
        if (options?.locale) {
            moment.locale(options.locale);
        }

        return moment(date)
            .tz(this.defTz)
            .format(options?.format ?? ENUM_HELPER_DATE_FORMAT.DATE);
    }

    /** Строит ISO-длительность из минут */
    formatIsoDurationFromMinutes(minutes: number): string {
        return moment.duration(minutes, 'minutes').toISOString();
    }

    /** Строит ISO-длительность из часов */
    formatIsoDurationFromHours(hours: number): string {
        return moment.duration(hours, 'hours').toISOString();
    }

    /** Строит ISO-длительность из дней */
    formatIsoDurationFromDays(days: number): string {
        return moment.duration(days, 'days').toISOString();
    }

    /** Сдвигает дату вперёд на указанное количество секунд */
    forwardInSeconds(
        seconds: number,
        options?: IHelperDateForwardOptions
    ): Date {
        return moment(options?.fromDate)
            .tz(this.defTz)
            .add(seconds, 'seconds')
            .toDate();
    }

    /** Сдвигает дату назад на указанное количество секунд */
    backwardInSeconds(
        seconds: number,
        options?: IHelperDateBackwardOptions
    ): Date {
        return moment(options?.fromDate)
            .tz(this.defTz)
            .subtract(seconds, 'seconds')
            .toDate();
    }

    /** Сдвигает дату вперёд на указанное количество минут */
    forwardInMinutes(
        minutes: number,
        options?: IHelperDateForwardOptions
    ): Date {
        return moment(options?.fromDate)
            .tz(this.defTz)
            .add(minutes, 'minutes')
            .toDate();
    }

    /** Сдвигает дату назад на указанное количество минут */
    backwardInMinutes(
        minutes: number,
        options?: IHelperDateBackwardOptions
    ): Date {
        return moment(options?.fromDate)
            .tz(this.defTz)
            .subtract(minutes, 'minutes')
            .toDate();
    }

    /** Сдвигает дату вперёд на указанное количество часов */
    forwardInHours(hours: number, options?: IHelperDateForwardOptions): Date {
        return moment(options?.fromDate)
            .tz(this.defTz)
            .add(hours, 'hours')
            .toDate();
    }

    /** Сдвигает дату назад на указанное количество часов */
    backwardInHours(hours: number, options?: IHelperDateBackwardOptions): Date {
        return moment(options?.fromDate)
            .tz(this.defTz)
            .subtract(hours, 'hours')
            .toDate();
    }

    /** Сдвигает дату вперёд на указанное количество дней */
    forwardInDays(days: number, options?: IHelperDateForwardOptions): Date {
        return moment(options?.fromDate).tz(this.defTz).add(days, 'd').toDate();
    }

    /** Сдвигает дату назад на указанное количество дней */
    backwardInDays(days: number, options?: IHelperDateBackwardOptions): Date {
        return moment(options?.fromDate)
            .tz(this.defTz)
            .subtract(days, 'days')
            .toDate();
    }

    /** Сдвигает дату вперёд на указанное количество месяцев */
    forwardInMonths(months: number, options?: IHelperDateForwardOptions): Date {
        return moment(options?.fromDate)
            .tz(this.defTz)
            .add(months, 'months')
            .toDate();
    }

    /** Сдвигает дату назад на указанное количество месяцев */
    backwardInMonths(
        months: number,
        options?: IHelperDateBackwardOptions
    ): Date {
        return moment(options?.fromDate)
            .tz(this.defTz)
            .subtract(months, 'months')
            .toDate();
    }

    /** Сдвигает дату вперёд на указанное количество лет */
    forwardInYears(years: number, options?: IHelperDateForwardOptions): Date {
        return moment(options?.fromDate)
            .tz(this.defTz)
            .add(years, 'years')
            .toDate();
    }

    /** Сдвигает дату назад на указанное количество лет */
    backwardInYears(years: number, options?: IHelperDateBackwardOptions): Date {
        return moment(options?.fromDate)
            .tz(this.defTz)
            .subtract(years, 'years')
            .toDate();
    }

    /** Возвращает конец месяца для даты */
    endOfMonth(date?: Date): Date {
        return moment(date).tz(this.defTz).endOf('month').toDate();
    }

    /** Возвращает начало месяца для даты */
    startOfMonth(date?: Date): Date {
        return moment(date).tz(this.defTz).startOf('month').toDate();
    }

    /** Возвращает конец года для даты */
    endOfYear(date?: Date): Date {
        return moment(date).tz(this.defTz).endOf('year').toDate();
    }

    /** Возвращает начало года для даты */
    startOfYear(date?: Date): Date {
        return moment(date).tz(this.defTz).startOf('year').toDate();
    }

    /** Возвращает конец дня для даты */
    endOfDay(date?: Date): Date {
        return moment(date).tz(this.defTz).endOf('day').toDate();
    }

    /** Возвращает начало дня для даты */
    startOfDay(date?: Date): Date {
        return moment(date).tz(this.defTz).startOf('day').toDate();
    }

    /** Устанавливает время в дате по компонентам */
    setTime(
        date: Date,
        { hour, minute, second, millisecond }: IHelperDateSetTimeOptions
    ): Date {
        return moment(date)
            .tz(this.defTz)
            .set({
                hour: hour,
                minute: minute,
                second: second,
                millisecond: millisecond,
            })
            .toDate();
    }

    /** Добавляет ко времени даты указанные компоненты */
    addTime(
        date: Date,
        { hour, minute, second, millisecond }: IHelperDateSetTimeOptions
    ): Date {
        return moment(date)
            .tz(this.defTz)
            .add({
                hour: hour,
                minute: minute,
                second: second,
                millisecond: millisecond,
            })
            .toDate();
    }

    /** Вычитает из времени даты указанные компоненты */
    subtractTime(
        date: Date,
        { hour, minute, second }: IHelperDateSetTimeOptions
    ): Date {
        return moment(date)
            .tz(this.defTz)
            .subtract({
                hour: hour,
                minute: minute,
                second: second,
            })
            .toDate();
    }

    /** Округляет дату вниз по выбранным полям (час, минута и т.д.) */
    roundDown(date: Date, options?: IHelperDateRoundDownOptions): Date {
        const mDate = moment(date).tz(this.defTz);

        if (options?.hour) {
            mDate.set({ hour: 0 });
        }

        if (options?.minute) {
            mDate.set({ minute: 0 });
        }

        if (options?.second) {
            mDate.set({ second: 0 });
        }

        if (options?.millisecond) {
            mDate.set({ millisecond: 0 });
        }

        return mDate.toDate();
    }
}
