import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db.js';
import { requireAuth } from './auth.js';

export async function adminDevicesRoutes(fastify: FastifyInstance) {
  // Apply auth middleware to all routes
  fastify.addHook('preHandler', requireAuth);

  // GET /admin/devices - List all devices
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string>;
    const { license_key, os, app_version } = query;

    // Build filter conditions
    const where: Record<string, unknown> = {};

    if (license_key) {
      const license = await prisma.license.findUnique({
        where: { license_key },
        select: { id: true },
      });
      if (license) {
        where.license_id = license.id;
      } else {
        // No matching license, return empty
        return reply.view('devices', {
          title: 'Devices',
          devices: [],
          filters: { license_key, os, app_version },
          csrfToken: request.session.csrfToken,
        });
      }
    }

    if (os) {
      where.os = { contains: os };
    }

    if (app_version) {
      where.app_version = { contains: app_version };
    }

    const devices = await prisma.device.findMany({
      where,
      include: {
        license: {
          select: {
            license_key: true,
            label: true,
          },
        },
      },
      orderBy: { last_seen_at: 'desc' },
    });

    return reply.view('devices', {
      title: 'Devices',
      devices,
      filters: { license_key, os, app_version },
      csrfToken: request.session.csrfToken,
    });
  });

  // POST /admin/devices/:id/toggle - Toggle device enabled
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

        const device = await prisma.device.findUnique({ where: { id } });
        if (!device) {
          return reply.status(404).send('Device not found');
        }

        await prisma.device.update({
          where: { id },
          data: { enabled: !device.enabled },
        });

        // Redirect back to referring page or devices list
        const referer = request.headers.referer;
        if (referer) {
          return reply.redirect(referer);
        }
        return reply.redirect('/admin/devices');
      } catch (error) {
        request.log.error(error, 'Toggle device error');
        return reply.redirect('/admin/devices?error=toggle_failed');
      }
    }
  );
}
