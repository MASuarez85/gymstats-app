# Política de privacidad de GymStats

Última actualización: julio de 2026.

GymStats es una app personal de seguimiento de entrenamientos de gimnasio. Esta página describe qué datos usa la app y cómo se manejan.

## Qué datos se recolectan

- **Identidad**: al iniciar sesión con "Sign in with Apple", se recibe un identificador único de tu cuenta de Apple y, si elegís compartirlo, tu nombre y correo electrónico. Este identificador se usa únicamente para asociar tus datos de entrenamiento a tu cuenta.
- **Datos de entrenamiento**: ejercicios, series, pesos, repeticiones, fechas, rutinas y planes que cargás en la app.
- **Fotos**: cuando fotografiás una máquina de gimnasio o una rutina escrita, la foto se envía a la API de Anthropic (proveedor del modelo de IA que identifica el ejercicio o transcribe la rutina) para su análisis. Las fotos no se guardan de forma permanente en los servidores de GymStats — se procesan para generar una respuesta y no se retienen más allá de eso. El procesamiento por parte de Anthropic está sujeto a sus propias políticas de datos ([anthropic.com/legal/privacy](https://www.anthropic.com/legal/privacy)).
- **Consultas de texto**: las preguntas que le hacés a la IA sobre ejercicios se envían de la misma manera a la API de Anthropic para generar una respuesta.

## Dónde se guardan los datos

Los datos de entrenamiento, rutinas y planes se guardan en una base de datos privada (PostgreSQL) operada para esta app. No se comparten con terceros, no se venden, y no se usan para publicidad.

## Lo que GymStats NO hace

- No muestra publicidad.
- No usa rastreo de terceros ni SDKs de analítica de marketing.
- No comparte ni vende datos a terceros.

## Tus derechos

Podés pedir que se borren tus datos de entrenamiento y tu cuenta en cualquier momento, escribiendo a **masuarez85@gmail.com**.

## Contacto

Para preguntas sobre esta política, escribí a **masuarez85@gmail.com**.
