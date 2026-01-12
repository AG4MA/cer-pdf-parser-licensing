import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as argon2 from 'argon2';
import { z } from 'zod';
import { prisma } from '../db.js';

// Validation schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  csrf_token: z.string().min(1),
});

// Middleware to check if user is authenticated
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.session.userId) {
    return reply.redirect('/login');
  }
}

// Middleware to validate CSRF token
export async function validateCsrf(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const body = request.body as Record<string, unknown>;
  const submittedToken = body?.csrf_token as string;
  const sessionToken = request.session.csrfToken;

  if (!submittedToken || !sessionToken || submittedToken !== sessionToken) {
    return reply.status(403).send('Invalid CSRF token');
  }
}

export async function authRoutes(fastify: FastifyInstance) {
  // GET /login - Show login form
  fastify.get('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.session.userId) {
      return reply.redirect('/admin/licenses');
    }

    return reply.view('login', {
      title: 'Login',
      error: null,
      csrfToken: request.session.csrfToken,
    });
  });

  // POST /login - Process login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parseResult = loginSchema.safeParse(request.body);
      
      if (!parseResult.success) {
        return reply.view('login', {
          title: 'Login',
          error: 'Invalid email or password',
          csrfToken: request.session.csrfToken,
        });
      }

      const { email, password, csrf_token } = parseResult.data;

      // Validate CSRF
      if (csrf_token !== request.session.csrfToken) {
        return reply.status(403).view('login', {
          title: 'Login',
          error: 'Invalid request. Please try again.',
          csrfToken: request.session.csrfToken,
        });
      }

      // Find user
      const user = await prisma.adminUser.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.view('login', {
          title: 'Login',
          error: 'Invalid email or password',
          csrfToken: request.session.csrfToken,
        });
      }

      // Verify password
      const validPassword = await argon2.verify(user.password_hash, password);
      if (!validPassword) {
        return reply.view('login', {
          title: 'Login',
          error: 'Invalid email or password',
          csrfToken: request.session.csrfToken,
        });
      }

      // Set session
      request.session.userId = user.id;

      // Regenerate CSRF token after login
      const { nanoid } = await import('nanoid');
      request.session.csrfToken = nanoid(32);

      return reply.redirect('/admin/licenses');
    } catch (error) {
      request.log.error(error, 'Login error');
      return reply.view('login', {
        title: 'Login',
        error: 'An error occurred. Please try again.',
        csrfToken: request.session.csrfToken,
      });
    }
  });

  // POST /logout - Process logout
  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    // Validate CSRF
    const body = request.body as Record<string, unknown>;
    if (body?.csrf_token !== request.session.csrfToken) {
      return reply.status(403).send('Invalid CSRF token');
    }

    request.session.destroy();
    return reply.redirect('/login');
  });

  // GET /logout - Redirect to login (for convenience)
  fastify.get('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    request.session.destroy();
    return reply.redirect('/login');
  });
}
