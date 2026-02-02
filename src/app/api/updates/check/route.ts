import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/updates/check - Controlla aggiornamenti
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appSlug = searchParams.get('appSlug');
    const currentVersion = searchParams.get('version');

    if (!appSlug) {
      return NextResponse.json(
        { error: 'appSlug è obbligatorio' },
        { status: 400 }
      );
    }

    // Trova l'applicazione
    const app = await prisma.application.findUnique({
      where: { slug: appSlug },
      include: {
        versions: {
          where: { isLatest: true },
          take: 1,
        },
      },
    });

    if (!app) {
      return NextResponse.json(
        { error: 'Applicazione non trovata' },
        { status: 404 }
      );
    }

    const latestVersion = app.versions[0];

    if (!latestVersion) {
      return NextResponse.json({
        hasUpdate: false,
        currentVersion,
        latestVersion: null,
      });
    }

    const hasUpdate = currentVersion !== latestVersion.version;

    return NextResponse.json({
      hasUpdate,
      currentVersion,
      latestVersion: latestVersion.version,
      downloadUrl: hasUpdate ? `/api/updates/download?appSlug=${appSlug}` : null,
      changelog: hasUpdate ? latestVersion.changelog : null,
      fileSize: hasUpdate ? latestVersion.fileSize : null,
    });
  } catch (error) {
    console.error('Check update error:', error);
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}
