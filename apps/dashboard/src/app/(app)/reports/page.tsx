import { getTranslations } from 'next-intl/server';
import { BarChart2 } from 'lucide-react';

export default async function ReportsPage() {
  const t = await getTranslations('reports');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>
      <div className="rounded-lg border bg-card p-12 text-center">
        <BarChart2 className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">{t('empty')}</p>
        <p className="text-sm text-muted-foreground mt-1">{t('emptyDesc')}</p>
      </div>
    </div>
  );
}
