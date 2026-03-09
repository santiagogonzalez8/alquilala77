import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const {
      propiedadTitulo,
      propiedadUbicacion,
      propiedadHuespedes,
      fechaCheckIn,
      fechaCheckOut,
      noches,
      total,
      userName,
      userEmail,
      userTelefono,
      metodoPago,
      pagoId,
    } = await request.json();

    const fechaHoy = new Date().toLocaleDateString('es-UY', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', sans-serif;
      color: #1a1a2e;
      line-height: 1.6;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #1e3a5f;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: 900;
      color: #1e3a5f;
      letter-spacing: -1px;
    }
    .logo span { color: #c8956c; }
    .contrato-num {
      font-size: 13px;
      color: #666;
      text-align: right;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 8px;
      text-align: center;
    }
    .subtitulo {
      text-align: center;
      color: #666;
      font-size: 13px;
      margin-bottom: 30px;
    }
    .seccion {
      margin-bottom: 24px;
    }
    .seccion-titulo {
      font-size: 13px;
      font-weight: 700;
      color: #1e3a5f;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .campo {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 10px 14px;
    }
    .campo-label {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 2px;
    }
    .campo-valor {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
    }
    .total-box {
      background: #1e3a5f;
      color: white;
      border-radius: 10px;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 20px 0;
    }
    .total-label { font-size: 15px; opacity: 0.85; }
    .total-valor { font-size: 28px; font-weight: 900; }
    .clausulas {
      font-size: 12px;
      color: #555;
      line-height: 1.8;
    }
    .clausulas h3 {
      font-size: 13px;
      color: #1e3a5f;
      margin: 16px 0 6px;
      font-weight: 700;
    }
    .clausulas li {
      margin-left: 16px;
      margin-bottom: 4px;
    }
    .firmas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .firma-bloque { text-align: center; }
    .firma-linea {
      border-bottom: 1px solid #1e3a5f;
      height: 50px;
      margin-bottom: 8px;
    }
    .firma-nombre { font-size: 12px; color: #666; }
    .firma-cargo { font-size: 11px; color: #999; }
    .footer {
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    .badge-pagado {
      display: inline-block;
      background: #d1fae5;
      color: #065f46;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
      margin-left: 8px;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="logo">alquila<span>la</span></div>
    <div class="contrato-num">
      <div style="font-weight:700;font-size:14px;color:#1e3a5f">CONTRATO DE RESERVA</div>
      <div>N° ${pagoId || Date.now()}</div>
      <div>Fecha: ${fechaHoy}</div>
    </div>
  </div>

  <h1>Contrato de Alquiler Temporal</h1>
  <p class="subtitulo">
    Alquilala Uruguay · alquilala.vercel.app · +598 95 532 294
  </p>

  <!-- Propiedad -->
  <div class="seccion">
    <div class="seccion-titulo">🏠 Propiedad reservada</div>
    <div class="grid-2">
      <div class="campo">
        <div class="campo-label">Propiedad</div>
        <div class="campo-valor">${propiedadTitulo || '—'}</div>
      </div>
      <div class="campo">
        <div class="campo-label">Ubicación</div>
        <div class="campo-valor">${propiedadUbicacion || '—'}</div>
      </div>
      <div class="campo">
        <div class="campo-label">Capacidad máxima</div>
        <div class="campo-valor">${propiedadHuespedes || '—'} huéspedes</div>
      </div>
      <div class="campo">
        <div class="campo-label">Método de pago</div>
        <div class="campo-valor">
          ${metodoPago === 'mercadopago' ? 'MercadoPago' : metodoPago || 'Efectivo'}
          ${pagoId ? `<span class="badge-pagado">✓ Pagado</span>` : ''}
        </div>
      </div>
    </div>
  </div>

  <!-- Fechas -->
  <div class="seccion">
    <div class="seccion-titulo">📅 Fechas de estadía</div>
    <div class="grid-2">
      <div class="campo">
        <div class="campo-label">Check-in</div>
        <div class="campo-valor">${fechaCheckIn || '—'}</div>
      </div>
      <div class="campo">
        <div class="campo-label">Check-out</div>
        <div class="campo-valor">${fechaCheckOut || '—'}</div>
      </div>
      <div class="campo">
        <div class="campo-label">Duración</div>
        <div class="campo-valor">${noches} noche${noches !== 1 ? 's' : ''}</div>
      </div>
      <div class="campo">
        <div class="campo-label">Horario check-in / out</div>
        <div class="campo-valor">14:00 hs / 11:00 hs</div>
      </div>
    </div>
  </div>

  <!-- Huésped -->
  <div class="seccion">
    <div class="seccion-titulo">👤 Datos del huésped</div>
    <div class="grid-2">
      <div class="campo">
        <div class="campo-label">Nombre completo</div>
        <div class="campo-valor">${userName || '—'}</div>
      </div>
      <div class="campo">
        <div class="campo-label">Email</div>
        <div class="campo-valor">${userEmail || '—'}</div>
      </div>
      ${userTelefono ? `
      <div class="campo">
        <div class="campo-label">Teléfono</div>
        <div class="campo-valor">${userTelefono}</div>
      </div>` : ''}
    </div>
  </div>

  <!-- Total -->
  <div class="total-box">
    <div class="total-label">💰 Total de la reserva</div>
    <div class="total-valor">$${Number(total || 0).toLocaleString('es-UY')} USD</div>
  </div>

  <!-- Cláusulas -->
  <div class="seccion clausulas">
    <div class="seccion-titulo">📋 Términos y condiciones</div>

    <h3>1. Uso de la propiedad</h3>
    <ul>
      <li>La propiedad se entrega en perfecto estado de limpieza y conservación.</li>
      <li>El huésped se compromete a cuidar la propiedad y sus bienes.</li>
      <li>Se prohíbe fumar dentro de la propiedad (salvo espacios habilitados).</li>
      <li>Se prohíben fiestas o reuniones que superen la capacidad máxima indicada.</li>
      <li>Las mascotas solo están permitidas si fue acordado expresamente.</li>
    </ul>

    <h3>2. Check-in y check-out</h3>
    <ul>
      <li>Check-in: a partir de las 14:00 hs del día de ingreso.</li>
      <li>Check-out: antes de las 11:00 hs del día de salida.</li>
      <li>Check-in tardío o early check-out debe coordinarse con anticipación.</li>
    </ul>

    <h3>3. Política de cancelación</h3>
    <ul>
      <li>Cancelación con más de 30 días de anticipación: reembolso del 80%.</li>
      <li>Cancelación entre 15 y 30 días: reembolso del 50%.</li>
      <li>Cancelación con menos de 15 días: sin reembolso.</li>
      <li>En caso de fuerza mayor se evaluará cada caso individualmente.</li>
    </ul>

    <h3>4. Responsabilidades</h3>
    <ul>
      <li>El huésped es responsable por daños causados durante la estadía.</li>
      <li>Alquilala no se responsabiliza por objetos olvidados en la propiedad.</li>
      <li>Alquilala actúa como administrador en nombre del propietario.</li>
    </ul>

    <h3>5. Servicios incluidos</h3>
    <ul>
      <li>Limpieza inicial y final incluida en el precio.</li>
      <li>Ropa de cama y toallas (según descripción de la propiedad).</li>
      <li>Atención al huésped 24/7 vía WhatsApp.</li>
    </ul>
  </div>

  <!-- Firmas -->
  <div class="firmas">
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${userName || 'Huésped'}</div>
      <div class="firma-cargo">Huésped</div>
    </div>
    <div class="firma-bloque">
      <div class="firma-linea"></div>
      <div class="firma-nombre">Alquilala Uruguay</div>
      <div class="firma-cargo">Administrador de la propiedad</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Alquilala · alquilala.vercel.app · hola@alquilala.com · +598 95 532 294<br>
    Este documento fue generado automáticamente el ${fechaHoy}.
    Conserve este comprobante como respaldo de su reserva.
  </div>

</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}