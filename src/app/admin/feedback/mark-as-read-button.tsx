'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check } from 'lucide-react';

export function MarkAsReadButton({ feedbackId }: { feedbackId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/admin/feedback/${feedbackId}/read`, {
        method: 'POST',
      });
      router.refresh();
    } catch (error) {
      console.error('Error marking as read:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <Check className="w-4 h-4" />
      {loading ? 'Salvataggio...' : 'Segna come letto'}
    </button>
  );
}
