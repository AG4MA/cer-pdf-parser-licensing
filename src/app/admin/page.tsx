import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppWindow, MessageSquare, Download, Activity } from 'lucide-react';
import { isOnline } from '@/lib/utils';

export default async function AdminDashboard() {
  const [apps, feedbackCount, unreadFeedback] = await Promise.all([
    prisma.application.findMany({
      include: {
        heartbeats: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        versions: {
          where: { isLatest: true },
          take: 1,
        },
        _count: {
          select: { feedbacks: true },
        },
      },
    }),
    prisma.feedback.count(),
    prisma.feedback.count({ where: { isRead: false } }),
  ]);

  // Calcola statistiche
  const totalDownloads = await prisma.appVersion.aggregate({
    _sum: { downloads: true },
  });

  // Conta dispositivi online (heartbeat negli ultimi 5 minuti)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const onlineDevices = await prisma.heartbeat.groupBy({
    by: ['deviceId'],
    where: {
      createdAt: { gte: fiveMinutesAgo },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Panoramica del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Applicazioni
            </CardTitle>
            <AppWindow className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{apps.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Dispositivi Online
            </CardTitle>
            <Activity className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{onlineDevices.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Feedback
            </CardTitle>
            <MessageSquare className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{feedbackCount}</p>
            {unreadFeedback > 0 && (
              <p className="text-sm text-orange-600">{unreadFeedback} non letti</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Downloads Totali
            </CardTitle>
            <Download className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalDownloads._sum.downloads || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Apps Status */}
      <Card>
        <CardHeader>
          <CardTitle>Stato Applicazioni</CardTitle>
        </CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nessuna applicazione configurata
            </p>
          ) : (
            <div className="divide-y">
              {apps.map((app) => {
                const lastHeartbeat = app.heartbeats[0]?.createdAt;
                const online = isOnline(lastHeartbeat ? new Date(lastHeartbeat) : null);

                return (
                  <div key={app.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{app.name}</p>
                        <p className="text-sm text-gray-500">
                          {app.versions[0]?.version
                            ? `v${app.versions[0].version}`
                            : 'Nessuna versione'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {online ? 'Online' : 'Offline'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {app._count.feedbacks} feedback
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
