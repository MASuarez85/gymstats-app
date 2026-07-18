import { View, Text } from 'react-native';
import { MUSCLE_COLORS } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';

// Avatar generado 100% en el dispositivo (iniciales + color determinístico a
// partir del email/nombre) — no se manda el email a ningún servicio externo
// (a diferencia de Gravatar), consistente con PRIVACY.md.
const PALETTE = Object.values(MUSCLE_COLORS);

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initialsFor(displayName, email) {
  const source = (displayName || '').trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return source.slice(0, 2).toUpperCase();
  }
  return (email || '?').slice(0, 2).toUpperCase();
}

export default function Avatar({ displayName, email, size = 34 }) {
  const { COLORS } = useTheme();
  const seed = displayName || email || '?';
  const color = PALETTE[hashString(seed) % PALETTE.length];
  const initials = initialsFor(displayName, email);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.line,
      }}
    >
      <Text style={{ color: '#000', fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}
