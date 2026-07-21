import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Selector tipo "chips" reusado donde la web usaba <select>: grupo muscular,
// reps por serie, etc. Más cómodo para tocar con el dedo que un dropdown nativo.
// Con multi=true, value es un array y cada toque suma/saca esa opción (usado
// para planificar más de un grupo muscular el mismo día).
export default function ChipRow({ options, value, onChange, small, multi }) {
  const { COLORS } = useTheme();
  const isActive = (opt) => (multi ? Array.isArray(value) && value.includes(opt) : opt === value);
  const handlePress = (opt) => {
    if (!multi) return onChange(opt);
    const current = Array.isArray(value) ? value : [];
    onChange(current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt]);
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const active = isActive(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => handlePress(opt)}
            style={{
              paddingVertical: small ? 6 : 8,
              paddingHorizontal: small ? 10 : 12,
              borderRadius: 8,
              backgroundColor: active ? COLORS.hazard : COLORS.surfaceRaised,
              borderWidth: 1,
              borderColor: active ? COLORS.hazard : COLORS.line,
            }}
          >
            <Text style={{ color: active ? '#fff' : COLORS.chalk, fontSize: small ? 12 : 13 }}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
