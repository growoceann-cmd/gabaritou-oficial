import axios from 'axios';

const mp_token = 'APP_USR-3617043818585091-041402-7244958f8d2fdc5ed85b5fc8b2ca56f1-52048695';

const services = [
    { id: 'radar_elite', title: 'Gabaritou | Radar Elite (Mensal)', price: 3.00 },
    { id: 'gps_aprovacao', title: 'Gabaritou | GPS de Aprovação (Unidade)', price: 2.00 },
    { id: 'mapa_mental_ia', title: 'Gabaritou | Mapa Mental IA (Unidade)', price: 2.00 }
];

async function createLinks() {
    console.log('--- Gerando Links de Pagamento Mercado Pago ---');
    for (const service of services) {
        try {
            const response = await axios.post('https://api.mercadopago.com/checkout/preferences', {
                items: [
                    {
                        title: service.title,
                        quantity: 1,
                        unit_price: service.price,
                        currency_id: 'BRL'
                    }
                ],
                back_urls: {
                    success: 'https://t.me/gabaritou_oficial_bot',
                    failure: 'https://t.me/gabaritou_oficial_bot'
                },
                auto_return: 'approved'
            }, {
                headers: {
                    'Authorization': `Bearer ${mp_token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✅ ${service.title}: ${response.data.init_point}`);
        } catch (e) {
            console.error(`❌ Erro no serviço ${service.id}:`, e.response?.data || e.message);
        }
    }
}

createLinks();
