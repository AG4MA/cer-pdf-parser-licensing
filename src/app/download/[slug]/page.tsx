import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { formatBytes } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Download, ArrowLeft, FileDown, Clock, HardDrive } from 'lucide-react';
import Link from 'next/link';

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const app = await prisma.application.findUnique({
    where: { slug },
    include: {
      versions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!app || !app.isActive) {
    notFound();
  }

  const latestVersion = app.versions.find((v) => v.isLatest);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna al portale
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">{app.name}</h1>
          {app.description && (
            <p className="text-xl text-gray-400">{app.description}</p>
          )}
        </div>

        {latestVersion ? (
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Versione {latestVersion.version}
                </h2>
                <p className="text-gray-400 mt-1">Ultima versione stabile</p>
              </div>
              <a
                href={`/api/download/${app.slug}/${latestVersion.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Scarica Ora
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <HardDrive className="w-4 h-4" />
                  Dimensione
                </div>
                <p className="text-white font-medium">
                  {formatBytes(latestVersion.fileSize)}
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Clock className="w-4 h-4" />
                  Rilasciato
                </div>
                <p className="text-white font-medium">
                  {formatDistanceToNow(new Date(latestVersion.createdAt), {
                    addSuffix: true,
                    locale: it,
                  })}
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <FileDown className="w-4 h-4" />
                  Downloads
                </div>
                <p className="text-white font-medium">{latestVersion.downloads}</p>
              </div>
            </div>

            {latestVersion.changelog && (
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Changelog</h3>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {latestVersion.changelog}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-2xl p-12 border border-gray-700 text-center">
            <Download className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nessuna versione disponibile al momento</p>
          </div>
        )}

        {/* Versioni precedenti */}
        {app.versions.length > 1 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Versioni Precedenti</h2>
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 divide-y divide-gray-700">
              {app.versions
                .filter((v) => !v.isLatest)
                .map((version) => (
                  <div
                    key={version.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">v{version.version}</p>
                      <p className="text-sm text-gray-500">
                        {formatBytes(version.fileSize)} •{' '}
                        {formatDistanceToNow(new Date(version.createdAt), {
                          addSuffix: true,
                          locale: it,
                        })}
                      </p>
                    </div>
                    <a
                      href={`/api/download/${app.slug}/${version.id}`}
                      className="flex items-center gap-1 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Scarica
                    </a>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
