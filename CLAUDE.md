# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a production-ready e-commerce REST API built with NestJS, Prisma ORM, and PostgreSQL. It's specifically configured as a wine shop backend with comprehensive features including product catalog, inventory management, orders, payments (cash-on-delivery), CMS, and blog functionality.

## Development Commands

### Essential Commands
```bash
# Development
npm run start:dev              # Start with hot-reload
npm run start:debug            # Start in debug mode

# Build & Production
npm run build                  # Build for production
npm run start:prod             # Run production build

# Database
npx prisma generate            # Generate Prisma client after schema changes
npm run prisma:migrate         # Run migrations in development
npm run prisma:migrate:deploy  # Deploy migrations in production
npm run prisma:studio          # Open Prisma Studio GUI

# Seeding
npm run prisma:seed            # Run default seed
npm run prisma:seed:master     # Seed master data (roles, permissions)
npm run prisma:seed:wineshop   # Seed wine shop specific data
npm run prisma:seed:blog       # Seed blog permissions

# Testing
npm run test                   # Run unit tests
npm run test:watch             # Run tests in watch mode
npm run test:cov               # Run tests with coverage
npm run test:e2e               # Run end-to-end tests

# Code Quality
npm run lint                   # Lint and fix code
npm run format                 # Format code with Prettier

# Documentation
npm run compodoc               # Generate code documentation

# Utilities
npm run logs:clear             # Clear all log files
```

## Architecture Overview

### Module Organization

The codebase uses a **three-tier organizational structure** for better separation of concerns:

1. **CoreModule** (`src/modules/core.module.ts`)
   - Authentication (JWT, Google OAuth, OTP)
   - User management

2. **AdminModule** (`src/modules/admin.module.ts`)
   - Orders, Cart, Inventory, Payments, Shipping
   - Bundles, Countries, Coupons, Reports
   - CMS, RBAC (Role-Based Access Control)

3. **PublicModule** (`src/modules/public.module.ts`)
   - Catalog (product browsing)
   - Reviews, Notifications
   - Blog

### Key Architectural Patterns

**Global Infrastructure** (configured in `app.module.ts`):
- `AuthenticationGuard` - Enforces JWT authentication globally
- `PermissionsGuard` - Role and permission-based authorization
- `GlobalResponseInterceptor` - Standardizes all API responses with HATEOAS links
- `GlobalExceptionFilter` - Standardizes error responses
- `TraceIdMiddleware` - Adds unique trace IDs to requests for debugging
- `HttpLoggerMiddleware` - Logs all HTTP requests with Winston

**API Versioning**:
- URI-based versioning (e.g., `/api/v1/products`)
- Default version: `v1`
- Configured in `main.ts` using `VersioningType.URI`

**Authentication Flow**:
- JWT with access/refresh tokens
- Google OAuth 2.0 integration
- OTP-based email verification with rate limiting
- Guards: `AuthenticationGuard` → `AccessTokenGuard` → `PermissionsGuard`

**Authorization**:
- Use `@Roles()` decorator for role-based access
- Use `@Permissions()` decorator for permission-based access
- Use `@Auth(AuthType.None)` to skip authentication for public endpoints

### Database & Prisma

**Schema Location**: `prisma/schema.prisma`

**Key Features**:
- Full-text search enabled via `previewFeatures = ["fullTextSearchPostgres"]`
- Soft deletes implemented on many models
- Comprehensive relationships between entities
- Enums for status management (OrderStatus, PaymentStatus, CartStatus, etc.)

**Transaction Management**:
- Use `UnitOfWorkService` (`src/shared/services/unit-of-work.service.ts`) for complex transactions
- Provides `withTransaction()` method for executing multiple operations atomically

**Seeding Strategy**:
- Master data (roles, permissions): `npm run prisma:seed:master`
- Wine shop products: `npm run prisma:seed:wineshop`
- Blog permissions: `npm run prisma:seed:blog`
- Always run master seed before feature-specific seeds

### Shared Utilities

**Location**: `src/shared/`

