"# License Manager

A lightweight license and device management system for desktop applications. Built with Node.js, Fastify, SQLite, and Prisma.

## Features

- 🔐 **License Management**: Create, enable/disable licenses
- 📱 **Device Tracking**: Track devices per license with OS, app version, hostname
- 🔑 **Admin Portal**: Server-rendered admin UI with session-based authentication
- 📊 **Audit Logging**: Complete audit trail of all API activities
- 🚀 **Lightweight**: Single Node.js service with SQLite database
- 🐳 **Docker Ready**: Optional Docker deployment

## Quick Start

### Prerequisites

- Node.js 20+ LTS
- npm 9+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd cer-pdf-parser-licensing

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Create database and run migrations
npm run db:migrate:dev

# Seed the database with admin user and demo license
npm run seed

# Start development server
npm run dev
```

### Default Credentials

After seeding, use these credentials to log in:

- **Email**: `admin@example.com`
- **Password**: `changeme123`

> ⚠️ **Important**: Change these credentials in production by setting `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` environment variables before running seed.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./data/app.sqlite` | SQLite database path |
| `PORT` | `3000` | Server port |
| `ADMIN_SEED_EMAIL` | `admin@example.com` | Initial admin email |
| `ADMIN_SEED_PASSWORD` | `changeme123` | Initial admin password |
| `SESSION_SECRET` | (required) | Secret for session encryption (min 16 chars) |
| `CORS_ORIGIN` | (empty) | CORS origin (disabled if empty) |
| `OFFLINE_GRACE_DAYS` | `7` | Days device can work offline |
| `NODE_ENV` | `development` | Environment mode |

## API Endpoints

Base URL: `/api/v1`

### POST /devices/activate

Activate a device for a license. Creates the device if it doesn't exist.

**Request:**
```json
{
  "license_key": "LIC-ABCDEF1234567890",
  "device_id": "unique-device-uuid",
  "device_info": {
    "os": "Windows 11",
    "app_version": "1.0.0",
    "hostname": "WORKSTATION-01"
  }
}
```

**Success Response (200):**
```json
{
  "allow": true,
  "policy": {
    "offline_grace_days": 7
  },
  "server_time": "2026-01-12T10:30:00.000Z"
}
```

**Error Response (200):**
```json
{
  "allow": false,
  "reason": "LICENSE_DISABLED"
}
```

Possible reasons: `LICENSE_DISABLED`, `DEVICE_DISABLED`

### POST /devices/ping

Heartbeat ping from a device to verify license status.

**Request:**
```json
{
  "license_key": "LIC-ABCDEF1234567890",
  "device_id": "unique-device-uuid",
  "device_info": {
    "os": "Windows 11",
    "app_version": "1.0.1",
    "hostname": "WORKSTATION-01"
  }
}
```

**Success Response (200):**
```json
{
  "allow": true
}
```

**Error Response (200):**
```json
{
  "allow": false,
  "reason": "DEVICE_NOT_FOUND"
}
```

Possible reasons: `LICENSE_DISABLED`, `DEVICE_DISABLED`, `DEVICE_NOT_FOUND`

## Example cURL Commands

### Activate a Device

```bash
curl -X POST http://localhost:3000/api/v1/devices/activate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "DEMO-XXXXXXXXXXXXXXXX",
    "device_id": "my-unique-device-id-12345",
    "device_info": {
      "os": "Windows 11 Pro",
      "app_version": "1.0.0",
      "hostname": "DESKTOP-ABC123"
    }
  }'
```

### Ping a Device

```bash
curl -X POST http://localhost:3000/api/v1/devices/ping \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "DEMO-XXXXXXXXXXXXXXXX",
    "device_id": "my-unique-device-id-12345",
    "device_info": {
      "os": "Windows 11 Pro",
      "app_version": "1.0.0",
      "hostname": "DESKTOP-ABC123"
    }
  }'
```

### Health Check

```bash
curl http://localhost:3000/health
```

## Admin Portal

Access the admin portal at `http://localhost:3000/login`

### Features

- **Licenses**: Create, view, enable/disable, delete licenses
- **Devices**: View all devices, filter by license/OS/version, enable/disable devices
- **Audit Log**: View all API activity with pagination

### Creating Licenses

1. Log in to the admin portal
2. Go to **Licenses** page
3. Enter an optional label and click **Create License**
4. Copy the generated license key and provide it to your users

## Project Structure

```
/
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding
├── src/
│   ├── server.ts          # Main server entry point
│   ├── config.ts          # Configuration loader
│   ├── db.ts              # Database connection
│   ├── routes/
│   │   ├── api_devices.ts # API endpoints
│   │   ├── auth.ts        # Authentication routes
│   │   ├── admin_licenses.ts
│   │   ├── admin_devices.ts
│   │   └── admin_audit.ts
│   ├── views/
│   │   ├── layout.eta
│   │   ├── login.eta
│   │   ├── licenses.eta
│   │   ├── license_detail.eta
│   │   ├── devices.eta
│   │   └── audit.eta
│   └── public/
│       └── styles.css
├── data/                  # SQLite database (created at runtime)
├── openapi/
│   └── devices.yaml       # OpenAPI specification
└── Dockerfile
```

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations (production) |
| `npm run db:migrate:dev` | Run migrations (development) |
| `npm run db:push` | Push schema changes directly |
| `npm run seed` | Seed database with initial data |
| `npm run db:studio` | Open Prisma Studio |

## Security Features

- **Password Hashing**: Argon2 (OWASP recommended)
- **CSRF Protection**: Token-based protection for all forms
- **Session Security**: httpOnly, sameSite, secure cookies
- **Rate Limiting**: 30 requests/minute per IP on API endpoints
- **Input Validation**: Zod schema validation
- **CORS**: Disabled by default, configurable via environment

## Docker Deployment

### Build and Run

```bash
# Build the image
docker build -t license-manager .

# Run the container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e SESSION_SECRET=your-super-secret-key-change-me \
  -e ADMIN_SEED_EMAIL=admin@yourcompany.com \
  -e ADMIN_SEED_PASSWORD=your-secure-password \
  --name license-manager \
  license-manager
```

### Docker Compose

```yaml
version: '3.8'
services:
  license-manager:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - SESSION_SECRET=your-super-secret-key-change-me
      - ADMIN_SEED_EMAIL=admin@yourcompany.com
      - ADMIN_SEED_PASSWORD=your-secure-password
      - NODE_ENV=production
    restart: unless-stopped
```

## License

MIT

## Support

For issues and feature requests, please open a GitHub issue" 
