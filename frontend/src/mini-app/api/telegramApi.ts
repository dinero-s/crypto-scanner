import { miniAppFetch } from './client';
import type { SubscriptionResponse, TelegramAuthResponse } from './types';

export async function authenticateWithInitData(initData: string): Promise<TelegramAuthResponse> {
  return miniAppFetch<TelegramAuthResponse>('/telegram-users/auth', {
    method: 'POST',
    body: JSON.stringify({ initData }),
  });
}

export async function fetchSubscription(): Promise<SubscriptionResponse> {
  return miniAppFetch<SubscriptionResponse>('/telegram-users/subscription');
}
