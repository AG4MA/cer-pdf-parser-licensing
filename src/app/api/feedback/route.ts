import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/feedback - Riceve feedback dalle app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appSlug, deviceId, userName, email, message, type } = body;

    if (!appSlug || !message) {
      return NextResponse.json(
        { error: 'appSlug e message sono obbligatori' },
        { status: 400 }
      );
    }

    // Trova l'applicazione
    const app = await prisma.application.findUnique({
      where: { slug: appSlug },
    });

    if (!app) {
      return NextResponse.json(
        { error: 'Applicazione non trovata' },
        { status: 404 }
      );
    }

    // Crea feedback
    const feedback = await prisma.feedback.create({
      data: {
        appId: app.id,
        deviceId,
        userName,
        email,
        message,
        type: type || 'general',
      },
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
    });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}

// GET /api/feedback - Lista feedback (per admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const isRead = searchParams.get('isRead');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (appId) where.appId = appId;
    if (isRead !== null) where.isRead = isRead === 'true';

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: { app: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}
