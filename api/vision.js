// Función serverless (Vercel). Corre en el servidor, así tu API key nunca llega al navegador.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { image } = req.body || {};
  if (!image) return res.status(400).json({ error: 'Falta la imagen' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
              {
                type: 'text',
                text: `Mirá esta foto de una máquina o elemento de gimnasio. Identificá qué ejercicio se hace ahí y a qué grupo muscular corresponde.
Devolvé SOLO un objeto JSON, sin texto antes ni después, sin backticks, con esta forma exacta:
{"exercise": "nombre corto del ejercicio en español", "muscle_group": "uno de estos exactamente: Pecho, Espalda, Piernas, Hombros, Brazos, Core, Glúteos, Cardio", "confidence": "alta, media o baja"}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Error de la API de Anthropic: ' + errText });
    }

    const data = await response.json();
    const text = data.content.map((b) => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
