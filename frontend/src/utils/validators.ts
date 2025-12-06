export function validateEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email);
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Пароль должен быть не менее 6 символов' };
  }
  return { valid: true };
}

export function validateRequired(value: string | undefined | null, fieldName: string): { valid: boolean; error?: string } {
  if (!value || value.trim() === '') {
    return { valid: false, error: `${fieldName} обязательно для заполнения` };
  }
  return { valid: true };
}

export function validateNumber(value: number, min?: number, max?: number): { valid: boolean; error?: string } {
  if (min !== undefined && value < min) {
    return { valid: false, error: `Значение должно быть не меньше ${min}` };
  }
  if (max !== undefined && value > max) {
    return { valid: false, error: `Значение должно быть не больше ${max}` };
  }
  return { valid: true };
}
