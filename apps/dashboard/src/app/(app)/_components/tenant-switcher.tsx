'use client';

import { useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export function TenantSwitcher() {
  const [open, setOpen] = useState(false);
  const tenants = [{ id: 'demo', name: 'Demo Tenant' }] as const;
  const active = tenants[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm',
          'hover:bg-accent',
        )}
      >
        <span className="font-medium">{active.name}</span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 rounded-md border bg-card p-1 shadow-md">
          {tenants.map((t) => (
            <button
              key={t.id}
              type="button"
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
