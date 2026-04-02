import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-guards';

export async function POST() {
  try {
    const session = await requireRole(['ADMIN']);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Endpoint de seed mockado foi desativado em produção.' },
      { status: 410 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Erro ao popular banco" }, { status: 500 });
  }
}