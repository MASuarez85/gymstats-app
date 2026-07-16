// Cliente HTTP contra el backend de la Fase 1/2 (server/). Sin dependencias externas,
// solo fetch + expo-secure-store para el JWT.
import * as SecureStore from 'expo-secure-store';

// En un dispositivo físico "localhost" apunta al propio teléfono, no a tu compu.
// Para desarrollo local usá la IP de tu red (ej: http://192.168.1.5:3001).
// En producción, la URL del deploy en Railway/Render.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const TOKEN_KEY = 'gymstats_token';

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function setToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Intercambia el identityToken que da Sign in with Apple por el JWT propio del backend.
export async function loginWithApple(identityToken) {
  const res = await fetch(`${API_URL}/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identityToken }),
  });
  if (!res.ok) throw new Error('No se pudo iniciar sesión');
  const data = await res.json();
  await setToken(data.token);
  return data;
}

// Login de prueba, sin pasar por Apple — pega contra /auth/dev, que solo existe
// en el backend si tenés ALLOW_DEV_AUTH=true en su .env. Sirve para probar el
// resto de la app en Expo Go, donde Sign in with Apple no puede funcionar de
// verdad (necesita un build nativo propio). No usar esto en producción.
export async function loginDev() {
  const res = await fetch(`${API_URL}/auth/dev`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dev@localhost' }),
  });
  if (!res.ok) throw new Error('No se pudo iniciar sesión de prueba (¿está ALLOW_DEV_AUTH=true en el server?)');
  const data = await res.json();
  await setToken(data.token);
  return data;
}

async function request(path, { method = 'GET', body } = {}) {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || `Error ${res.status}`);
  return data;
}

// --- Entries ---
export const getEntries = () => request('/entries');
export const createEntry = (entry) => request('/entries', { method: 'POST', body: entry });
export const deleteEntry = (id) => request(`/entries/${id}`, { method: 'DELETE' });

// --- Day plans ---
export const getDayPlans = () => request('/day-plans');
export const setDayPlan = (date, muscleGroup) =>
  request(`/day-plans/${date}`, { method: 'PUT', body: { muscleGroup } });

// --- Rutinas ---
export const getRoutines = () => request('/routines');
export const createRoutine = (routine) => request('/routines', { method: 'POST', body: routine });
export const updateRoutine = (id, routine) => request(`/routines/${id}`, { method: 'PUT', body: routine });
export const deleteRoutine = (id) => request(`/routines/${id}`, { method: 'DELETE' });

// --- Asignaciones y progreso de rutinas ---
export const getRoutineAssignments = () => request('/routine-assignments');
export const setRoutineAssignment = (date, routineId) =>
  request(`/routine-assignments/${date}`, { method: 'PUT', body: { routineId } });
export const getRoutineProgress = () => request('/routine-progress');
export const toggleRoutineProgress = (date, exerciseId) =>
  request(`/routine-progress/${date}/${exerciseId}`, { method: 'PUT', body: {} });

// --- IA (foto → ejercicio, pregunta → respuesta, foto de rutina → lista de ejercicios) ---
export const analyzeVisionPhoto = (base64Image) => request('/ai/vision', { method: 'POST', body: { image: base64Image } });
export const analyzeRoutinePhoto = (base64Image) => request('/ai/routine', { method: 'POST', body: { image: base64Image } });
export const consultAI = (question) => request('/ai/consult', { method: 'POST', body: { question } });
