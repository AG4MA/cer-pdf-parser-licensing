import Link from 'next/link';
import { Download, AppWindow, Activity } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  const apps = await prisma.application.findMany({
    where: { isActive: true },
    include: {
      versions: {
        where: { isLatest: true },
        take: 1,
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppWindow className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold text-white">App Manager</h1>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Portale Download Software
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
          Scarica le ultime versioni delle nostre applicazioni desktop.
          Aggiornamenti automatici e supporto garantito.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-16">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <Download className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-gray-400">Downloads</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <AppWindow className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <p className="text-3xl font-bold text-white">{apps.length}</p>
            <p className="text-gray-400">Applicazioni</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <Activity className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-gray-400">Utenti Online</p>
          </div>
        </div>
      </section>

      {/* Apps List */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <h3 className="text-2xl font-bold text-white mb-8">Applicazioni Disponibili</h3>
        
        {apps.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl p-12 text-center border border-gray-700">
            <AppWindow className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nessuna applicazione disponibile al momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <div
                key={app.id}
                className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{app.name}</h4>
                    <p className="text-sm text-gray-400">{app.description || 'Nessuna descrizione'}</p>
                  </div>
                </div>
                
                {app.versions[0] ? (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                    <span className="text-sm text-gray-400">
                      v{app.versions[0].version}
                    </span>
                    <Link
                      href={`/download/${app.slug}`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Scarica
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <span className="text-sm text-gray-500">Nessuna versione disponibile</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© 2026 App Manager. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
