'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

const API = 'http://localhost:3000';

async function getToken() {
  const { data } = await getSupabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [locale, setLocale] = useState('fr');
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await getSupabaseBrowser().auth.getUser();
      if (user?.email) setEmail(user.email);
    }
    const storedLocale = document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1] ?? 'fr';
    setLocale(storedLocale);
    load();
  }, []);

  function setLocaleCookie(value: string) {
    document.cookie = `NEXT_LOCALE=${value};path=/;max-age=31536000`;
    setLocale(value);
    showFeedback('Langue mise à jour. Rechargement…', true);
    setTimeout(() => window.location.reload(), 1000);
  }

  function showFeedback(msg: string, ok: boolean) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleLogout() {
    await getSupabaseBrowser().auth.signOut();
    window.location.href = '/login';
  }

  async function handleDeleteAccount() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const { data: { session } } = await getSupabaseBrowser().auth.getSession();
    if (!session) { setDeleting(false); return; }
    const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
    const res = await fetch(`${api}/onboarding/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      await getSupabaseBrowser().auth.signOut();
      window.location.href = '/login';
    } else {
      showFeedback('Erreur lors de la suppression. Contactez le support.', false);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez votre compte et vos préférences.</p>
      </div>

      {feedback && (
        <div className={`rounded-md px-4 py-3 text-sm ${feedback.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {feedback.msg}
        </div>
      )}

      {/* Account info */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">Compte</p>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Adresse courriel</p>
          <p className="text-sm font-medium">{email || '—'}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Pour modifier votre courriel, contactez l'équipe NextLevel via la page Messages.
        </p>
      </div>

      {/* Language */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">Langue</p>
        <div className="flex gap-2">
          <button
            onClick={() => setLocaleCookie('fr')}
            className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              locale === 'fr' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
            }`}
          >
            Français
          </button>
          <button
            onClick={() => setLocaleCookie('en')}
            className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
              locale === 'en' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Billing placeholder */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">Facturation</p>
        <p className="text-sm text-muted-foreground">
          Votre plan sera configuré par l'équipe NextLevel après votre meeting de découverte.
        </p>
      </div>

      {/* Session */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium mb-3">Session</p>
        <button
          onClick={handleLogout}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Se déconnecter
        </button>
      </div>

      {/* Zone de danger — Loi 25 droit à l'effacement */}
      <div className="rounded-lg border border-destructive/30 bg-card p-4">
        <p className="text-sm font-medium text-destructive mb-1">Zone de danger</p>
        <p className="text-xs text-muted-foreground mb-3">
          La suppression de compte efface toutes vos données (connexions, contacts, messages) de manière permanente et irréversible, conformément à la Loi 25.
        </p>
        {confirmDelete && (
          <p className="text-xs text-destructive font-medium mb-3">
            Confirmez-vous? Cette action est irréversible. Cliquez à nouveau pour supprimer définitivement.
          </p>
        )}
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
        >
          {deleting ? 'Suppression…' : confirmDelete ? 'Confirmer la suppression' : 'Supprimer mon compte'}
        </button>
        {confirmDelete && !deleting && (
          <button onClick={() => setConfirmDelete(false)} className="ml-3 text-xs text-muted-foreground hover:text-foreground">
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
