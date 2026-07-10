// Función serverless (Vercel). Corre en el servidor, así tu API key nunca llega al navegador.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { question } = req.body || {};
  if (!question) return res.status(400).json({ error: 'Falta la pregunta' });

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
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content: `Sos un entrenador personal experimentado. Alguien te pregunta sobre un ejercicio de gimnasio. Respondé en español, de forma clara y concisa (máximo 200 palabras), cubriendo: cómo se ejecuta el movimiento paso a paso, 1-2 errores comunes a evitar, y qué grupo muscular trabaja principalmente. No uses markdown con asteriscos, usá texto plano con saltos de línea.

Pregunta: ${question}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Error de la API de Anthropic: ' + errText });
    }

    const data = await response.json();
    const answer = data.content.map((b) => b.text || '').join('');
    return res.status(200).json({ answer });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
