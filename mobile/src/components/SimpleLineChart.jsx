import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const VIEW_WIDTH = 320; // viewBox fijo; el SVG con width="100%" escala solo al ancho real

// Chart de línea hecho a mano con react-native-svg. Reemplaza el <LineChart> de
// recharts que usaba la web para "evolución de peso". Simplificado: solo
// muestra la etiqueta del primer y último punto en el eje X (no todas, como
// hacía recharts) para no saturar de texto en una pantalla chica.
export default function SimpleLineChart({ data, color, height = 160, valueKey = 'value', labelKey = 'label' }) {
  const { COLORS } = useTheme();
  const lineColor = color || COLORS.hazard;
  const styles = getStyles(COLORS);

  if (!data || data.length === 0) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.chalkDim, fontSize: 12 }}>Sin datos todavía</Text>
      </View>
    );
  }

  const padding = 20;
  const values = data.map((d) => d[valueKey]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? VIEW_WIDTH / 2 : padding + (i / (data.length - 1)) * (VIEW_WIDTH - padding * 2);
    const y = height - padding - ((d[valueKey] - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View>
      <Svg viewBox={`0 0 ${VIEW_WIDTH} ${height}`} width="100%" height={height}>
        <Line x1={padding} y1={height - padding} x2={VIEW_WIDTH - padding} y2={height - padding} stroke={COLORS.line} strokeWidth={1} />
        {points.length > 1 && <Polyline points={polylinePoints} fill="none" stroke={lineColor} strokeWidth={2.5} />}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={lineColor} />
        ))}
      </Svg>
      <View style={styles.labelsRow}>
        <Text style={styles.axisLabel}>{data[0][labelKey]}</Text>
        {data.length > 1 && <Text style={styles.axisLabel}>{data[data.length - 1][labelKey]}</Text>}
      </View>
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 4 },
    axisLabel: { fontSize: 10, color: COLORS.chalkDim },
  });
