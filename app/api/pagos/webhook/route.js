import { MercadoPagoConfig, Payment } from 'mercadopago';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'alquilala-77';
const DATABASE = 'alquilala';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Verificar firma de MercadoPago para seguridad
function verificarFirmaMP(request, body) {
  try {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) return true; // Si no hay secret configurado, permitir (para desarrollo)

    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    if (!xSignature || !xRequestId) return false;

    const parts = xSignature.split(',');
    const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
    const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];
    if (!ts || !v1) return false;

    const dataId = body?.data?.id;
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    return hmac === v1;
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Verificar firma
    if (!verificarFirmaMP(request, body)) {
      console.warn('Webhook MP: firma inválida');
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }

    const { type, data } = body;

    if (type !== 'payment') {
      return NextResponse.json({ received: true });
    }

    const payment = new Payment(client);
    const pagoInfo = await payment.get({ id: data.id });

    if (pagoInfo.status !== 'approved') {
      return NextResponse.json({ received: true });
    }

    const ref = JSON.parse(pagoInfo.external_reference || '{}');
    const { propiedadId, titulo, fechaInicio, fechaFin, noches, total, userEmail } = ref;

    const reservaData = {
      propiedadId:  { stringValue: propiedadId || '' },
      fechaCheckIn: { stringValue: fechaInicio || '' },
      fechaCheckOut:{ stringValue: fechaFin || '' },
      noches:       { stringValue: String(noches || '') },
      precioTotal:  { stringValue: String(total || '') },
      userEmail:    { stringValue: userEmail || '' },
      estado:       { stringValue: 'confirmada' },
      metodoPago:   { stringValue: 'mercadopago' },
      pagoId:       { stringValue: String(data.id) },
      fechaReserva: { stringValue: new Date().toISOString() },
    };

    await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}/documents/reservas?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: reservaData }),
      }
    );

    return NextResponse.json({ received: true, status: 'reserva_creada' });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'webhook activo' });
}