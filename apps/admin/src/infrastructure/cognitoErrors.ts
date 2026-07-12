function cognitoCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as { code?: string; name?: string };
  return e.code ?? e.name;
}

function cognitoMessage(err: unknown): string {
  return err instanceof Error ? err.message : '';
}

function messageIncludes(err: unknown, fragment: string): boolean {
  return cognitoMessage(err).toLowerCase().includes(fragment.toLowerCase());
}

export function mapForgotPasswordError(err: unknown): string {
  const code = cognitoCode(err);

  if (
    code === 'InvalidParameterException' &&
    messageIncludes(err, 'no registered/verified email')
  ) {
    return (
      'El restablecimiento no está disponible porque el correo no está verificado. ' +
      'Contacta a tu administrador — puede verificar tu correo en Cognito para que puedas restablecer la contraseña.'
    );
  }

  if (code === 'LimitExceededException' || code === 'TooManyRequestsException') {
    return 'Demasiados intentos de restablecimiento. Espera unos minutos e inténtalo de nuevo.';
  }

  if (code === 'InvalidParameterException') {
    return 'No se pudo enviar un código para ese correo. Verifica la dirección e inténtalo de nuevo.';
  }

  return 'No se pudo enviar el código. Verifica el correo e inténtalo de nuevo, o contacta a tu administrador.';
}

export function mapConfirmPasswordError(err: unknown): string {
  const code = cognitoCode(err);

  if (code === 'CodeMismatchException') {
    return 'El código de verificación es incorrecto. Revisa tu correo e inténtalo de nuevo.';
  }

  if (code === 'ExpiredCodeException') {
    return 'Este código expiró. Vuelve atrás y solicita uno nuevo.';
  }

  if (code === 'InvalidPasswordException') {
    return cognitoMessage(err) || 'La contraseña no cumple la política requerida.';
  }

  if (code === 'NotAuthorizedException' && messageIncludes(err, 'code')) {
    return 'Este código es inválido o expiró.';
  }

  if (code === 'LimitExceededException' || code === 'TooManyRequestsException') {
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  }

  return 'No se pudo restablecer la contraseña. Inténtalo de nuevo o contacta a tu administrador.';
}
