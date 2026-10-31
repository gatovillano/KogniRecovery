import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

type NumaMarkProps = { size?: number; light?: boolean };

export const NumaMark: React.FC<NumaMarkProps> = ({ size = 64, light = false }) => (
  <Svg width={size} height={size * 0.92} viewBox="0 0 120 110">
    <Defs>
      <LinearGradient id="numaRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={light ? '#D9E9D9' : '#0B5556'} />
        <Stop offset="52%" stopColor={light ? '#A6C7A9' : '#238A7C'} />
        <Stop offset="100%" stopColor={light ? '#E5F0D8' : '#8EAD91'} />
      </LinearGradient>
    </Defs>
    <Path
      d="M18 84 C18 62 18 36 18 25 C18 7 34 8 43 23 C55 43 70 72 82 79 C94 86 102 76 102 59 L102 18"
      fill="none"
      stroke="#082F31"
      strokeWidth="25"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.18}
      transform="translate(1.5 2.5)"
    />
    <Path
      d="M18 82 C18 60 18 34 18 23 C18 5 34 7 43 21 C55 41 70 70 82 77 C94 84 102 74 102 57 L102 16"
      fill="none"
      stroke="url(#numaRibbon)"
      strokeWidth="23"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 28 C22 16 31 15 39 26"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity={0.28}
    />
  </Svg>
);
