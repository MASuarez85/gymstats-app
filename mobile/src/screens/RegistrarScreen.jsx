import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

// Placeholder — se completa en la siguiente tarea con la cámara, el análisis
// por IA y la carga de series (portado de la pestaña "registrar" de App.jsx).
export default function RegistrarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Registrar — próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  text: { color: COLORS.chalkDim, fontSize: 14 },
});
