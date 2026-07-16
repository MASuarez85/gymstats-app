import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

// Placeholder — se completa portando el constructor de rutinas (creación manual
// o por foto) y la lista de rutinas guardadas.
export default function RutinasScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Rutinas — próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  text: { color: COLORS.chalkDim, fontSize: 14 },
});
