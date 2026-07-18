#!/usr/bin/env bash
# Prueba de punta a punta del CRUD, sin la app nativa: pega contra el server local
# con curl y valida que cada endpoint responda lo esperado.
#
# Requisitos: el server corriendo (npm run dev) con ALLOW_DEV_AUTH=true en el .env.
# El paso "ai cache" hace una llamada real a la API de Anthropic (fracciones de
# centavo) para poder demostrar que la segunda respuesta viene de Redis.
#
# Uso: ./scripts/smoke-test.sh   (o BASE_URL=https://tu-server.up.railway.app ./scripts/smoke-test.sh)

set -uo pipefail
BASE_URL="${BASE_URL:-http://localhost:3001}"
AUTH_HEADER=""
RESULTS_FILE=$(mktemp)
trap 'rm -f "$RESULTS_FILE" /tmp/smoke_body' EXIT

# Hace un request y chequea el status code esperado. Devuelve el body por stdout
# (los mensajes de OK/FAIL van por stderr para no ensuciar el body al capturarlo).
# El resultado se anota en un archivo temporal en vez de una variable, porque
# muchos de estos calls se invocan como resp=$(req ...), que en bash corre en un
# subshell — una variable incrementada ahí adentro se perdería al volver.
req() {
  local method=$1 path=$2 expected=$3 body="${4:-}"
  local args=(-s -o /tmp/smoke_body -w "%{http_code}" -X "$method" "$BASE_URL$path" -H "Content-Type: application/json")
  [ -n "$AUTH_HEADER" ] && args+=(-H "$AUTH_HEADER")
  [ -n "$body" ] && args+=(-d "$body")
  local code
  code=$(curl "${args[@]}")
  local resp
  resp=$(cat /tmp/smoke_body)
  if [ "$code" = "$expected" ]; then
    echo "OK   $method $path -> $code" >&2
    echo OK >> "$RESULTS_FILE"
  else
    echo "FAIL $method $path -> $code (esperaba $expected)" >&2
    echo "     body: $resp" >&2
    echo FAIL >> "$RESULTS_FILE"
  fi
  echo "$resp"
}

jsonval() { node -e "let d=JSON.parse(process.argv[1]); console.log(d[process.argv[2]] ?? '')" "$1" "$2"; }

echo "== health =="
req GET /health 200 > /dev/null

echo "== auth dev =="
resp=$(req POST /auth/dev 200 '{"email":"smoke@test.com"}')
TOKEN=$(jsonval "$resp" token)
AUTH_HEADER="Authorization: Bearer $TOKEN"
if [ -z "$TOKEN" ]; then
  echo "No se obtuvo token, aborto (revisá ALLOW_DEV_AUTH=true en el .env)."
  exit 1
fi

echo "== entries =="
resp=$(req POST /entries 201 '{"exercise":"Press de banca","muscleGroup":"Pecho","date":"2026-07-16","sets":[{"weight":40,"reps":10},{"weight":42,"reps":8}]}')
ENTRY_ID=$(jsonval "$resp" id)
req GET /entries 200 > /dev/null
req DELETE "/entries/$ENTRY_ID" 204 > /dev/null

echo "== day-plans =="
req PUT /day-plans/2026-07-16 200 '{"muscleGroup":"Pecho"}' > /dev/null
req GET /day-plans 200 > /dev/null

echo "== routines =="
resp=$(req POST /routines 201 '{"name":"Rutina Push","exercises":[{"name":"Press militar","muscle_group":"Hombros","targetSets":3,"targetReps":10}]}')
ROUTINE_ID=$(jsonval "$resp" id)
req PUT "/routines/$ROUTINE_ID" 200 "{\"name\":\"Rutina Push v2\",\"exercises\":[{\"name\":\"Press militar\",\"muscle_group\":\"Hombros\",\"targetSets\":4,\"targetReps\":8}]}" > /dev/null
req GET /routines 200 > /dev/null

echo "== routine-assignments =="
req PUT /routine-assignments/2026-07-16 200 "{\"routineId\":\"$ROUTINE_ID\"}" > /dev/null
req GET /routine-assignments 200 > /dev/null

echo "== routine-progress (necesita el id del ejercicio recién creado) =="
resp=$(req GET /routines 200)
EXERCISE_ID=$(node -e "let r=JSON.parse(process.argv[1]); console.log(r[0].exercises[0].id)" "$resp")
req PUT "/routine-progress/2026-07-16/$EXERCISE_ID" 200 '{}' > /dev/null
req GET /routine-progress 200 > /dev/null

echo "== ai cache (llama de verdad a Anthropic la primera vez) =="
# Pregunta con un sufijo random: si repetís el script, la corrida anterior ya
# dejó cacheada "¿Cómo se hace una sentadilla?" por 24hs y la primera llamada
# de esta corrida daría un falso _cached=true. Con un sufijo único, la primera
# llamada de cada corrida siempre es un miss real.
QUESTION="¿Cómo se hace una sentadilla? (test-$RANDOM-$$)"
QUESTION_JSON=$(node -e "console.log(JSON.stringify(process.argv[1]))" "$QUESTION")
resp1=$(req POST /ai/consult 200 "{\"question\":$QUESTION_JSON}")
CACHED1=$(jsonval "$resp1" _cached)
resp2=$(req POST /ai/consult 200 "{\"question\":$QUESTION_JSON}")
CACHED2=$(jsonval "$resp2" _cached)
if [ "$CACHED1" = "false" ] && [ "$CACHED2" = "true" ]; then
  echo "OK   cache Redis: 1ra llamada sin cache, 2da con cache" >&2
  echo OK >> "$RESULTS_FILE"
else
  echo "FAIL cache Redis: _cached primera=$CACHED1 segunda=$CACHED2 (¿está Redis levantado?)" >&2
  echo FAIL >> "$RESULTS_FILE"
fi

echo "== profile =="
req GET /profile 200 > /dev/null
resp=$(req PUT /profile 200 '{"displayName":"Smoke Test","height":178,"weight":80,"goal":"Fuerza","birthdate":"1995-05-20"}')
GOAL=$(jsonval "$resp" goal)
if [ "$GOAL" = "Fuerza" ]; then
  echo "OK   profile: PUT guardó goal=Fuerza" >&2
  echo OK >> "$RESULTS_FILE"
else
  echo "FAIL profile: goal esperado 'Fuerza', vino '$GOAL'" >&2
  echo FAIL >> "$RESULTS_FILE"
fi

echo "== logs (esquema logging) =="
resp=$(req GET "/logs/requests?limit=5" 200)
LOG_COUNT=$(node -e "console.log(JSON.parse(process.argv[1]).length)" "$resp")
if [ "$LOG_COUNT" -gt 0 ]; then
  echo "OK   request_logs tiene entradas ($LOG_COUNT)" >&2
  echo OK >> "$RESULTS_FILE"
else
  echo "FAIL request_logs vino vacío (¿corriste la migración add_logging_schema?)" >&2
  echo FAIL >> "$RESULTS_FILE"
fi
req GET "/logs/errors?limit=5" 200 > /dev/null

echo "== cleanup =="
req DELETE "/routines/$ROUTINE_ID" 204 > /dev/null

PASS=$(grep -c '^OK$' "$RESULTS_FILE" || true)
FAIL=$(grep -c '^FAIL$' "$RESULTS_FILE" || true)
echo ""
echo "Resultado: $PASS OK, $FAIL fallidos"
[ "$FAIL" = "0" ]
