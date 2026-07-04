export { CurrentUser } from 'src/common/decorators/current-user.decorator';

/** Случайное целое в диапазоне [min, max) */
export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

/** Форматирование числа с разделителями тысяч (для аналитики DAU/MAU, просмотры) */
export function formatNumber(number: number): string {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
