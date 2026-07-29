# api-rate-limiting Specification

## Requirements

### Requirement: Unified API Rate Limiting
The NestJS backend MUST enforce rate limiting across all API endpoints strictly using `@nestjs/throttler` guards and decorators.

#### Scenario: General endpoint rate limit
- **WHEN** a client sends requests exceeding 120 requests per minute to general API endpoints
- **THEN** the system MUST return an HTTP 429 status code with a JSON payload containing `statusCode: 429` and `message: "Throttled"`.

#### Scenario: Sensitive auth endpoint rate limit
- **WHEN** a client sends requests exceeding the specific named throttle limit on sensitive endpoints (e.g. 5 requests/min for login/register)
- **THEN** the system MUST reject subsequent requests with an HTTP 429 status code in standard JSON format.
