import { createContext, useContext } from 'react';
import { useGymData } from '../hooks/useGymData';

// Un solo lugar de verdad para entries/dayPlans, compartido entre las 4 pantallas
// (Registrar necesita guardar, Historial y Calendario necesitan leer lo mismo).
const GymDataContext = createContext(null);

export function GymDataProvider({ children }) {
  const value = useGymData();
  return <GymDataContext.Provider value={value}>{children}</GymDataContext.Provider>;
}

export function useGymDataContext() {
  const ctx = useContext(GymDataContext);
  if (!ctx) throw new Error('useGymDataContext debe usarse dentro de <GymDataProvider>');
  return ctx;
}
