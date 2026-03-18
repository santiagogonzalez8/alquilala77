import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export async function POST(request) {
  try {
    const {
      propiedadId,
      titulo,
      ubicacion,
      fechaInicio,
      fechaFin,
      noches,
      precioPorNoche,
      total,
      userEmail,
      userName,
    } = await request.json();

    if (!propiedadId || !total || !userEmail) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: propiedadId,
            title: `${titulo} — ${noches} noche${noches !== 1 ? 's' : ''}`,
            description: `${ubicacion} · Del ${fechaInicio} al ${fechaFin}`,
            category_id: 'services',
            quantity: 1,
            currency_id: 'USD',
            unit_price: Number(total),
          },
        ],
        payer: {
          name: userName || '',
          email: userEmail,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_URL || 'https://alquilala.vercel.app'}/reserva/confirmada`,
          failure: `${process.env.NEXT_PUBLIC_URL || 'https://alquilala.vercel.app'}/reserva/error`,
          pending: `${process.env.NEXT_PUBLIC_URL || 'https://alquilala.vercel.app'}/reserva/pendiente`,
        },
        auto_return: 'approved',
        external_reference: JSON.stringify({
          propiedadId,
          titulo, 
          fechaInicio,
          fechaFin,
          noches,
          total,
          userEmail,
        }),
        notification_url: `${process.env.NEXT_PUBLIC_URL || 'https://alquilala.vercel.app'}/api/pagos/webhook`,
        statement_descriptor: 'ALQUILALA',
        metadata: {
          propiedadId,
          fechaInicio,
          fechaFin,
        },
      },
    });

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });

  } catch (error) {
    console.error('Error creando preferencia MP:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}