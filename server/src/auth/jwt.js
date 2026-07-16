import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = '180d'; // app de uso personal: sesión larga, sin necesidad de refresh token por ahora

export function signSession(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifySession(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  return payload.sub;
}
