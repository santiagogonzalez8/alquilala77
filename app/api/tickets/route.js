import { NextResponse } from 'next/server';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'alquilala-77';
const DATABASE = 'alquilala';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request) {
  try {
    const { nombre, email, telefono, asunto, mensaje } = await request.json();

    if (!nombre || !email || !mensaje) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const fields = {
      nombre:   { stringValue: nombre },
      email:    { stringValue: email },
      telefono: { stringValue: telefono || '' },
      asunto:   { stringValue: asunto || 'Consulta general' },
      mensaje:  { stringValue: mensaje },
      fecha:    { stringValue: new Date().toISOString() },
      estado:   { stringValue: 'pendiente' },
    };

    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}/documents/tickets-soporte?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Error al guardar ticket');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}