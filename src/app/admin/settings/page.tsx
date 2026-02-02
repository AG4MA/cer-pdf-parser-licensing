import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import { User, Shield } from 'lucide-react';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
        <p className="text-gray-500 mt-1">Gestisci il tuo account e le preferenze</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profilo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Email
                </label>
                <p className="text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Nome
                </label>
                <p className="text-gray-900">{user?.name || 'Non impostato'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Ruolo
                </label>
                <p className="text-gray-900 capitalize">{user?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              Usa queste API per integrare le tue applicazioni desktop:
            </p>
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm space-y-2">
              <p>
                <span className="text-gray-500">POST</span>{' '}
                <span className="text-blue-600">/api/heartbeat</span>
              </p>
              <p>
                <span className="text-gray-500">POST</span>{' '}
                <span className="text-blue-600">/api/feedback</span>
              </p>
              <p>
                <span className="text-gray-500">GET</span>{' '}
                <span className="text-blue-600">/api/updates/check</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
