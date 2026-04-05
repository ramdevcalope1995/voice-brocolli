import type { AuthUser } from '../auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
      authSessionToken?: string;
    }
  }
}

export {};
