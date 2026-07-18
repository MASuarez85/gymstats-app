# GymStats — App nativa (Fases 3 y 4)

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
- **Menú de usuario**: barra superior persistente (`src/components/AppHeader.jsx`) con avatar (iniciales + color generados en el dispositivo, sin mandar el email a ningún tercero) que abre un menú (`UserMenuModal`) con nombre/email, estado de la prueba gratuita, "Editar perfil" (`ProfileEditModal`: nombre, altura, peso, objetivo, fecha de nacimiento — se guarda en `/profile` del backend) y "Cerrar sesión".
- **Prueba gratuita de 1 mes**: Calendario, Progreso, Consultar y Rutinas se grisan y muestran un ícono de candado en la barra de tabs 30 días después del alta si no hay suscripción activa. Tocar una pestaña bloqueada no navega — abre `PaywallModal` (Cerrar / Comprar suscripción); "Comprar" abre `SubscriptionScreen`, con el precio (US$20/mes) y un cuadro comparativo gratis vs premium. El botón de suscribirse todavía no cobra de verdad (falta conectar Apple In-App Purchases/StoreKit, próxima fase) — hoy `subscriptionActive` en la base se activa a mano. Para probar el bloqueo sin esperar 30 días: `UPDATE public.users SET trial_started_at = now() - interval '31 days' WHERE apple_user_id = 'dev-user';`
- **Preferencias** (dentro del menú de usuario → Preferencias, `PreferencesModal`):
  - **Tema** oscuro / claro / automático (`src/context/ThemeContext.jsx` + `LIGHT_COLORS`/`DARK_COLORS` en `src/theme/colors.js`). Todas las pantallas y componentes leen los colores de `useTheme()` en vez de un import estático, así reaccionan al cambio al toque. Se guarda en el dispositivo (AsyncStorage), no en la cuenta.
  - **Notificaciones** on/off (`src/context/NotificationsContext.jsx`, `expo-notifications`): recordatorios 100% locales (no hace falta servidor de push) — uno para registrar el primer entrenamiento mientras no haya ninguno, y otro para guardar una rutina una vez que ya entrenaste pero no tenés rutinas. Se cancelan solos apenas dejan de aplicar.
  - **Face ID** on/off (`expo-local-authentication`): pide Face ID al abrir la app y al volver del background. Se guarda en el dispositivo, no en la cuenta (es una preferencia de seguridad local).
  - **Conectar con Apple Fitness**: por ahora muestra un aviso de "Próximamente" — la integración real con HealthKit necesita habilitar esa capability en Apple Developer para este App ID, una librería nativa (`react-native-health` o similar) y un nuevo build; queda para una fase aparte.

## Setup local

1. `cd mobile && npm install`
2. `npx expo install --fix` — alinea las versiones de las dependencias nativas con el SDK de Expo instalado (las versiones que puse en `package.json` son un punto de partida, esto las corrige si Expo sacó una versión más nueva).
3. `npx expo install expo-image-picker expo-notifications expo-local-authentication` — no las pre-cargué en `package.json` para evitar fijar una versión que no coincida con tu SDK, como pasó antes con `expo-sqlite`.
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

## Fase 4: build y publicación

Esta parte no la puedo hacer yo desde acá — son todas cosas que requieren tu cuenta de Apple, tu cuenta de Expo, y pagos reales. Te dejo la guía completa.

### 1. Cuenta de Apple Developer Program

Andá a [developer.apple.com/programs](https://developer.apple.com/programs) y anotate (u$s 99/año). Sin esto no se puede firmar un build para dispositivo real ni publicar en el App Store. Puede tardar unas horas en aprobarse.

### 2. Elegir el bundle identifier real

Ahora mismo `app.json` tiene `com.tuusuario.gymstats` como placeholder. Elegí el definitivo (formato reverso de dominio, ej. `com.chino.gymstats`) y actualizalo en dos lugares:

- `mobile/app.json` → `expo.ios.bundleIdentifier`
- `server/.env` (y la variable de entorno del deploy en Railway) → `APPLE_BUNDLE_ID`, tiene que ser exactamente el mismo valor, porque el backend valida el token de Apple contra ese bundle id.

### 3. Cuenta de Expo (EAS) — gratis

Creá una cuenta en [expo.dev](https://expo.dev/signup). Después, en tu terminal:

```bash
cd mobile
npm install -g eas-cli
eas login
eas init
```

`eas init` linkea el proyecto a tu cuenta y le agrega un `projectId` a `app.json` (no lo puse yo porque se genera al vincular tu cuenta real).

### 4. Primer build de prueba (recomendado antes del build final)

```bash
eas build --platform ios --profile preview
```

Esto arma un build standalone (no depende de Metro/tu compu) que podés instalar directo en tu iPhone desde el link que te da EAS al terminar — ahí sí vas a poder probar **Sign in with Apple de verdad**, algo que Expo Go no permite. Usá este build para confirmar que todo el flujo real funciona antes de ir al build de producción.

### 5. Build de producción

```bash
eas build --platform ios --profile production
```

La primera vez, EAS te va a preguntar si querés que gestione las credenciales de firma (certificados, provisioning profile) — dejalo, es la opción recomendada, evita tener que hacerlo a mano en Xcode.

### 6. Subir a App Store Connect

```bash
eas submit -p ios --latest
```

Te va a pedir loguearte con tu Apple ID (o un API key de App Store Connect, que EAS puede generar). Esto sube el build para que aparezca en TestFlight.

### 7. Completar la ficha en App Store Connect

Entrá a [appstoreconnect.apple.com](https://appstoreconnect.apple.com) y completá:

- Nombre, descripción, categoría.
- **Política de privacidad**: usá el contenido de `mobile/PRIVACY.md` — subilo a algún lugar público (una página simple de GitHub Pages alcanza) y completá el email de contacto real antes de publicarla. Apple pide la URL en la ficha de la app.
- Cuestionario de privacidad ("App Privacy"): basate en lo mismo que dice `PRIVACY.md` (identificador de Apple para login, datos de entrenamiento, fotos enviadas a un proveedor de IA para análisis).
- Capturas de pantalla: sacalas del build de preview corriendo en tu iPhone o en el simulador.
- Testers de TestFlight: agregá tu propio Apple ID como tester interno para probarla instalada "de verdad" antes de mandarla a revisión pública (si es que la vas a hacer pública — para uso 100% personal, alcanza con quedarte en TestFlight interno, sin publicarla en el store).

### Qué reemplazar antes de ir a producción

- El ícono (`mobile/assets/icon.png`) es un placeholder que armé yo (una mancuerna simple con los colores de la app) — reemplazalo si querés algo más elaborado.
- El email de contacto en `mobile/PRIVACY.md` (tiene un placeholder `[tu-email-de-contacto@ejemplo.com]`).
