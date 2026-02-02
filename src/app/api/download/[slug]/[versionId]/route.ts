import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; versionId: string }> }
) {
  try {
    const { slug, versionId } = await params;

    const app = await prisma.application.findUnique({
      where: { slug },
    });

    if (!app) {
      return NextResponse.json({ error: 'App non trovata' }, { status: 404 });
    }

    const version = await prisma.appVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.appId !== app.id) {
      return NextResponse.json({ error: 'Versione non trovata' }, { status: 404 });
    }

    // Incrementa contatore download
    await prisma.appVersion.update({
      where: { id: versionId },
      data: { downloads: { increment: 1 } },
    });

    // Leggi file
    const filePath = path.join(process.cwd(), 'public', version.filePath);
    const fileBuffer = await readFile(filePath);

    // Restituisci file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${version.fileName}"`,
        'Content-Length': version.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
