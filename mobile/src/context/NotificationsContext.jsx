import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useGymDataContext } from './GymDataContext';

const STORAGE_KEY = 'gymstats:notifications_enabled';
const SCHEDULED_FIRST_KEY = 'gymstats:notif:first_workout_scheduled';
const SCHEDULED_ROUTINE_KEY = 'gymstats:notif:save_routine_scheduled';
const FIRST_WORKOUT_ID = 'first-workout-reminder';
const SAVE_ROUTINE_ID = 'save-routine-reminder';
const REMINDER_DELAY_SECONDS = 24 * 60 * 60; // 24hs, ver README para el detalle

// SDK 51+ de expo-notifications pide un "type" explícito en el trigger; en
// versiones más viejas alcanza con { seconds }. Se arma así para no atarse a
// una versión exacta (la del proyecto se resuelve con `npx expo install`).
const timeIntervalTrigger = (seconds) =>
  Notifications.SchedulableTriggerInputTypes
    ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false }
    : { seconds, repeats: false };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Recordatorios 100% locales (no hace falta servidor de push): "registrá tu
// primer entrenamiento" mientras entries esté vacío, y una vez que hay al
// menos uno, "guardá tu rutina" mientras routines esté vacío. Cada aviso se
// programa una sola vez (se guarda la marca en AsyncStorage) y se cancela
// apenas deja de tener sentido.
const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { entries, routines, loading } = useGymDataContext();
  const [enabled, setEnabledState] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => setEnabledState(v === 'true'));
  }, []);

  const setEnabled = useCallback(async (value) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        return false;
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.multiRemove([SCHEDULED_FIRST_KEY, SCHEDULED_ROUTINE_KEY]);
    }
    setPermissionDenied(false);
    setEnabledState(value);
    await AsyncStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    return true;
  }, []);

  useEffect(() => {
    if (!enabled || loading) return;
    (async () => {
      if (entries.length === 0) {
        const already = await AsyncStorage.getItem(SCHEDULED_FIRST_KEY);
        if (!already) {
          await Notifications.scheduleNotificationAsync({
            identifier: FIRST_WORKOUT_ID,
            content: {
              title: 'GymStats',
              body: 'Todavía no registraste tu primer entrenamiento. ¡Sacale una foto a la máquina y arrancá!',
            },
            trigger: timeIntervalTrigger(REMINDER_DELAY_SECONDS),
          });
          await AsyncStorage.setItem(SCHEDULED_FIRST_KEY, 'true');
        }
        return;
      }

      await Notifications.cancelScheduledNotificationAsync(FIRST_WORKOUT_ID).catch(() => {});

      if (routines.length === 0) {
        const already = await AsyncStorage.getItem(SCHEDULED_ROUTINE_KEY);
        if (!already) {
          await Notifications.scheduleNotificationAsync({
            identifier: SAVE_ROUTINE_ID,
            content: {
              title: 'GymStats',
              body: 'Guardá tu rutina para armar el checklist de tus próximos entrenamientos.',
            },
            trigger: timeIntervalTrigger(REMINDER_DELAY_SECONDS),
          });
          await AsyncStorage.setItem(SCHEDULED_ROUTINE_KEY, 'true');
        }
      } else {
        await Notifications.cancelScheduledNotificationAsync(SAVE_ROUTINE_ID).catch(() => {});
      }
    })();
  }, [enabled, loading, entries.length, routines.length]);

  return (
    <NotificationsContext.Provider value={{ enabled, setEnabled, permissionDenied }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext debe usarse dentro de <NotificationsProvider>');
  return ctx;
}
