import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

// Placeholder — se completa portando el calendario mensual, el plan por día y
// el checklist de rutina asignada (pestaña "calendario" de App.jsx).
export default function CalendarioScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Calendario — próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  text: { color: COLORS.chalkDim, fontSize: 14 },
});
