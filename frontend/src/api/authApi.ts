export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  passwordConfirm: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  refresh_token: string;
  user: {
    id: string;
    email?: string;
    fullName?: string;
  };
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Неверный email или пароль';
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return response.json() as Promise<AuthResponse>;
}

export async function register(payload: RegisterPayload): Promise<{ message?: string }> {
  const response = await fetch('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Ошибка регистрации';
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(', ');
      else if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return response.json() as Promise<{ message?: string }>;
}
