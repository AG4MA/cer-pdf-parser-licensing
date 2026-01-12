import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuditLog } from '@prisma/client';
import { prisma } from '../db.js';
import { requireAuth } from './auth.js';

const PAGE_SIZE = 50;

export async function adminAuditRoutes(fastify: FastifyInstance) {
  // Apply auth middleware to all routes
  fastify.addHook('preHandler', requireAuth);

  // GET /admin/audit - List audit logs with pagination
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string>;
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const skip = (page - 1) * PAGE_SIZE;

    // Get total count
    const totalCount = await prisma.auditLog.count();
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // Get logs for current page
    const logs = await prisma.auditLog.findMany({
      orderBy: { created_at: 'desc' },
      skip,
      take: PAGE_SIZE,
    });

    // Parse JSON payloads for display
    const logsWithParsedPayload = logs.map((log: AuditLog) => {
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(log.payload_json);
      } catch {
        payload = { raw: log.payload_json };
      }
      return {
        ...log,
        payload,
      };
    });

    return reply.view('audit', {
      title: 'Audit Log',
      logs: logsWithParsedPayload,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      csrfToken: request.session.csrfToken,
    });
  });
}
