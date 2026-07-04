/** ISO-строка из timestamp поля lean-документа */
export function docCreatedAt(value: unknown): string | undefined {
    if (!value || typeof value !== 'object') {
        return undefined;
    }
    const createdAt = (value as { createdAt?: Date | string }).createdAt;
    if (!createdAt) {
        return undefined;
    }
    if (createdAt instanceof Date) {
        return createdAt.toISOString();
    }
    return String(createdAt);
}
