import fetch from 'node-fetch';

const MP_TOKEN = 'APP_USR-3617043818585091-041902-e332ba243564a9dc1ca217d991-52048695';

async function generatePix() {
  const url = 'https://api.mercadopago.com/v1/payments';
  const body = {
    transaction_amount: 19.90,
    description: 'Promoção DOBRO OU NADA — GABARITOU (60 Dias)',
    payment_method_id: 'pix',
    payer: {
      email: 'contato@gabaritouconcursos.com.br',
      first_name: 'Sniper',
      last_name: 'Gabaritou',
      identification: {
        type: 'CPF',
        number: '12345678909' // Placeholder para gerar o pagamento
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `dobro_ou_nada_${Date.now()}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.point_of_interaction) {
      console.log('--- PIX GENERATED ---');
      console.log('CopyPaste:', data.point_of_interaction.transaction_data.qr_code);
      console.log('TicketUrl:', data.point_of_interaction.transaction_data.ticket_url);
    } else {
      console.error('Error generating PIX:', data);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

generatePix();
