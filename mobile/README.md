# GymStats — App nativa (Fase 3)

App iOS con Expo (React Native). Consume el backend de `server/` (Fases 1 y 2) en vez de `localStorage`.

## Estado actual

- Scaffold, navegación (4 tabs: Registrar, Historial, Calendario, Rutinas) y login con Sign in with Apple: listos.
- Cliente de API (`src/api/client.js`) contra todos los endpoints del backend: listo.
- Las 4 pantallas todavía son placeholders — se van completando portando la lógica de `src/App.jsx` del proyecto web, pantalla por pantalla.

## Setup local

1. `cd mobile && npm install`
2. `npx expo install --fix` — alinea las versiones de las dependencias nativas con el SDK de Expo instalado (las versiones que puse en `package.json` son un punto de partida, esto las corrige si Expo sacó una versión más nueva).
3. Variable de entorno: creá `.env` con
   ```
   EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3001
   ```
   En un dispositivo físico `localhost` apunta al propio teléfono, no a tu compu — usá la IP de tu red local (`ipconfig getifaddr en0` en Mac) mientras probás, y la URL de Railway cuando el backend esté deployado.
4. `npx expo start` — te da un QR. Para probar Sign in with Apple hace falta un build nativo (no funciona en Expo Go), así que para eso vas a necesitar `npx expo run:ios` con Xcode, o un build de desarrollo con EAS.

## Cuenta de Apple Developer

Sign in with Apple y la publicación en el App Store requieren una cuenta de Apple Developer Program (u$s 99/año). Sin eso podés probar todo el resto de la app, pero no el login.

## Qué falta

- Portar Registrar (cámara + IA) con soporte offline (SQLite local).
- Portar Historial, Calendario y Rutinas.
- Reemplazar el ícono/splash placeholder de Expo por los definitivos.
- Build de producción con EAS y submit a TestFlight (Fase 4).
