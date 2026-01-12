import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { prisma } from '../db.js';
import { requireAuth } from './auth.js';

// Validation schemas
const createLicenseSchema = z.object({
  label: z.string().max(255).default(''),
  notes: z.string().max(2000).default(''),
  csrf_token: z.string().min(1),
});

const updateLicenseSchema = z.object({
  label: z.string().max(255),
  notes: z.string().max(2000),
  enabled: z.enum(['on', 'off']).optional(),
  csrf_token: z.string().min(1),
});

const toggleDeviceSchema = z.object({
  enabled: z.enum(['on', 'off']),
  csrf_token: z.string().min(1),
});

export async function adminLicensesRoutes(fastify: FastifyInstance) {
  // Apply auth middleware to all routes
  fastify.addHook('preHandler', requireAuth);

  // GET /admin/licenses - List all licenses
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const licenses = await prisma.license.findMany({
      include: {
        _count: {
          select: { devices: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return reply.view('licenses', {
      title: 'Licenses',
      licenses,
      csrfToken: request.session.csrfToken,
      success: (request.query as Record<string, string>).success,
    });
  });

  // POST /admin/licenses - Create new license
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parseResult = createLicenseSchema.safeParse(request.body);
      
      if (!parseResult.success) {
        return reply.redirect('/admin/licenses?error=validation');
      }

      const { label, notes, csrf_token } = parseResult.data;

      // Validate CSRF
      if (csrf_token !== request.session.csrfToken) {
        return reply.status(403).send('Invalid CSRF token');
      }

      // Generate unique license key
      const license_key = `LIC-${nanoid(20).toUpperCase()}`;

      await prisma.license.create({
        data: {
          license_key,
          label: label || `License ${new Date().toISOString().split('T')[0]}`,
          notes,
          enabled: true,
        },
      });

      return reply.redirect('/admin/licenses?success=created');
    } catch (error) {
      request.log.error(error, 'Create license error');
      return reply.redirect('/admin/licenses?error=create_failed');
    }
  });

  // GET /admin/licenses/:id - License detail
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      const license = await prisma.license.findUnique({
        where: { id },
        include: {
          devices: {
            orderBy: { last_seen_at: 'desc' },
          },
        },
      });

      if (!license) {
        return reply.status(404).send('License not found');
      }

      return reply.view('license_detail', {
        title: `License: ${license.label || license.license_key}`,
        license,
        csrfToken: request.session.csrfToken,
        success: (request.query as Record<string, string>).success,
      });
    }
  );

  // POST /admin/licenses/:id - Update license
  fastify.post<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const parseResult = updateLicenseSchema.safeParse(request.body);

        if (!parseResult.success) {
          return reply.redirect(`/admin/licenses/${id}?error=validation`);
        }

        const { label, notes, enabled, csrf_token } = parseResult.data;

        // Validate CSRF
        if (csrf_token !== request.session.csrfToken) {
          return reply.status(403).send('Invalid CSRF token');
        }

        await prisma.license.update({
          where: { id },
          data: {
            label,
            notes,
            enabled: enabled === 'on',
          },
        });

        return reply.redirect(`/admin/licenses/${id}?success=updated`);
      } catch (error) {
        request.log.error(error, 'Update license error');
        return reply.redirect(`/admin/licenses/${request.params.id}?error=update_failed`);
      }
    }
  );

  // POST /admin/licenses/:id/toggle - Toggle license enabled
  fastify.post<{ Params: { id: string } }>(
    '/:id/toggle',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const body = request.body as Record<string, string>;

        // Validate CSRF
        if (body?.csrf_token !== request.session.csrfToken) {
          return reply.status(403).send('Invalid CSRF token');
        }

        const license = await prisma.license.findUnique({ where: { id } });
        if (!license) {
          return reply.status(404).send('License not found');
        }

        await prisma.license.update({
          where: { id },
          data: { enabled: !license.enabled },
        });

        return reply.redirect('/admin/licenses?success=toggled');
      } catch (error) {
        request.log.error(error, 'Toggle license error');
        return reply.redirect('/admin/licenses?error=toggle_failed');
      }
    }
  );

  // POST /admin/licenses/:id/devices/:deviceId/toggle - Toggle device enabled
  fastify.post<{ Params: { id: string; deviceId: string } }>(
    '/:id/devices/:deviceId/toggle',
    async (
      request: FastifyRequest<{ Params: { id: string; deviceId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id, deviceId } = request.params;
        const body = request.body as Record<string, string>;

        // Validate CSRF
        if (body?.csrf_token !== request.session.csrfToken) {
          return reply.status(403).send('Invalid CSRF token');
        }

        const device = await prisma.device.findUnique({ where: { id: deviceId } });
        if (!device) {
          return reply.status(404).send('Device not found');
        }

        await prisma.device.update({
          where: { id: deviceId },
          data: { enabled: !device.enabled },
        });

        return reply.redirect(`/admin/licenses/${id}?success=device_toggled`);
      } catch (error) {
        request.log.error(error, 'Toggle device error');
        return reply.redirect(`/admin/licenses/${request.params.id}?error=toggle_failed`);
      }
    }
  );

  // POST /admin/licenses/:id/delete - Delete license
  fastify.post<{ Params: { id: string } }>(
    '/:id/delete',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const body = request.body as Record<string, string>;

        // Validate CSRF
        if (body?.csrf_token !== request.session.csrfToken) {
          return reply.status(403).send('Invalid CSRF token');
        }

        await prisma.license.delete({ where: { id } });

        return reply.redirect('/admin/licenses?success=deleted');
      } catch (error) {
        request.log.error(error, 'Delete license error');
        return reply.redirect('/admin/licenses?error=delete_failed');
      }
    }
  );
}
