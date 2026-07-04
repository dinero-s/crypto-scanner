import bytes from 'bytes';

export const FILE_SIZE_IN_BYTES: number = bytes('5mb');

/** Лимит видео: до 1 ГБ на файл в multipart */
export const VIDEO_MAX_BYTES: number = bytes('1gb');

/** Лимит изображений товаров (TZ п.9): до 2 МБ */
export const PRODUCT_IMAGE_MAX_BYTES: number = bytes('2mb');
