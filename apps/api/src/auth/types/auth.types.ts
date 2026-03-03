export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface ActiveUser {
  userId: string;
  email: string;
}
