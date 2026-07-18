import { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { loginWithApple, loginDev } from '../api/client';
import { useTheme } from '../context/ThemeContext';

// Única pantalla antes de loguearse. La app es de uso personal, así que el único
// método de login es Sign in with Apple (requisito de Apple, y evita manejar
// passwords propios para un solo usuario).
export default function LoginScreen({ onLoggedIn }) {
  const { COLORS, resolvedScheme } = useTheme();
  const styles = getStyles(COLORS);
  const [error, setError] = useState(null);
  const [devLoading, setDevLoading] = useState(false);

  const handlePress = async () => {
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      await loginWithApple(credential.identityToken);
      onLoggedIn();
    } catch (err) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        setError('No se pudo iniciar sesión. Probá de nuevo.');
      }
    }
  };

  // Solo para desarrollo: Sign in with Apple no puede funcionar dentro de Expo Go
  // (necesita el bundle id y entitlement reales de un build nativo propio). Este
  // botón permite probar el resto de la app mientras tanto.
  const handleDevPress = async () => {
    setError(null);
    setDevLoading(true);
    try {
      await loginDev();
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Gym<Text style={{ color: COLORS.hazard }}>Stats</Text>
      </Text>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={
          resolvedScheme === 'light'
            ? AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            : AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
        }
        cornerRadius={8}
        style={styles.button}
        onPress={handlePress}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity onPress={handleDevPress} disabled={devLoading} style={styles.devButton}>
        {devLoading ? (
          <ActivityIndicator color={COLORS.chalkDim} size="small" />
        ) : (
          <Text style={styles.devButtonText}>Entrar con cuenta de prueba (dev)</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 },
    title: { fontSize: 34, fontWeight: '700', color: COLORS.chalk, letterSpacing: -0.5 },
    button: { width: 240, height: 48 },
    error: { color: COLORS.hazard, fontSize: 13 },
    devButton: { marginTop: 8, padding: 8 },
    devButtonText: { color: COLORS.chalkDim, fontSize: 12, textDecorationLine: 'underline' },
  });
