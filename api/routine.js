// Función serverless (Vercel). Extrae una rutina completa (lista de ejercicios) desde una foto.
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
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
              {
                type: 'text',
                text: `Esta es una foto de una rutina de gimnasio (puede estar escrita a mano, impresa, o ser una captura de pantalla). Extraé la lista de ejercicios.

Devolvé SOLO un objeto JSON, sin texto antes ni después, sin backticks, con esta forma exacta:
{
  "name": "nombre corto sugerido para la rutina, ej: Rutina Push",
  "exercises": [
    { "name": "nombre del ejercicio", "muscle_group": "uno de: Pecho, Espalda, Piernas, Hombros, Brazos, Core, Glúteos, Cardio", "targetSets": 3, "targetReps": 10 }
  ]
}

Si no podés leer algún dato (por ejemplo las series u reps no están escritas), usá 3 series y 10 reps como valor por defecto. Si hay varios ejercicios, incluilos todos en el array.`,
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
