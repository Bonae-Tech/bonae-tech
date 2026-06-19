export class SessionExpiredError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}
