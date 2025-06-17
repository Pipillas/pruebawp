const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'asdasd123';
const WHATSAPP_TOKEN = 'EAAIeTKrdWZCcBOwoGl5v1tvWbV5PZCZAoK6sUo2fl3XZAxtWXNCMMkjdwgDsDQpiMnVXfrlatXognmAtMnvCPU5iDDheBHXLNEQkyvsln94n8aAsLgdWzLLzYaYCBtwZAxKkNvPJx5LSgW8yGFoA1dgakKFzryk5q1fkUun5rj9tbbKCzrCPwIRrn5EGWmnkyLCpZBIMiZA1r392WZBncsQ5pjA6rTR91b79';
const PHONE_ID = '717238518132330';

// ✅ Función para corregir el número de teléfono (elimina el "9" después de "54")
function formatPhoneNumber(number) {
    if (number.startsWith('549') && number.length === 13) {
        const codigoArea = number.slice(3, 6);     // "291"
        const resto = number.slice(6);             // "4414797"
        return `54${codigoArea}15${resto}`;        // "54291154414797"
    }
    return number;
}

// RUTA PARA VERIFICAR WEBHOOK
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verificado');
        res.status(200).send(`${challenge}`);
    } else {
        res.sendStatus(403);
    }
});

// RUTA PARA ESCUCHAR MENSAJES
app.post('/webhook', async (req, res) => {
    const entry = req.body.entry?.[0];
    const message = entry?.changes?.[0]?.value?.messages?.[0];
    if (message && message.text) {
        const from = message.from;
        const msgBody = message.text.body.toLowerCase();
        console.log("📨 Mensaje recibido de:", from);
        console.log("📝 Contenido:", msgBody);
        if (msgBody.includes('hola')) {
            try {
                const response = await axios.post(
                    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
                    {
                        messaging_product: 'whatsapp',
                        to: from,
                        type: 'text',
                        text: {
                            body: `👋 BIENVENIDO SELECCIONE ALGUNA DE LAS OPCIONES:\n1️⃣ CONTACTAR ASESOR\n2️⃣ SABER HORARIOS\n3️⃣ SABER UBICACIONES`
                        }
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                            'Content-Type': 'application/json',
                        }
                    }
                );
            } catch (error) {
                console.error("❌ Error al enviar mensaje:");
                console.error(error.response?.data || error.message);
            }
        }
    }
    res.sendStatus(200);
});

app.post('/send-buttons', async (req, res) => {
    const { to } = req.body;

    try {
        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: {
                        text: "👋 Hola, ¿qué querés hacer?"
                    },
                    action: {
                        buttons: [
                            {
                                type: 'reply',
                                reply: {
                                    id: 'contactar_asesor',
                                    title: '📞 Contactar asesor'
                                }
                            },
                            {
                                type: 'reply',
                                reply: {
                                    id: 'ver_horarios',
                                    title: '🕓 Ver horarios'
                                }
                            },
                            {
                                type: 'reply',
                                reply: {
                                    id: 'ver_ubicacion',
                                    title: '📍 Ver ubicaciones'
                                }
                            }
                        ]
                    }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log("✅ Botones enviados:", response.data);
        res.status(200).json({ status: 'ok', response: response.data });

    } catch (error) {
        console.error("❌ Error al enviar botones:");
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

app.listen(3000, () => {
    console.log('Bot escuchando en http://localhost:3000');
});