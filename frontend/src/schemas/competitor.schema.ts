import { z } from 'zod';

export const addCompetitorSchema = z.object({
  connectionId: z.string().min(1, 'Выберите подключение'),
  url: z
    .string()
    .min(1, 'Укажите URL карточки Ozon')
    .refine(
      (value) =>
        value.includes('ozon.ru') ||
        /^\d{5,}$/.test(value.trim()),
      'Введите корректную ссылку Ozon или product_id',
    ),
});

export type AddCompetitorFormValues = z.infer<typeof addCompetitorSchema>;