**Services**:
- `LocalFileStorageService` - Local file storage for uploads (stores in `./uploads` directory)
- `ResponseBuilderService` - Build standardized API responses with HATEOAS
- `TraceIdService` - Generate and manage request trace IDs
- `UnitOfWorkService` - Transaction management

**Decorators**:
- `@ExcludeGlobalResponse()` - Skip global response transformation
- `@RelatedLinks()` - Add HATEOAS links to response
- `@CacheTTL()` - Set cache TTL for specific endpoints
- `@PerformanceMonitor()` - Monitor endpoint performance

**DTOs**:
- `PaginationDto` - Standard pagination params
- Use class-validator decorators for validation
- Enable transformation: `@Transform()` for data transformation

### Logging

**Winston Logger** is configured globally:
- Development: Colorized console output
- Production: JSON format with log rotation
- Log files: `logs/error.log`, `logs/warn.log`, `logs/combined.log`
- Inject via: `@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger`
- Log rotation: 5MB per file, max 5 files for errors/combined, 3 for warnings

### Notifications

**Multi-channel system** with focus on real-time:
- **REALTIME**: WebSocket (Socket.IO) - fully implemented
- **EMAIL**: Nodemailer with Handlebars templates - fully implemented
- **SMS/PUSH**: Placeholders for future implementation

**WebSocket Gateway**:
- Namespace: `/notifications`
- Users join room: `user-{userId}`
- Events: `notification:new`, `notification:update`, `notification:deleted`
- Authenticated via query param: `userId`

**Template System**:
- Templates stored in database (`NotificationTemplate`)
- Handlebars for variable interpolation
- Pre-configured templates for common events (order confirmation, shipping updates, etc.)

### Caching

**In-memory cache** via `@nestjs/cache-manager`:
- Configuration: `src/config/cache.config.ts`
- Default TTL: 60000ms (60 seconds)
- Max items: 100
- Use `@CacheTTL()` decorator to override per endpoint

### File Uploads

**Local File Storage**:
- Configuration: `src/config/storage.config.ts`
- Service: `LocalFileStorageService`
- Storage location: `./uploads` directory (configurable via `UPLOAD_PATH`)
- Static serving: Files accessible at `http://localhost:4000/uploads/{folder}/{uuid}.ext`
- Supports: Product images, review images
- Max file size: 5MB (configurable via `MAX_FILE_SIZE`)
- Allowed formats: jpg, jpeg, png, webp
- Folder structure: `uploads/reviews/`, `uploads/products/`, `uploads/variants/`, `uploads/test/`

### Payment Integration

**Cash-On-Delivery (COD)**:
- Only payment method: `CASH_ON_DELIVERY` (no online payment gateways)
- Payment status tracking: `pending` → `captured` (when cash received)
- Transaction logging for audit trail
- Admin manually marks payments as received
- Online payment gateways (PesaPal, MPesa) are disabled for this client

### Scheduled Tasks

**Location**: `src/tasks/`

**Current Jobs**:
- OTP cleanup: Daily at 2 AM (removes expired OTPs)
- Notification archival: Daily at 3 AM (archives old notifications)
- Cart abandonment: Mark inactive carts as abandoned

**Using Cron**:
```typescript
@Cron('0 2 * * *') // 2 AM daily
async handleTask() {
  // Task logic
}
```

## Important Conventions

### API Response Format

All responses follow standardized format (via `GlobalResponseInterceptor`):

```typescript
{
  success: true,
  statusCode: 200,
  message: "Success message",
  data: { /* response data */ },
  metadata: {
    timestamp: "2024-01-01T00:00:00.000Z",
    path: "/api/v1/resource",
    version: "1.0.0",
    traceId: "uuid"
  },
  links: { /* HATEOAS links */ }
}
```

### Error Response Format

```typescript
{
  success: false,
  statusCode: 400,
  message: "Error message",
  errors: [ /* validation errors if any */ ],
  metadata: {
    timestamp: "2024-01-01T00:00:00.000Z",
    path: "/api/v1/resource",
    traceId: "uuid"
  }
}
```

### Environment Variables

