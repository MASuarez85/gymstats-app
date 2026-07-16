// Verifica el identity token que la app iOS recibe de Sign in with Apple.
// La librería valida la firma contra las claves públicas de Apple y chequea
// que el token sea para nuestro bundle id (audience).
import appleSignin from 'apple-signin-auth';

export async function verifyAppleToken(identityToken) {
  const payload = await appleSignin.verifyIdToken(identityToken, {
    audience: process.env.APPLE_BUNDLE_ID,
    ignoreExpiration: false,
  });
  // payload.sub es el identificador estable y único de Apple para este usuario
  return { appleUserId: payload.sub, email: payload.email || null };
}
