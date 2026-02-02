import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const appId = formData.get('appId') as string;
    const version = formData.get('version') as string;
    const changelog = formData.get('changelog') as string;
    const isLatest = formData.get('isLatest') === 'on';

    if (!file || !appId || !version) {
      return NextResponse.json(
        { error: 'File, appId e version sono obbligatori' },
        { status: 400 }
      );
    }

    // Verifica app esistente
    const app = await prisma.application.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return NextResponse.json(
        { error: 'Applicazione non trovata' },
        { status: 404 }
      );
    }

    // Verifica versione non duplicata
    const existingVersion = await prisma.appVersion.findFirst({
      where: { appId, version },
    });

    if (existingVersion) {
      return NextResponse.json(
        { error: 'Versione già esistente' },
        { status: 400 }
      );
    }

    // Crea directory uploads se non esiste
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', app.slug);
    await mkdir(uploadsDir, { recursive: true });

    // Salva file
    const fileName = `${app.slug}-${version}${path.extname(file.name)}`;
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Se è latest, rimuovi flag da altre versioni
    if (isLatest) {
      await prisma.appVersion.updateMany({
        where: { appId },
        data: { isLatest: false },
      });
    }

    // Crea record versione
    const appVersion = await prisma.appVersion.create({
      data: {
        appId,
        version,
        fileName: file.name,
        fileSize: file.size,
        filePath: `/uploads/${app.slug}/${fileName}`,
        changelog,
        isLatest,
      },
    });

    return NextResponse.json({ version: appVersion }, { status: 201 });
  } catch (error) {
    console.error('Upload version error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
