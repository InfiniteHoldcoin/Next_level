'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type BusinessType = 'products' | 'services';
type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);

  async function handleSubmit() {
    if (!businessType || !companyName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyName: companyName.trim(),
          businessType,
          websiteUrl: websiteUrl.trim() || undefined,
          city: city.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Erreur serveur');

      // Refresh session so the new JWT includes tenant_ids
      await supabase.auth.refreshSession();
      setStep(3);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border rounded-xl p-8 shadow-sm">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full transition-colors ${
              s < step ? 'bg-primary' : s === step ? 'bg-primary' : 'bg-muted'
            }`} />
            {s < 3 && <div className={`h-px w-8 ${s < step ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Type de business */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold">{t('step1Title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('step1Subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(['products', 'services'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setBusinessType(type)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  businessType === type
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-sm">{t(type)}</div>
                <div className="text-xs text-muted-foreground mt-1">{t(`${type}Desc`)}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!businessType}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            {t('next')}
          </button>
        </div>
      )}

      {/* Step 2 — Infos entreprise */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold">{t('step2Title')}</h1>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('companyNameLabel')}</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t('companyNamePlaceholder')}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('websiteUrlLabel')}</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder={t('websiteUrlPlaceholder')}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('cityLabel')}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('cityPlaceholder')}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          {/* Consentement Loi 25 — obligatoire avant soumission */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              J'accepte la{' '}
              <a href="/privacy" target="_blank" className="underline hover:text-foreground">
                politique de confidentialité
              </a>{' '}
              et les{' '}
              <a href="/terms" target="_blank" className="underline hover:text-foreground">
                conditions d'utilisation
              </a>
              . Je consens au traitement de mes données par NextLevel conformément à la Loi 25.
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              {t('back')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!companyName.trim() || !consented || loading}
              className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              {loading ? t('submitting') : t('submit')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Confirmation */}
      {step === 3 && (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
            ✓
          </div>
          <div>
            <h1 className="text-xl font-semibold">{t('step3Title')}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t('step3Desc')}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {t('goToDashboard')}
          </button>
        </div>
      )}
    </div>
  );
}
