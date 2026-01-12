import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyFormbody from '@fastify/formbody';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import { Eta } from 'eta';
import { config } from './config.js';
import { connectDatabase, disconnectDatabase } from './db.js';
import { apiDevicesRoutes } from './routes/api_devices.js';
import { authRoutes } from './routes/auth.js';
import { adminLicensesRoutes } from './routes/admin_licenses.js';
import { adminDevicesRoutes } from './routes/admin_devices.js';
import { adminAuditRoutes } from './routes/admin_audit.js';

// Extend Fastify types for session
declare module 'fastify' {
  interface Session {
    userId?: string;
    csrfToken?: string;
  }
}

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory');
}

const fastify = Fastify({
  logger: {
    level: config.isProduction ? 'info' : 'debug',
    transport: config.isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
  },
});

async function bootstrap() {
  // Connect database
  await connectDatabase();

  // CORS (disabled by default)
  if (config.corsOrigin) {
    await fastify.register(fastifyCors, {
      origin: config.corsOrigin,
      credentials: true,
    });
  }

  // Rate limiting for API endpoints
  await fastify.register(fastifyRateLimit, {
    global: false,
  });

  // Form body parsing
  await fastify.register(fastifyFormbody);

  // Cookies
  await fastify.register(fastifyCookie);

  // Session
  await fastify.register(fastifySession, {
    secret: config.sessionSecret,
    cookieName: 'sessionId',
    cookie: {
      secure: config.isProduction,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
    saveUninitialized: false,
  });

  // Template engine (Eta)
  const eta = new Eta({
    views: path.join(process.cwd(), 'src', 'views'),
    cache: config.isProduction,
  });

  await fastify.register(fastifyView, {
    engine: { eta },
    root: path.join(process.cwd(), 'src', 'views'),
    viewExt: 'eta',
    defaultContext: {
      title: 'License Manager',
    },
  });

  // Static files
  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), 'src', 'public'),
    prefix: '/public/',
  });

  // Decorate request with CSRF helper
  fastify.decorateRequest('csrfToken', null);
  fastify.addHook('preHandler', async (request) => {
    if (!request.session.csrfToken) {
      const { nanoid } = await import('nanoid');
      request.session.csrfToken = nanoid(32);
    }
  });

  // Register routes
  await fastify.register(apiDevicesRoutes, { prefix: '/api/v1/devices' });
  await fastify.register(authRoutes);
  await fastify.register(adminLicensesRoutes, { prefix: '/admin/licenses' });
  await fastify.register(adminDevicesRoutes, { prefix: '/admin/devices' });
  await fastify.register(adminAuditRoutes, { prefix: '/admin/audit' });

  // Root redirect
  fastify.get('/', async (request, reply) => {
    if (request.session.userId) {
      return reply.redirect('/admin/licenses');
    }
    return reply.redirect('/login');
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n${signal} received, shutting down...`);
      await fastify.close();
      await disconnectDatabase();
      process.exit(0);
    });
  });

  // Start server
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

bootstrap();
