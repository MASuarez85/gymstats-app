# GymStats

App personal de tracking de entrenamientos: registrás fotos de las máquinas, la IA detecta el ejercicio, y llevás el historial, calendario y progreso.

## Qué necesitás antes de arrancar

1. **Una cuenta en [Vercel](https://vercel.com)** (gratis, podés entrar con GitHub).
2. **Una API key de Anthropic**, sacada de [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key. Vas a cargar unos dólares de crédito ahí (el uso personal de esta app es muy barato, centavos por mes).

## Pasos para publicarla (una sola vez)

### 1. Subir el código a GitHub
- Creá un repositorio nuevo en GitHub (puede ser privado).
- Subí todos los archivos de esta carpeta a ese repositorio.

Si no usaste git antes, desde una terminal parada en esta carpeta:
```bash
git init
git add .
git commit -m "GymStats"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/gymstats.git
git push -u origin main
```

### 2. Importar el proyecto en Vercel
1. Entrá a [vercel.com/new](https://vercel.com/new) y elegí "Import" tu repositorio de GitHub.
2. Vercel va a detectar automáticamente que es un proyecto Vite — no cambies nada de la configuración de build.
3. Antes de darle "Deploy", andá a **Environment Variables** y agregá:
   - Name: `ANTHROPIC_API_KEY`
   - Value: tu clave (la que empieza con `sk-ant-...`)
4. Dale a **Deploy**. En un minuto te da una URL tipo `https://gymstats-tuusuario.vercel.app`.

### 3. Agregarla a tu iPhone
1. Abrí esa URL en **Safari** (tiene que ser Safari, no Chrome, para que funcione el "Agregar a inicio").
2. Tocá el botón de compartir (el cuadradito con la flecha).
3. Elegí **"Agregar a pantalla de inicio"**.
4. Listo — te queda un ícono como cualquier app, abre en pantalla completa sin la barra de Safari.

## Actualizar la app más adelante
Cualquier cambio que quieras hacer (pedirle a Claude que ajuste algo, por ejemplo), simplemente:
```bash
git add .
git commit -m "cambios"
git push
```
Vercel vuelve a desplegar solo en unos segundos, y la próxima vez que abras la app en el iPhone ya está actualizada.

## Cómo funciona por dentro
- El frontend (`src/App.jsx`) es la app que ves.
- Las carpetas `api/vision.js` y `api/consult.js` son funciones que corren en el servidor de Vercel: reciben la foto o la pregunta desde tu iPhone, llaman a la API de Anthropic usando tu clave secreta (que nunca sale del servidor), y devuelven la respuesta. Esto evita que cualquiera que inspeccione la app pueda robarte la clave.
- Los datos (entrenamientos, plan de días) se guardan en el `localStorage` del propio Safari en tu iPhone — quedan ahí mientras no borres los datos de navegación de esa web. Si algún día usás la app desde otro dispositivo, vas a empezar con el historial vacío ahí (no hay sincronización entre dispositivos en esta versión).

## Costo aproximado
Cada foto analizada o pregunta a la IA cuesta fracciones de centavo de dólar con el modelo usado. Para uso personal diario, estamos hablando de centavos por mes.
