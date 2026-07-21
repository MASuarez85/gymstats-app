// Helper compartido para llamar a la API de Anthropic. La Fase 2 (Redis) va a envolver
// estas mismas funciones con un cache-aside antes de pegarle a la red.
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';

async function callAnthropic({ maxTokens, content }) {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    const err = new Error('Error de la API de Anthropic: ' + errText);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.content.map((b) => b.text || '').join('');
}

function stripJsonFence(text) {
  return text.replace(/```json|```/g, '').trim();
}

// Arma el bloque de contexto con correcciones previas del usuario, para que el
// modelo no repita el mismo error dos veces. `corrections` viene ordenado del
// más reciente al más viejo; se listan del más viejo al más nuevo para que la
// última corrección quede más cerca del final del prompt (más peso).
function buildCorrectionsContext(corrections) {
  if (!corrections || corrections.length === 0) return '';
  const lines = [...corrections].reverse().map(
    (c) => `- Detectaste "${c.originalExercise}" (${c.originalMuscleGroup}) y el usuario corrigió: "${c.correction}"`
  );
  return `\n\nCorrecciones que este usuario ya te hizo antes sobre otras fotos (tenelas en cuenta, puede que esta foto sea de una máquina parecida):\n${lines.join('\n')}`;
}

// Identifica el ejercicio y grupo muscular a partir de una foto de la máquina.
// `corrections`: correcciones previas de este usuario (ver buildCorrectionsContext).
export async function analyzeVisionPhoto(base64Image, corrections = []) {
  const text = await callAnthropic({
    maxTokens: 300,
    content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
      {
        type: 'text',
        text: `Mirá esta foto de una máquina o elemento de gimnasio. Identificá qué ejercicio se hace ahí y a qué grupo muscular corresponde.
Devolvé SOLO un objeto JSON, sin texto antes ni después, sin backticks, con esta forma exacta:
{"exercise": "nombre corto del ejercicio en español", "muscle_group": "uno de estos exactamente: Pecho, Espalda, Piernas, Hombros, Brazos, Core, Glúteos, Cardio", "confidence": "alta, media o baja"}${buildCorrectionsContext(corrections)}`,
      },
    ],
  });
  return JSON.parse(stripJsonFence(text));
}

// Responde una pregunta de gimnasio en texto libre.
export async function answerConsult(question) {
  const text = await callAnthropic({
    maxTokens: 600,
    content: `Sos un entrenador personal experimentado. Alguien te pregunta sobre un ejercicio de gimnasio. Respondé en español, de forma clara y concisa (máximo 200 palabras), cubriendo: cómo se ejecuta el movimiento paso a paso, 1-2 errores comunes a evitar, y qué grupo muscular trabaja principalmente. No uses markdown con asteriscos, usá texto plano con saltos de línea.

Pregunta: ${question}`,
  });
  return text;
}

// Extrae una rutina completa (lista de ejercicios) desde una foto de una hoja/pantalla.
export async function analyzeRoutinePhoto(base64Image) {
  const text = await callAnthropic({
    maxTokens: 1000,
    content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
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
  });
  return JSON.parse(stripJsonFence(text));
}
