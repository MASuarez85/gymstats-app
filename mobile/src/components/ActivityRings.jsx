import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../theme/colors';

// Portado de la versión web (que usaba <svg> de DOM directo) a react-native-svg.
// Misma matemática: 3 anillos estilo Apple Fitness, cada uno recibe un valor 0-1.
export default function ActivityRings({ move, exercise, stand, size = 116 }) {
  const rings = [
    { r: 42, pct: move, color: COLORS.hazard },
    { r: 32, pct: exercise, color: COLORS.brass },
    { r: 22, pct: stand, color: COLORS.stand },
  ];

  return (
    <Svg viewBox="0 0 100 100" width={size} height={size}>
      {rings.map((ring, i) => (
        <Circle key={`bg-${i}`} cx="50" cy="50" r={ring.r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="8" />
      ))}
      {rings.map((ring, i) => {
        const circumference = 2 * Math.PI * ring.r;
        const clamped = Math.min(1, Math.max(0, ring.pct));
        return (
          <Circle
            key={`fg-${i}`}
            cx="50"
            cy="50"
            r={ring.r}
            fill="none"
            stroke={ring.color}
            strokeWidth="8"
            strokeDasharray={`${clamped * circumference} ${circumference}`}
            strokeLinecap="round"
            rotation="-90"
            origin="50, 50"
          />
        );
      })}
    </Svg>
  );
}
