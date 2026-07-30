<div align="center">
  <img src="../../public/assets/logo.png" alt="Master Sheet Logo" width="100" height="100" />
  <h1>Master Sheet API</h1>
  <p><strong>Secure, scalable backend for the Master Sheet RPG companion app</strong></p>
  
  [![NestJS](https://img.shields.io/badge/NestJS-11.x-red?logo=nestjs)](https://nestjs.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://prisma.io)
  [![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js)](https://nodejs.org)
</div>

---

## 🎯 Overview

Master Sheet API handles authentication, user management, email verification, and password recovery for both web and mobile clients. Built with enterprise-grade security, token rotation, rate limiting, and comprehensive test coverage.

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Authentication

- JWT access tokens (short-lived, configurable)
- Rotating refresh tokens with history
- Platform-specific flows (web/mobile)
- Email verification (one-click + API)
- Password reset with single-use tokens
- Account lockout after failed attempts

</td>
<td width="50%">

### 🛡️ Security

- Bcrypt password hashing
- SHA-256 token storage (hashed)
- Token revocation & replay detection
- 15-minute account lockout (5 failures)
- Helmet security headers
- Input validation (class-validator)
- Rate limiting on auth routes

</td>
</tr>
<tr>
<td width="50%">

### 📧 Email Delivery

- Nodemailer SMTP support
- Console fallback (dev mode)
- Configurable templates
- One-click links
- Automatic encoding

</td>
<td width="50%">

### 🏗️ Built For Scale

- Modular NestJS architecture
- PostgreSQL + Prisma ORM
- Jest unit & e2e tests
- TypeScript strict mode
- Docker-ready

</td>
</tr>
</table>

## 🛠️ Tech Stack

| Layer         | Technology                              |
| ------------- | --------------------------------------- |
| **Runtime**   | Node.js 20+                             |
| **Framework** | NestJS 11.x                             |
| **Language**  | TypeScript 5.x (strict mode)            |
| **Database**  | PostgreSQL 12+                          |
| **ORM**       | Prisma                                  |
| **Testing**   | Jest + Supertest                        |
| **Security**  | bcrypt, JWT, helmet, express-rate-limit |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ | pnpm 8+ | PostgreSQL 12+

### 1️⃣ Installation

```bash
cd apps/api
pnpm install
```

### 2️⃣ Environment

Copy `.env.example` to `.env`:

```bash
# Core
DATABASE_URL="postgresql://user:password@localhost:5432/master_sheet"
JWT_SECRET="your-secret-key-32-chars-min"

# Email (optional, falls back to console)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@mastersheet.com"

# Frontend URLs
FRONTEND_URL="http://localhost:5173"
EMAIL_VERIFY_REDIRECT_BASE="http://localhost:5173"

# Debug (dev only)
AUTH_DEBUG_TOKENS=true
```

### 3️⃣ Run

```bash
# Development (auto-reload)
pnpm run start:dev

# Production
pnpm run start:prod
```

🎉 API ready at `http://localhost:3000`

---

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# E2E tests (requires DATABASE_URL)
pnpm run test:e2e

# Coverage
pnpm run test:cov
```

---

## 📚 API Documentation

### 🔑 Authentication Endpoints

<details>
<summary><b>POST /auth/register</b> — Create a new account</summary>

**Request:**

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe"
}
```

**Password Rules:** 8+ chars, uppercase, lowercase, digit, special char  
**Response:** `201` with verification token (debug mode)

</details>

<details>
<summary><b>POST /auth/login</b> — Authenticate user</summary>

**Request:**

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:** `201` with access token + refresh token (cookie or body)

</details>

<details>
<summary><b>GET /auth/verify-email?token=TOKEN</b> — One-click verification (browser)</summary>

**Redirects to:** `http://localhost:5173/email-verified?status=success`

Or with `Accept: application/json` header:

```json
{ "status": "success" }
```

</details>

<details>
<summary><b>POST /auth/verify-email</b> — Verify via API</summary>

**Request:**

```json
{ "token": "TOKEN_HERE" }
```

**Response:**

```json
{ "message": "Email verified successfully." }
```

</details>

<details>
<summary><b>POST /auth/refresh</b> — Get new access token</summary>

Rotates refresh token automatically.  
**Response:** `201` with new access + refresh tokens

</details>

<details>
<summary><b>POST /auth/logout</b> — Revoke session</summary>

**Request:**

```json
{ "refreshToken": "TOKEN_HERE" }
```

</details>

<details>
<summary><b>POST /auth/password-reset/request</b> — Send reset email</summary>

**Request:**

```json
{ "email": "user@example.com" }
```

</details>

<details>
<summary><b>POST /auth/password-reset/confirm</b> — Reset password</summary>

**Request:**

```json
{
  "token": "TOKEN_HERE",
  "password": "NewPassword123!"
}
```

</details>

<details>
<summary><b>GET /auth/me</b> — Get current user (protected)</summary>

**Headers:**

```
Authorization: Bearer ACCESS_TOKEN
```

**Response:**

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "emailVerified": true
}
```

</details>

---

## 🗄️ Database

### Migrations

```bash
# Apply pending migrations (dev)
pnpm exec prisma migrate dev --name add_feature

# Reset and replay all
pnpm exec prisma migrate reset

# Check status
pnpm exec prisma migrate status
```

### Prisma Studio

```bash
pnpm exec prisma studio
# Opens at http://localhost:5555
```

---

## 📁 Project Structure

```
src/
├── auth/
│   ├── auth.controller.ts        # HTTP routes
│   ├── auth.service.ts           # Business logic
│   ├── jwt-auth.guard.ts         # JWT protection
│   ├── jwt.strategy.ts           # JWT config
│   ├── decorators/               # @GetCurrentUser, etc
│   ├── dto/                      # Request validation
│   ├── types/                    # TypeScript types
│   └── auth.module.ts
├── mail/
│   ├── mail.service.ts
│   └── mail.module.ts
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
└── main.ts
```

---

## 🤝 Contributing

### Workflow

1. **Create a branch**

   ```bash
   git checkout -b feat/my-feature
   # or
   git checkout -b fix/bug-name
   ```

2. **Make changes** — follow [Code Style](#code-style)

3. **Write tests** — unit tests required for auth changes

4. **Test locally**

   ```bash
   pnpm run test
   pnpm run test:e2e
   ```

5. **Commit** — use [Conventional Commits](https://www.conventionalcommits.org)

   ```bash
   git commit -m "feat(auth): add two-factor authentication"
   ```

6. **Push & create PR** — include test instructions

### Code Style

- ✅ TypeScript strict mode (enforced)
- ✅ ESLint config ([eslint-config](../../packages/eslint-config))
- ✅ Prettier on commit (Husky)
- ✅ Max 300 lines per file
- ✅ Comprehensive test coverage

### Example: Add a New Endpoint

**1. Create DTO** (`src/auth/dto/verify-two-factor.dto.ts`):

```typescript
import { IsString } from 'class-validator';

export class VerifyTwoFactorDto {
  @IsString()
  code: string;
}
```

**2. Update Service** (`src/auth/auth.service.ts`):

```typescript
async verifyTwoFactor(dto: VerifyTwoFactorDto) {
  // Implement logic
}
```

**3. Add Controller Route** (`src/auth/auth.controller.ts`):

```typescript
@Post('verify-2fa')
@ApiOperation({ summary: 'Verify two-factor code' })
async verifyTwoFactor(@Body() dto: VerifyTwoFactorDto) {
  return this.authService.verifyTwoFactor(dto);
}
```

**4. Test** (`src/auth/auth.service.spec.ts`):

```typescript
it('should verify two-factor code', async () => {
  const result = await service.verifyTwoFactor({ code: '123456' });
  expect(result).toBeDefined();
});
```

---

## 🐛 Troubleshooting

| Issue                        | Solution                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------ |
| **Tests fail with `TS5103`** | Ensure `tsconfig.json` has `"types": ["node", "jest"]`                         |
| **Email not sending**        | Check SMTP vars or see console output (dev mode)                               |
| **Token shows invalid**      | May be expired (24h TTL) or already used. Check database.                      |
| **Account locked**           | Wait 15 min or run: `UPDATE users SET lockoutUntil = null WHERE email = '...'` |
| **DB connection fails**      | Verify `DATABASE_URL` points to correct database                               |

---

## 📝 Environment Reference

See `.env.example` for full list. Common variables:

```bash
# JWT
JWT_SECRET                  # Min 32 chars
JWT_ACCESS_EXPIRES_IN       # Seconds (default: 900 = 15m)
JWT_REFRESH_EXPIRES_IN      # Seconds (default: 604800 = 7d)

# Email
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_FROM

# URLs
APP_URL                     # http://localhost:3000
FRONTEND_URL                # http://localhost:5173
EMAIL_VERIFY_URL            # Default: {{APP_URL}}/auth/verify-email?token={{token}}
EMAIL_VERIFY_REDIRECT_BASE  # Where to redirect after email verification. Defaults to FRONTEND_URL.

### Configuration for Environments

| Variable | Development | Staging | Production |
| --- | --- | --- | --- |
| `APP_URL` | `http://localhost:3000` | `https://api.staging.example.com` | `https://api.example.com` |
| `FRONTEND_URL` | `http://localhost:5173` | `https://app.staging.example.com` | `https://app.example.com` |
| `EMAIL_VERIFY_URL` | (Use default) | (Use default) | (Use default) |
| `EMAIL_VERIFY_REDIRECT_BASE` | (Use default) | (Use default) | (Use default) |

*Note: Use `EMAIL_VERIFY_URL` if you want to bypass the API's one-click flow and send users directly to a frontend verification page.*

# Debug
AUTH_DEBUG_TOKENS           # true/false (returns tokens in responses)
NODE_ENV                    # development/production
```

---

## 📄 License

MIT
