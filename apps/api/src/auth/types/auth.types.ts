export interface JwtPayload {
  sub: string;
  email: string;
  typ: 'access' | 'refresh';
  jti: string;
  iat?: number;
  exp?: number;
}

export interface ActiveUser {
  userId: string;
  email: string;
  jti: string;
}

export type ClientPlatform = 'web' | 'mobile';

export interface AuthUserSummary {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUserSummary;
}
