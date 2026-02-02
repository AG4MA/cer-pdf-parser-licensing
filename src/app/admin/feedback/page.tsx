import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { MessageSquare, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { MarkAsReadButton } from './mark-as-read-button';

const typeIcons = {
  bug: Bug,
  feature: Lightbulb,
  general: HelpCircle,
};

const typeLabels = {
  bug: 'Bug',
  feature: 'Richiesta',
  general: 'Generale',
};

const typeVariants = {
  bug: 'danger' as const,
  feature: 'info' as const,
  general: 'default' as const,
};

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ appId?: string; isRead?: string }>;
}) {
  const params = await searchParams;
  const where: Record<string, unknown> = {};
  
  if (params.appId) where.appId = params.appId;
  if (params.isRead !== undefined) where.isRead = params.isRead === 'true';

  const [feedbacks, apps] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: { app: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.application.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  const unreadCount = feedbacks.filter((f) => !f.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} feedback non letti`
              : 'Tutti i feedback sono stati letti'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <form className="flex gap-4 flex-wrap">
            <select
              name="appId"
              defaultValue={params.appId || ''}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) {
                  url.searchParams.set('appId', e.target.value);
                } else {
                  url.searchParams.delete('appId');
                }
                window.location.href = url.toString();
              }}
            >
              <option value="">Tutte le app</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>

            <select
              name="isRead"
              defaultValue={params.isRead || ''}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) {
                  url.searchParams.set('isRead', e.target.value);
                } else {
                  url.searchParams.delete('isRead');
                }
                window.location.href = url.toString();
              }}
            >
              <option value="">Tutti</option>
              <option value="false">Non letti</option>
              <option value="true">Letti</option>
            </select>
          </form>
        </CardContent>
      </Card>

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessun feedback trovato</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => {
            const TypeIcon = typeIcons[feedback.type as keyof typeof typeIcons] || HelpCircle;

            return (
              <Card
                key={feedback.id}
                className={feedback.isRead ? 'opacity-75' : 'border-l-4 border-l-blue-500'}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <TypeIcon className="w-5 h-5 text-gray-500" />
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {feedback.userName || feedback.email || 'Anonimo'}
                          <Badge variant={typeVariants[feedback.type as keyof typeof typeVariants]}>
                            {typeLabels[feedback.type as keyof typeof typeLabels] || feedback.type}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {feedback.app.name} •{' '}
                          {formatDistanceToNow(new Date(feedback.createdAt), {
                            addSuffix: true,
                            locale: it,
                          })}
                        </p>
                      </div>
                    </div>
                    {!feedback.isRead && (
                      <MarkAsReadButton feedbackId={feedback.id} />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{feedback.message}</p>
                  {feedback.email && (
                    <p className="text-sm text-gray-500 mt-3">
                      📧 {feedback.email}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
