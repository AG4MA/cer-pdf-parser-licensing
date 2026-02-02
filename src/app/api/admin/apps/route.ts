import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

// GET /api/admin/apps - Lista tutte le app
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const apps = await prisma.application.findMany({
      include: {
        versions: true,
        _count: {
          select: { feedbacks: true, heartbeats: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ apps });
  } catch (error) {
    console.error('Get apps error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}

// POST /api/admin/apps - Crea nuova app
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 });
    }

    const finalSlug = slug || slugify(name);

    // Verifica unicità
    const existing = await prisma.application.findFirst({
      where: {
        OR: [{ name }, { slug: finalSlug }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Nome o slug già esistente' },
        { status: 400 }
      );
    }

    const app = await prisma.application.create({
      data: {
        name,
        slug: finalSlug,
        description,
      },
    });

    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    console.error('Create app error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
