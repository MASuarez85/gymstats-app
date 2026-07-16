import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

// Placeholder — se completa portando la lista de entrenamientos agrupados por
// fecha y los gráficos por ejercicio/grupo muscular (pestaña "historial" de App.jsx).
export default function HistorialScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Historial — próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  text: { color: COLORS.chalkDim, fontSize: 14 },
});
