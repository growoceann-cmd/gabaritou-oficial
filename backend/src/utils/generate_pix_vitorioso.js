import fetch from 'node-fetch';

const MP_TOKEN = 'APP_USR-3617043818585091-041902-e332ba243564a9dc1ca217d991-52048695';

async function generatePixVitorioso() {
  const url = 'https://api.mercadopago.com/v1/payments';
  const body = {
    transaction_amount: 5.90,
    description: 'PLANO VITORIOSO — O Plano que os Cursinhos Odeiam (Porta de Entrada)',
    payment_method_id: 'pix',
    payer: {
      email: 'contato@gabaritouconcursos.com.br',
      first_name: 'Vitorioso',
      last_name: 'Gabaritou',
      identification: {
        type: 'CPF',
        number: '12345678909' 
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `vitorioso_${Date.now()}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.point_of_interaction) {
      console.log('--- PIX VITORIOSO GENERATED ---');
      console.log('CopyPaste:', data.point_of_interaction.transaction_data.qr_code);
      console.log('TicketUrl:', data.point_of_interaction.transaction_data.ticket_url);
    } else {
      console.error('Error:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

generatePixVitorioso();
