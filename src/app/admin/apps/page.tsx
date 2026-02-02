import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, Settings } from 'lucide-react';
import { isOnline } from '@/lib/utils';

export default async function AppsPage() {
  const apps = await prisma.application.findMany({
    include: {
      heartbeats: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      versions: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { feedbacks: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applicazioni</h1>
          <p className="text-gray-500 mt-1">Gestisci le tue applicazioni</p>
        </div>
        <Link
          href="/admin/apps/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuova App
        </Link>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">Nessuna applicazione configurata</p>
            <Link
              href="/admin/apps/new"
              className="text-blue-600 hover:text-blue-700"
            >
              Crea la tua prima applicazione
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => {
            const lastHeartbeat = app.heartbeats[0]?.createdAt;
            const online = isOnline(lastHeartbeat ? new Date(lastHeartbeat) : null);
            const latestVersion = app.versions.find((v) => v.isLatest);

            return (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {app.name}
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            online ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">/{app.slug}</p>
                    </div>
                    <Link
                      href={`/admin/apps/${app.id}`}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {app.description || 'Nessuna descrizione'}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant={app.isActive ? 'success' : 'default'}>
                      {app.isActive ? 'Attiva' : 'Disattivata'}
                    </Badge>
                    {latestVersion && (
                      <Badge variant="info">v{latestVersion.version}</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                    <span>{app.versions.length} versioni</span>
                    <span>{app._count.feedbacks} feedback</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
