import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  nouveau: 'bg-blue-100 text-blue-700',
  en_meeting: 'bg-yellow-100 text-yellow-700',
  en_setup: 'bg-purple-100 text-purple-700',
  actif: 'bg-green-100 text-green-700',
  inactif: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  nouveau: 'Nouveau',
  en_meeting: 'En meeting',
  en_setup: 'En setup',
  actif: 'Actif',
  inactif: 'Inactif',
};

type Tenant = {
  id: string;
  name: string;
  business_type: string | null;
  website_url: string | null;
  city: string | null;
  client_status: string;
  assigned_to: string | null;
  created_at: string;
};

async function getTenants(): Promise<Tenant[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/tenants?select=id,name,business_type,website_url,city,client_status,assigned_to,created_at&order=created_at.desc`,
      {
        headers: { Authorization: `Bearer ${key}`, apikey: key },
        cache: 'no-store',
      }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function AdminPage() {
  const tenants = await getTenants();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tenants.length} compte{tenants.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {tenants.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-12 text-center">
          <p className="text-gray-500 text-sm">Aucun client inscrit pour l'instant.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Entreprise</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ville</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Assigné à</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/client/${t.id}`} className="font-medium hover:underline text-blue-700">{t.name}</Link>
                    {t.website_url && (
                      <div className="text-xs text-gray-400 truncate max-w-[200px]">{t.website_url}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.business_type === 'products' ? 'Produits' : t.business_type === 'services' ? 'Services' : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[t.client_status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[t.client_status] ?? t.client_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.assigned_to ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(t.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
