import { NextResponse } from 'next/server';

const PROJECT_ID = 'alquilala-77';
const DATABASE = 'alquilala';
const API_KEY = 'AIzaSyCfQxGT9EhJpv4vXZoMTHyy6Gl7Vih-f6w';

export async function POST(request) {
  try {
    const { propiedadId, userEmail, userName, userPhoto, puntuacion, comentario, fechaEstadia } = await request.json();

    if (!propiedadId || !puntuacion || !comentario) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const fields = {
      propiedadId: { stringValue: propiedadId },
      userEmail: { stringValue: userEmail || '' },
      userName: { stringValue: userName || 'Huésped' },
      userPhoto: { stringValue: userPhoto || '' },
      puntuacion: { integerValue: String(Math.min(5, Math.max(1, puntuacion))) },
      comentario: { stringValue: comentario },
      fechaEstadia: { stringValue: fechaEstadia || '' },
      fecha: { stringValue: new Date().toISOString() },
      aprobada: { booleanValue: false },
    };

    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}/documents/resenas?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Error guardando reseña');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}