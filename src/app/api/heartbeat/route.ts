import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/heartbeat - Riceve heartbeat dalle app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appSlug, deviceId, hostname, version, os } = body;

    if (!appSlug || !deviceId) {
      return NextResponse.json(
        { error: 'appSlug e deviceId sono obbligatori' },
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

    // Ottieni IP del client
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Crea heartbeat
    await prisma.heartbeat.create({
      data: {
        appId: app.id,
        deviceId,
        hostname,
        ip,
        version,
        os,
      },
    });

    // Controlla se c'è un aggiornamento disponibile
    const latestVersion = await prisma.appVersion.findFirst({
      where: { appId: app.id, isLatest: true },
    });

    return NextResponse.json({
      success: true,
      hasUpdate: latestVersion && version && latestVersion.version !== version,
      latestVersion: latestVersion?.version || null,
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}
