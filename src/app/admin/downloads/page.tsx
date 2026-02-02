import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Download, Upload, Package } from 'lucide-react';
import Link from 'next/link';

export default async function DownloadsPage() {
  const apps = await prisma.application.findMany({
    include: {
      versions: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  const totalDownloads = await prisma.appVersion.aggregate({
    _sum: { downloads: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Downloads</h1>
          <p className="text-gray-500 mt-1">
            Gestisci versioni e file delle applicazioni
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {totalDownloads._sum.downloads || 0}
          </p>
          <p className="text-sm text-gray-500">download totali</p>
        </div>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nessuna applicazione configurata</p>
            <Link href="/admin/apps/new" className="text-blue-600 hover:text-blue-700">
              Crea la tua prima applicazione
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {apps.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-500" />
                    {app.name}
                  </CardTitle>
                  <Link
                    href={`/admin/downloads/${app.id}/upload`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Carica Versione
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {app.versions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nessuna versione caricata
                  </p>
                ) : (
                  <div className="divide-y">
                    {app.versions.map((version) => (
                      <div
                        key={version.id}
                        className="py-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">v{version.version}</span>
                              {version.isLatest && (
                                <Badge variant="success">Latest</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {version.fileName} • {formatBytes(version.fileSize)}
                            </p>
                            <p className="text-xs text-gray-400">
                              Caricato{' '}
                              {formatDistanceToNow(new Date(version.createdAt), {
                                addSuffix: true,
                                locale: it,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">{version.downloads}</p>
                            <p className="text-xs text-gray-500">downloads</p>
                          </div>
                          <a
                            href={version.filePath}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Scarica
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
