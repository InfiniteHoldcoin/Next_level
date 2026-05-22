import { NextRequest, NextResponse } from 'next/server';

const API = process.env.API_URL ?? 'http://localhost:3000';
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const res = await fetch(`${API}/admin/clients/${tenantId}`, {
    headers: { 'x-admin-secret': SECRET },
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const body = await req.json();
  const res = await fetch(`${API}/admin/clients/${tenantId}`, {
    method: 'PATCH',
    headers: { 'x-admin-secret': SECRET, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
