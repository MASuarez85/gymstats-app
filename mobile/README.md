# GymStats — App nativa (Fase 3)

App iOS con Expo (React Native). Consume el backend de `server/` (Fases 1 y 2) en vez de `localStorage`.

## Estado actual

Las 6 pestañas de la app original están portadas: Registrar, Historial, Calendario, Progreso, Consultar y Rutinas.

- Scaffold, navegación y login con Sign in with Apple (+ un login de prueba para desarrollo, ver `src/screens/LoginScreen.jsx`).
- Cliente de API (`src/api/client.js`) contra todos los endpoints del backend.
- `src/hooks/useGymData.js` + `src/context/GymDataContext.jsx`: entries, day-plans, rutinas, asignaciones y progreso compartidos entre pantallas, con un espejo en AsyncStorage para que la app cargue instantáneo con el último dato conocido aunque no haya señal (la escritura sin conexión todavía no tiene cola de reintento — queda para más adelante).
- **Registrar**: cámara → análisis por IA → carga de series → guardado, con el mismo chequeo de "plan del día" que la versión web. También recibe el prefill que manda Calendario al tocar "Cargar series".
- **Historial**: entrenamientos agrupados por fecha, con la pila de discos del set más pesado.
- **Calendario**: grilla mensual, plan y rutina asignados por día, checklist de progreso. La exportación a Calendario de iPhone/Google Calendar de la web no está portada (necesitaría `expo-calendar`, una dependencia nueva).
- **Progreso**: gráficos de frecuencia por grupo muscular y evolución de peso — con charts hechos a mano sobre `react-native-svg` (`SimpleBarChart`/`SimpleLineChart`) en vez de una librería de charting nueva, para no repetir los problemas de versiones que tuvimos con otras dependencias.
- **Consultar**: chat contra `/ai/consult` (se beneficia del cache de Redis del backend si la pregunta se repite).
- **Rutinas**: lista + constructor (a mano o completado desde una foto).

## Setup local

1. `cd mobile && npm install`
2. `npx expo install --fix` — alinea las versiones de las dependencias nativas con el SDK de Expo instalado (las versiones que puse en `package.json` son un punto de partida, esto las corrige si Expo sacó una versión más nueva).
3. `npx expo install expo-image-picker` — lo usa la pantalla Registrar para sacar la foto de la máquina (no lo pre-cargué en `package.json` para evitar fijar una versión que no coincida con tu SDK, como pasó antes con `expo-sqlite`).
4. Variable de entorno: creá `.env` con
   ```
   EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3001
   ```
   En un dispositivo físico `localhost` apunta al propio teléfono, no a tu compu — usá la IP de tu red local (`ipconfig getifaddr en0` en Mac) mientras probás, y la URL de Railway cuando el backend esté deployado.
5. `npx expo start` — te da un QR. Para probar Sign in with Apple hace falta un build nativo (no funciona en Expo Go), así que para eso vas a necesitar `npx expo run:ios` con Xcode, o un build de desarrollo con EAS.

## Cuenta de Apple Developer

Sign in with Apple y la publicación en el App Store requieren una cuenta de Apple Developer Program (u$s 99/año). Sin eso podés probar todo el resto de la app, pero no el login.

## Qué falta

- Exportar a Calendario de iPhone / Google Calendar (la web lo tenía, acá no).
- Cola de escrituras pendientes para cuando no hay señal (hoy solo la lectura es resiliente offline).
- Reemplazar el ícono/splash placeholder de Expo por los definitivos.
- Build de producción con EAS y submit a TestFlight (Fase 4).
