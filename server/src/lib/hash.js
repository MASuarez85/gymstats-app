import crypto from 'node:crypto';

// Usado para armar las keys de cache de fotos (vision/routine) y preguntas (consult),
// sin guardar el contenido original en la key.
export function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}
