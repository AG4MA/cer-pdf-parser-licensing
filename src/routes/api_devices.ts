import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';

// Validation schemas
const deviceInfoSchema = z.object({
  os: z.string().max(100).default(''),
  app_version: z.string().max(50).default(''),
  hostname: z.string().max(255).default(''),
});

const activateSchema = z.object({
  license_key: z.string().min(1).max(100),
  device_id: z.string().min(1).max(255),
  device_info: deviceInfoSchema.optional(),
});

const pingSchema = z.object({
  license_key: z.string().min(1).max(100),
  device_id: z.string().min(1).max(255),
  device_info: deviceInfoSchema.optional(),
});

type ActivateBody = z.infer<typeof activateSchema>;
type PingBody = z.infer<typeof pingSchema>;

interface ApiResponse {
  allow: boolean;
  reason?: string;
  policy?: {
    offline_grace_days: number;
  };
  server_time?: string;
}

async function writeAuditLog(
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      event_type: eventType,
      payload_json: JSON.stringify(payload),
    },
  });
}

export async function apiDevicesRoutes(fastify: FastifyInstance) {
  // Rate limiting for API endpoints
  const rateLimit = {
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  };

  // POST /activate
  fastify.post<{ Body: ActivateBody }>(
    '/activate',
    {
      ...rateLimit,
    },
    async (request: FastifyRequest<{ Body: ActivateBody }>, reply: FastifyReply) => {
      try {
        // Validate input
        const parseResult = activateSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.status(400).send({
            allow: false,
            reason: 'INVALID_REQUEST',
            errors: parseResult.error.flatten().fieldErrors,
          });
        }

        const { license_key, device_id, device_info } = parseResult.data;
        const deviceInfoData = device_info || { os: '', app_version: '', hostname: '' };

        // Find license
        const license = await prisma.license.findUnique({
          where: { license_key },
        });

        if (!license || !license.enabled) {
          await writeAuditLog('ACTIVATE_DENIED', {
            license_key,
            device_id,
            reason: 'LICENSE_DISABLED',
            ip: request.ip,
          });

          return reply.send({
            allow: false,
            reason: 'LICENSE_DISABLED',
          } satisfies ApiResponse);
        }

        // Find or create device
        let device = await prisma.device.findUnique({
          where: {
            device_id_license_id: {
              device_id,
              license_id: license.id,
            },
          },
        });

        const now = new Date();

        if (!device) {
          // Create new device
          device = await prisma.device.create({
            data: {
              device_id,
              license_id: license.id,
              os: deviceInfoData.os,
              app_version: deviceInfoData.app_version,
              hostname: deviceInfoData.hostname,
              first_seen_at: now,
              last_seen_at: now,
              enabled: true,
            },
          });

          await writeAuditLog('DEVICE_CREATED', {
            license_key,
            device_id,
            device_info: deviceInfoData,
            ip: request.ip,
          });
        } else {
          // Check if device is enabled
          if (!device.enabled) {
            await writeAuditLog('ACTIVATE_DENIED', {
              license_key,
              device_id,
              reason: 'DEVICE_DISABLED',
              ip: request.ip,
            });

            return reply.send({
              allow: false,
              reason: 'DEVICE_DISABLED',
            } satisfies ApiResponse);
          }

          // Update device info
          device = await prisma.device.update({
            where: { id: device.id },
            data: {
              last_seen_at: now,
              os: deviceInfoData.os || device.os,
              app_version: deviceInfoData.app_version || device.app_version,
              hostname: deviceInfoData.hostname || device.hostname,
            },
          });
        }

        await writeAuditLog('ACTIVATE_SUCCESS', {
          license_key,
          device_id,
          device_info: deviceInfoData,
          ip: request.ip,
        });

        return reply.send({
          allow: true,
          policy: {
            offline_grace_days: config.offlineGraceDays,
          },
          server_time: now.toISOString(),
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Activation error');
        return reply.status(500).send({
          allow: false,
          reason: 'INTERNAL_ERROR',
        });
      }
    }
  );

  // POST /ping
  fastify.post<{ Body: PingBody }>(
    '/ping',
    {
      ...rateLimit,
    },
    async (request: FastifyRequest<{ Body: PingBody }>, reply: FastifyReply) => {
      try {
        // Validate input
        const parseResult = pingSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.status(400).send({
            allow: false,
            reason: 'INVALID_REQUEST',
            errors: parseResult.error.flatten().fieldErrors,
          });
        }

        const { license_key, device_id, device_info } = parseResult.data;
        const deviceInfoData = device_info || { os: '', app_version: '', hostname: '' };

        // Find license
        const license = await prisma.license.findUnique({
          where: { license_key },
        });

        if (!license || !license.enabled) {
          await writeAuditLog('PING_DENIED', {
            license_key,
            device_id,
            reason: 'LICENSE_DISABLED',
            ip: request.ip,
          });

          return reply.send({
            allow: false,
            reason: 'LICENSE_DISABLED',
          } satisfies ApiResponse);
        }

        // Find device
        const device = await prisma.device.findUnique({
          where: {
            device_id_license_id: {
              device_id,
              license_id: license.id,
            },
          },
        });

        if (!device) {
          await writeAuditLog('PING_DENIED', {
            license_key,
            device_id,
            reason: 'DEVICE_NOT_FOUND',
            ip: request.ip,
          });

          return reply.send({
            allow: false,
            reason: 'DEVICE_NOT_FOUND',
          } satisfies ApiResponse);
        }

        if (!device.enabled) {
          await writeAuditLog('PING_DENIED', {
            license_key,
            device_id,
            reason: 'DEVICE_DISABLED',
            ip: request.ip,
          });

          return reply.send({
            allow: false,
            reason: 'DEVICE_DISABLED',
          } satisfies ApiResponse);
        }

        // Update device info
        const now = new Date();
        await prisma.device.update({
          where: { id: device.id },
          data: {
            last_seen_at: now,
            os: deviceInfoData.os || device.os,
            app_version: deviceInfoData.app_version || device.app_version,
            hostname: deviceInfoData.hostname || device.hostname,
          },
        });

        await writeAuditLog('PING_SUCCESS', {
          license_key,
          device_id,
          device_info: deviceInfoData,
          ip: request.ip,
        });

        return reply.send({
          allow: true,
        } satisfies ApiResponse);
      } catch (error) {
        request.log.error(error, 'Ping error');
        return reply.status(500).send({
          allow: false,
          reason: 'INTERNAL_ERROR',
        });
      }
    }
  );
}
