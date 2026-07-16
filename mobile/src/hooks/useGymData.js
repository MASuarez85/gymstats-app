// Reemplaza el localStorage de la app web: los datos ahora viven en el backend
// (Postgres), pero se guarda un espejo en AsyncStorage para que la pantalla
// cargue instantáneo con el último dato conocido mientras se refresca en
// segundo plano — importante en el gimnasio, donde la señal suele ser mala.
//
// Limitación conocida: si escribís (crear entry, guardar rutina, etc.) sin
// señal, la escritura falla y hay que reintentar a mano cuando vuelva la
// conexión (todavía no hay una cola de reintento). Lo que sí es resiliente es
// la LECTURA: si falla el fetch, se muestra el último snapshot cacheado en vez
// de una pantalla vacía.
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../api/client';

const CACHE_KEYS = {
  entries: 'gymstats:cache:entries',
  dayPlans: 'gymstats:cache:dayPlans',
  routines: 'gymstats:cache:routines',
  routineAssignments: 'gymstats:cache:routineAssignments',
  routineProgress: 'gymstats:cache:routineProgress',
};

async function readCache(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

async function writeCache(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // si falla el cache local no es grave, seguimos con lo que haya en memoria
  }
}

export function useGymData() {
  const [entries, setEntries] = useState([]);
  const [dayPlans, setDayPlans] = useState({});
  const [routines, setRoutines] = useState([]);
  const [routineAssignments, setRoutineAssignments] = useState({});
  const [routineProgress, setRoutineProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);

  // Carga inicial: primero lo cacheado (instantáneo), después refresca contra el backend.
  useEffect(() => {
    (async () => {
      const [cachedEntries, cachedPlans, cachedRoutines, cachedAssignments, cachedProgress] = await Promise.all([
        readCache(CACHE_KEYS.entries, []),
        readCache(CACHE_KEYS.dayPlans, {}),
        readCache(CACHE_KEYS.routines, []),
        readCache(CACHE_KEYS.routineAssignments, {}),
        readCache(CACHE_KEYS.routineProgress, {}),
      ]);
      setEntries(cachedEntries);
      setDayPlans(cachedPlans);
      setRoutines(cachedRoutines);
      setRoutineAssignments(cachedAssignments);
      setRoutineProgress(cachedProgress);
      setLoading(false);
      await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [freshEntries, freshPlans, freshRoutines, freshAssignments, freshProgress] = await Promise.all([
        api.getEntries(),
        api.getDayPlans(),
        api.getRoutines(),
        api.getRoutineAssignments(),
        api.getRoutineProgress(),
      ]);
      setEntries(freshEntries);
      setDayPlans(freshPlans);
      setRoutines(freshRoutines);
      setRoutineAssignments(freshAssignments);
      setRoutineProgress(freshProgress);
      setSyncError(null);
      await Promise.all([
        writeCache(CACHE_KEYS.entries, freshEntries),
        writeCache(CACHE_KEYS.dayPlans, freshPlans),
        writeCache(CACHE_KEYS.routines, freshRoutines),
        writeCache(CACHE_KEYS.routineAssignments, freshAssignments),
        writeCache(CACHE_KEYS.routineProgress, freshProgress),
      ]);
    } catch (err) {
      // Sin conexión (o el backend caído): seguimos mostrando lo cacheado.
      setSyncError(err.message);
    }
  }, []);

  // --- Entries ---
  const addEntry = useCallback(async (entry) => {
    const created = await api.createEntry(entry);
    setEntries((prev) => {
      const next = [created, ...prev];
      writeCache(CACHE_KEYS.entries, next);
      return next;
    });
    return created;
  }, []);

  const removeEntry = useCallback(async (id) => {
    await api.deleteEntry(id);
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      writeCache(CACHE_KEYS.entries, next);
      return next;
    });
  }, []);

  // --- Day plans ---
  const setPlanForDate = useCallback(async (date, muscleGroup) => {
    await api.setDayPlan(date, muscleGroup);
    setDayPlans((prev) => {
      const next = { ...prev, [date]: muscleGroup };
      writeCache(CACHE_KEYS.dayPlans, next);
      return next;
    });
  }, []);

  // --- Rutinas ---
  const addRoutine = useCallback(async (routine) => {
    const created = await api.createRoutine(routine);
    setRoutines((prev) => {
      const next = [...prev, created];
      writeCache(CACHE_KEYS.routines, next);
      return next;
    });
    return created;
  }, []);

  const editRoutine = useCallback(async (id, routine) => {
    const updated = await api.updateRoutine(id, routine);
    setRoutines((prev) => {
      const next = prev.map((r) => (r.id === id ? updated : r));
      writeCache(CACHE_KEYS.routines, next);
      return next;
    });
    return updated;
  }, []);

  const removeRoutine = useCallback(async (id) => {
    await api.deleteRoutine(id);
    setRoutines((prev) => {
      const next = prev.filter((r) => r.id !== id);
      writeCache(CACHE_KEYS.routines, next);
      return next;
    });
    // Igual que en la web: si esa rutina estaba asignada a algún día, se desasigna.
    setRoutineAssignments((prev) => {
      const next = {};
      Object.entries(prev).forEach(([date, routineId]) => {
        if (routineId !== id) next[date] = routineId;
      });
      writeCache(CACHE_KEYS.routineAssignments, next);
      return next;
    });
  }, []);

  // --- Asignación y progreso de rutinas por día ---
  const assignRoutineToDate = useCallback(async (date, routineId) => {
    await api.setRoutineAssignment(date, routineId);
    setRoutineAssignments((prev) => {
      const next = { ...prev };
      if (routineId) next[date] = routineId;
      else delete next[date];
      writeCache(CACHE_KEYS.routineAssignments, next);
      return next;
    });
  }, []);

  const toggleRoutineExerciseDone = useCallback(async (date, exerciseId) => {
    const result = await api.toggleRoutineProgress(date, exerciseId);
    setRoutineProgress((prev) => {
      const dayProgress = { ...(prev[date] || {}) };
      if (result.done) dayProgress[exerciseId] = true;
      else delete dayProgress[exerciseId];
      const next = { ...prev, [date]: dayProgress };
      writeCache(CACHE_KEYS.routineProgress, next);
      return next;
    });
  }, []);

  return {
    entries,
    dayPlans,
    routines,
    routineAssignments,
    routineProgress,
    loading,
    syncError,
    refresh,
    addEntry,
    removeEntry,
    setPlanForDate,
    addRoutine,
    editRoutine,
    removeRoutine,
    assignRoutineToDate,
    toggleRoutineExerciseDone,
  };
}
