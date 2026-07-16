import { useEffect, useRef } from 'react';
import { Animated, View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

// Insignia "Registrado" que aparece al guardar un set. La versión web usaba una
// animación CSS con @keyframes; acá se hace lo mismo con Animated (scale + fade).
export default function StampBadge({ show }) {
  const scale = useRef(new Animated.Value(1.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (show) {
      scale.setValue(1.8);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [show]);

  if (!show) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -90,
        marginTop: -22,
        zIndex: 20,
      }}
    >
      <Animated.View
        style={{
          transform: [{ rotate: '-9deg' }, { scale }],
          opacity,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 18,
          borderRadius: 999,
          backgroundColor: COLORS.brass,
          shadowColor: '#000',
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <Check size={18} strokeWidth={3} color="#000" />
        <Text style={{ color: '#000', fontWeight: '700', fontSize: 16 }}>Registrado</Text>
      </Animated.View>
    </View>
  );
}
