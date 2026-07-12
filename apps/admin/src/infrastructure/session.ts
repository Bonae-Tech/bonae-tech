export class SessionExpiredError extends Error {
  constructor(message = 'Sesión expirada') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}
