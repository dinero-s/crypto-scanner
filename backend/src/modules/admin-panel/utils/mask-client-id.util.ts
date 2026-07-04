/** Маскирует Client-Id для admin UI: 1234****7890 */
export function maskClientId(clientId: string): string {
    const trimmed = clientId.trim();
    if (trimmed.length <= 8) {
        return `${trimmed.slice(0, 2)}****`;
    }
    return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
}
