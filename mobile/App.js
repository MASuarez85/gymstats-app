import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, AppState, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanFace } from 'lucide-react-native';
import RootNavigator from './src/navigation/RootNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { getToken, clearToken } from './src/api/client';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { GymDataProvider } from './src/context/GymDataContext';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationsProvider } from './src/context/NotificationsContext';

const FACE_ID_KEY = 'gymstats:faceid_enabled';

function AppInner() {
  const { COLORS, resolvedScheme } = useTheme();
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [faceIdEnabled, setFaceIdEnabledState] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      setLoggedIn(!!token);
      const savedFaceId = await AsyncStorage.getItem(FACE_ID_KEY);
      setFaceIdEnabledState(savedFaceId === 'true');
      setChecking(false);
    })();
  }, []);

  const runAuth = useCallback(async () => {
    setAuthenticating(true);
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Desbloqueá GymStats' });
    setAuthenticating(false);
    if (result.success) setUnlocked(true);
  }, []);

  // Pide Face ID apenas hay sesión y está activado (al abrir la app).
  useEffect(() => {
    if (loggedIn && faceIdEnabled && !unlocked) runAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, faceIdEnabled]);

  // Re-bloquea al volver del background, no solo al abrir la app por primera vez.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/active/) && next !== 'active' && faceIdEnabled) {
        setUnlocked(false);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [faceIdEnabled]);

  const handleLoggedIn = useCallback(() => setLoggedIn(true), []);
  const handleLogout = useCallback(async () => {
    await clearToken();
    setLoggedIn(false);
    setUnlocked(false);
  }, []);

  const setFaceIdEnabled = useCallback(async (value) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) return false;
    }
    setFaceIdEnabledState(value);
    setUnlocked(!value);
    await AsyncStorage.setItem(FACE_ID_KEY, value ? 'true' : 'false');
    return true;
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.brass} />
      </View>
    );
  }

  if (loggedIn && faceIdEnabled && !unlocked) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg, gap: 16, padding: 24 }}>
        <ScanFace size={48} color={COLORS.brass} />
        <Text style={{ color: COLORS.chalk, fontSize: 15 }}>GymStats está bloqueado</Text>
        <TouchableOpacity
          onPress={runAuth}
          disabled={authenticating}
          style={{ backgroundColor: COLORS.hazard, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>{authenticating ? 'Verificando…' : 'Desbloquear con Face ID'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={resolvedScheme === 'light' ? 'dark' : 'light'} />
      {loggedIn ? (
        <AuthProvider logout={handleLogout} faceIdEnabled={faceIdEnabled} setFaceIdEnabled={setFaceIdEnabled}>
          <GymDataProvider>
            <NotificationsProvider>
              <RootNavigator />
            </NotificationsProvider>
          </GymDataProvider>
        </AuthProvider>
      ) : (
        <LoginScreen onLoggedIn={handleLoggedIn} />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
