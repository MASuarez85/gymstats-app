import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { loginWithApple } from '../api/client';
import { COLORS } from '../theme/colors';

// Única pantalla antes de loguearse. La app es de uso personal, así que el único
// método de login es Sign in with Apple (requisito de Apple, y evita manejar
// passwords propios para un solo usuario).
export default function LoginScreen({ onLoggedIn }) {
  const [error, setError] = useState(null);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Gym<Text style={{ color: COLORS.hazard }}>Stats</Text>
      </Text>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
        cornerRadius={8}
        style={styles.button}
        onPress={handlePress}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 },
  title: { fontSize: 34, fontWeight: '700', color: COLORS.chalk, letterSpacing: -0.5 },
  button: { width: 240, height: 48 },
  error: { color: COLORS.hazard, fontSize: 13 },
});
