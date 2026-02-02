'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, FileUp } from 'lucide-react';
import Link from 'next/link';

export default function UploadVersionPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.appId as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Seleziona un file');
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append('file', file);
    formData.append('appId', appId);

    try {
      const res = await fetch('/api/admin/versions', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante il caricamento');
        return;
      }

      router.push('/admin/downloads');
      router.refresh();
    } catch {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/admin/downloads"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna ai downloads
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Carica Nuova Versione</h1>
        <p className="text-gray-500 mt-1">Carica un nuovo file .exe per l&apos;applicazione</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli Versione</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="version"
              name="version"
              label="Versione"
              placeholder="Es. 1.0.0"
              required
              pattern="^\d+\.\d+\.\d+$"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File (.exe)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".exe,.zip,.msi"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileUp className="w-8 h-8 text-blue-500" />
                      <div className="text-left">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">
                        Clicca per selezionare un file
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        .exe, .zip, .msi (max 500MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="changelog" className="block text-sm font-medium text-gray-700 mb-1">
                Changelog
              </label>
              <textarea
                id="changelog"
                name="changelog"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descrivi le modifiche in questa versione..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLatest"
                name="isLatest"
                defaultChecked
                className="rounded border-gray-300"
              />
              <label htmlFor="isLatest" className="text-sm text-gray-700">
                Imposta come versione corrente (latest)
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || !file}>
                {loading ? 'Caricamento...' : 'Carica Versione'}
              </Button>
              <Link href="/admin/downloads">
                <Button type="button" variant="secondary">
                  Annulla
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
