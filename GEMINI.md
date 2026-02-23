# GEMINI.md - Alia E-Commerce Backend

This project is a production-ready, enterprise-grade E-Commerce REST API built with **NestJS**, **Prisma ORM**, and **PostgreSQL**. It serves as a comprehensive backend solution for modern e-commerce platforms, featuring advanced authentication, modular architecture, and a rich set of features.

## Project Overview

- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **API Documentation**: [Swagger/OpenAPI](https://swagger.io/) available at `/api/docs`
- **Authentication**: JWT (Access/Refresh tokens), Google OAuth 2.0, and OTP-based verification
- **Architecture**: Modular design with `Core`, `Admin`, and `Public` module groupings
- **Key Features**: 
    - Full product catalog with variants, bundles, and categories
    - Inventory management with multi-location support
    - Shopping experience (Guest/Auth carts, Wishlist, Recently Viewed)
    - Order lifecycle management, Shipping, and Payment processing
    - Returns, Refunds, Coupons, and Reviews
    - Notification system (Email, SMS, Push, WebSocket)
    - Content Management: Blog, Homepage Sections (CMS), and a Table Booking System

## Technical Architecture

- **Versioning**: URI-based versioning (e.g., `/api/v1/...`) with version `1` as default.
- **Global Prefix**: All API routes are prefixed with `/api`.
- **Logging**: Structured logging using **Winston** (`nest-winston`).
- **Validation**: Global `ValidationPipe` for request DTO validation.
- **Interceptors**: `GlobalResponseInterceptor` for standardized HATEOAS-style responses.
- **Filters**: `GlobalExceptionFilter` for consistent error reporting.
- **Async Events**: `@nestjs/event-emitter` for decoupled, event-driven processes.
- **File Storage**: AWS S3 integration for images and assets.

## Core Directory Structure

- `src/`: Main source code
    - `auth/`: Authentication logic, guards, and providers
    - `modules/`: Organizational modules (`core.module.ts`, `admin.module.ts`, `public.module.ts`)
    - `config/`: Application, database, cache, and swagger configurations
    - `shared/`: Global interceptors, filters, middleware, and utilities
    - `logger/`: Winston logger configuration and middleware
    - `tasks/`: Scheduled tasks and cron jobs
- `prisma/`: Database schema and seeding scripts
    - `schema.prisma`: The source of truth for the database model
- `test/`: E2E and unit test configurations

## Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- AWS S3 (or compatible) for file storage
- SMTP Server for email features

### Building and Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Copy `.env.example` to `.env` and fill in the required credentials.

3. **Database Preparation**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   # (Optional) Seed the database
   npm run prisma:seed:full
   ```

4. **Run the Application**:
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run build
   npm run start:prod
   ```

5. **Run Tests**:
   ```bash
   npm run test
   npm run test:e2e
   ```

## Development Conventions

- **Surgical Changes**: Always prefer minimal, targeted changes.
- **Validation**: Ensure all request/response objects follow the established DTO patterns and use `class-validator`.
- **Database**: Any schema change must be followed by `npx prisma migrate dev` and a corresponding update to the Prisma client.
- **Logging**: Use the Winston logger for all application events instead of `console.log`.
- **Documentation**: Update Swagger decorators in controllers when modifying API endpoints.
- **Events**: Use `EventEmitter2` for side effects like sending emails or notifications to keep controllers lean.
- **Naming**: Follow standard NestJS naming conventions (`name.controller.ts`, `name.service.ts`, `name.module.ts`).