**Critical variables** (see `.env.example` for complete list):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- No payment gateway credentials needed (Cash-On-Delivery only)
- `UPLOAD_PATH` - Local file storage path (default: `./uploads`)
- `BASE_URL` - Base URL for generating file URLs (default: `http://localhost:4000`)
- `SMTP_*` - Email configuration

### Wine Shop Specific Features

**Countries**:
- Wine origins tracked via `Country` model
- Endpoints: `/api/v1/countries/*`

**Blog**:
- Blog posts with categories and tags
- Status: draft / published
- Endpoints: `/api/v1/blog/*`

**CMS**:
- Homepage sections management
- Dynamic content blocks
- Endpoints: `/api/v1/cms/*`

## Testing Strategy

**Unit Tests**:
- Located alongside source files (`*.spec.ts`)
- Use Jest framework
- Mock Prisma service in tests

**E2E Tests**:
- Located in `test/` directory
- Configuration: `test/jest-e2e.json`
- Run against test database

## Common Development Patterns

### Creating a New Feature Module

1. Generate module: `nest g module feature`
2. Add to appropriate organizational module (CoreModule/AdminModule/PublicModule)
3. Create controller with versioning: `@Controller({ path: 'feature', version: '1' })`
4. Use guards for auth: `@Roles()` or `@Permissions()`
5. Add DTOs with validation decorators
6. Update Prisma schema if needed and generate migration

### Adding New Permissions

1. Add to `prisma/seed-permissions.ts` or create new seed file
2. Run seed: `npm run prisma:seed:master`
3. Use in controller: `@Permissions('permission:name')`

### Adding New API Endpoint

1. Create DTO with class-validator
2. Add method to controller with appropriate decorators
3. Document with Swagger: `@ApiOperation()`, `@ApiResponse()`
4. Add HATEOAS links via `@RelatedLinks()` if needed
5. Test endpoint in Swagger UI at `http://localhost:4000/api/docs`

### Database Migrations

1. Modify `prisma/schema.prisma`
2. Run: `npm run prisma:migrate` (creates migration)
3. Name migration descriptively
4. Regenerate client: `npx prisma generate`
5. Update seed files if needed

## Swagger Documentation

Access at: `http://localhost:4000/api/docs`

Configuration: `src/config/swagger.config.ts`

**Features**:
- JWT Bearer auth support
- Detailed request/response schemas
- Try-it-out functionality
- Organized by tags/modules

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships. It exists so sessions do not have to read or grep the codebase to get oriented — querying it is roughly 8x cheaper in tokens than scanning source.

**Query the graph before reading source.** For any question about this codebase — how something works, what calls what, where a feature lives, how a change propagates — run one of these first:

```bash
graphify query "<question>"      # scoped subgraph for a question
graphify path "<A>" "<B>"        # how two things connect
graphify explain "<symbol>"      # a node and its immediate neighbors
graphify affected "<symbol>"     # what breaks if you change it
graphify god-nodes               # the architectural hubs
```

Then open only the specific files the graph points at. Do not enumerate directories or grep broadly to build a mental model first — that is what the graph replaces.

Rules:
- A `SessionStart` hook (`.claude/hooks/graphify-orient.sh`) injects graph stats, architectural hubs, and the main code areas at the start of every session. Treat that as your starting map; query the graph to go deeper.
- Use `graphify-out/wiki/index.md` for broad navigation instead of raw source browsing. One article per community, 349 of them.
- Read `graphify-out/GRAPH_REPORT.md` only for a full architecture review, or when query/path/explain do not surface enough. It is ~63KB — prefer the targeted commands.
- Read and grep freely **once oriented**, and whenever you are editing or debugging specific lines. The graph replaces exploratory scanning, not actual code work.
- **The code is the source of truth.** The graph is a snapshot and can be stale or wrong (it currently carries some dangling and collapsed edges, and generated Prisma types dominate node counts). If the graph and the code disagree, trust the code, say so, and run `graphify update .`.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost, no LLM — ~14s, zero tokens). Note it re-clusters and replaces curated community names with the busiest node's filename; the orientation hook derives its own area names from source paths, so its output is unaffected.
- The graph covers code structurally via AST. The 17 `.sql` files contribute nothing until `pip install 'graphifyy[sql]'` is run.
