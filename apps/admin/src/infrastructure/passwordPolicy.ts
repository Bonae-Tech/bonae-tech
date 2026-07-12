const MIN_LENGTH = 12;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_LENGTH} caracteres`;
  }
  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir una letra minúscula';
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir una letra mayúscula';
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir un número';
  }
  return null;
}
