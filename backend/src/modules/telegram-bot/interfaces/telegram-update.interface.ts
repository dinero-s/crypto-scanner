/** Telegram User из update */
export interface TelegramUserPayload {
    id: number;
    is_bot?: boolean;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

/** Telegram Chat */
export interface TelegramChatPayload {
    id: number;
    type: string;
    first_name?: string;
    last_name?: string;
    username?: string;
}

/** Telegram Message */
export interface TelegramMessagePayload {
    message_id: number;
    from?: TelegramUserPayload;
    chat: TelegramChatPayload;
    date: number;
    text?: string;
}

/** Telegram Update */
export interface TelegramUpdatePayload {
    update_id: number;
    message?: TelegramMessagePayload;
}

/** Ответ getUpdates */
export interface TelegramUpdatesResponse {
    ok: boolean;
    result: TelegramUpdatePayload[];
}
