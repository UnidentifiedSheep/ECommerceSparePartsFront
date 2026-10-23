export interface AuthSession {
  id: string
  token: string
  refreshToken: string
}

export type TokenPair = Pick<AuthSession, 'token' | 'refreshToken'>

// An old request must never be retried as a different signed-in user.
export class SessionChangedError extends Error {
  constructor() { super('Authentication session changed. Request cancelled.'); this.name = 'SessionChangedError' }
}
