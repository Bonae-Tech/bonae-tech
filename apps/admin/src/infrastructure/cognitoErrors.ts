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
      'Password reset is not available for this account because the email address is not verified. ' +
      'Contact your administrator — they can verify your email in Cognito so you can reset your password.'
    );
  }

  if (code === 'LimitExceededException' || code === 'TooManyRequestsException') {
    return 'Too many reset attempts. Please wait a few minutes and try again.';
  }

  if (code === 'InvalidParameterException') {
    return 'Unable to send a reset code for that email. Check the address and try again.';
  }

  return 'Unable to send a reset code. Check the email address and try again, or contact your administrator.';
}

export function mapConfirmPasswordError(err: unknown): string {
  const code = cognitoCode(err);

  if (code === 'CodeMismatchException') {
    return 'The verification code is incorrect. Check your email and try again.';
  }

  if (code === 'ExpiredCodeException') {
    return 'This verification code has expired. Go back and request a new code.';
  }

  if (code === 'InvalidPasswordException') {
    return cognitoMessage(err) || 'Password does not meet the required policy.';
  }

  if (code === 'NotAuthorizedException' && messageIncludes(err, 'code')) {
    return 'This verification code is invalid or has expired.';
  }

  if (code === 'LimitExceededException' || code === 'TooManyRequestsException') {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }

  return 'Unable to reset password. Please try again or contact your administrator.';
}
