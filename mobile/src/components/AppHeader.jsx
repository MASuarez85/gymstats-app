import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import Avatar from './Avatar';

// Barra persistente arriba de los 6 tabs (no vive dentro de cada pantalla, para
// que el botón de usuario esté siempre en el mismo lugar sin repetir código).
export default function AppHeader({ onAvatarPress }) {
  const { user } = useAuthContext();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.row}>
        <Text style={styles.title}>GYMSTATS</Text>
        <TouchableOpacity onPress={onAvatarPress} hitSlop={8}>
          <Avatar displayName={user?.displayName} email={user?.email} size={32} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    safe: { backgroundColor: COLORS.bg, borderBottomWidth: 1, borderBottomColor: COLORS.line },
    row: {
      height: 46,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { color: COLORS.chalk, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  });
