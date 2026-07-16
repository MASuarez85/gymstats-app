import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';

// Selector tipo "chips" reusado donde la web usaba <select>: grupo muscular,
// reps por serie, etc. Más cómodo para tocar con el dedo que un dropdown nativo.
export default function ChipRow({ options, value, onChange, small }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
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
