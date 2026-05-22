import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { LayoutGrid, Plug, Bot, BarChart2, MessageSquare, Settings } from 'lucide-react';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Check if user has completed onboarding
  const tenantIds = (user.app_metadata?.tenant_ids as string[] | undefined) ?? [];
  const isOnboarded = tenantIds.length > 0;
  if (!isOnboarded) redirect('/onboarding');

  const tNav = await getTranslations('nav');
  const tLayout = await getTranslations('layout');

  const navLinks = [
    { key: 'overview', href: '/', icon: LayoutGrid },
    { key: 'connections', href: '/connections', icon: Plug },
    { key: 'agents', href: '/agents', icon: Bot },
    { key: 'reports', href: '/reports', icon: BarChart2 },
    { key: 'messages', href: '/messages', icon: MessageSquare },
  ] as const;

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <aside className="border-r bg-muted/30 flex flex-col">
        <div className="px-4 py-5 border-b">
          <Link href="/" className="text-lg font-bold tracking-tight">{tLayout('brand')}</Link>
          <p className="text-xs text-muted-foreground">{tLayout('tagline')}</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navLinks.map(({ key, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Icon className="h-4 w-4" />
              <span>{tNav(key)}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>{tNav('settings')}</span>
          </Link>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </header>
        <main className="flex-1 p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}
