import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Visual de discos apilados representando el set más pesado. Portado 1:1 de la
// versión web (mismo cálculo de cantidad de discos y anchos).
export default function PlateStack({ kg }) {
  const { COLORS } = useTheme();
  const plates = Math.max(1, Math.min(8, Math.round(kg / 15) || 1));
  const widths = [34, 30, 26, 22, 18, 15, 12, 10];

  return (
    <View style={{ flexDirection: 'column-reverse', alignItems: 'center', gap: 2, height: 46, justifyContent: 'flex-end' }}>
      {Array.from({ length: plates }).map((_, i) => (
        <View
          key={i}
          style={{
            width: widths[i] || 10,
            height: 5,
            borderRadius: 2,
            backgroundColor: i === plates - 1 ? COLORS.hazard : COLORS.brass,
            opacity: 0.55 + (i / plates) * 0.45,
          }}
        />
      ))}
    </View>
  );
}
