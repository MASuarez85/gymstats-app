import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getProfile, updateProfile as updateProfileRequest } from '../api/client';

// Carga el perfil (y el estado de la prueba gratuita) apenas hay sesión, y lo
// expone junto con logout() para el menú de usuario y el gate de trial.
const AuthContext = createContext(null);

export function AuthProvider({ logout, faceIdEnabled, setFaceIdEnabled, children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch (err) {
      // Si el token quedó inválido, el próximo request protegido lo va a
      // detectar igual; acá solo evitamos romper el menú de usuario.
      console.warn('No se pudo cargar el perfil:', err.message);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const updateProfile = useCallback(async (fields) => {
    const profile = await updateProfileRequest(fields);
    setUser(profile);
    return profile;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loadingUser, refreshUser, updateProfile, logout, faceIdEnabled, setFaceIdEnabled }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext debe usarse dentro de <AuthProvider>');
  return ctx;
}
