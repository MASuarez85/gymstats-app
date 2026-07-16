import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

// Chart de barras hecho a mano con Views (sin librería externa, para no repetir
// los líos de versiones que tuvimos con otras dependencias). Reemplaza el
// <BarChart> de recharts que usaba la versión web para "frecuencia por grupo muscular".
export default function SimpleBarChart({ data, color = COLORS.brass, height = 160, valueKey = 'value', labelKey = 'label' }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  return (
    <View style={[styles.container, { height }]}>
      {data.map((d, i) => {
        const barHeight = Math.max(4, (d[valueKey] / max) * (height - 34));
        return (
          <View key={i} style={styles.column}>
            <Text style={styles.value}>{d[valueKey]}</Text>
            <View style={{ width: '55%', height: barHeight, backgroundColor: color, borderRadius: 4 }} />
            <Text style={styles.label} numberOfLines={1}>
              {d[labelKey]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  value: { fontSize: 10, color: COLORS.chalkDim, marginBottom: 4 },
  label: { fontSize: 9, color: COLORS.chalkDim, marginTop: 6 },
});
