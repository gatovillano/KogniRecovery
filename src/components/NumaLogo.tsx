import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

type NumaMarkProps = { size?: number; light?: boolean };

const RIBBON_PATH =
  'M332,253c-31.39-43.84-64.12-98.61-117.8-117.15c-26.75-9.23-56.69-7.18-83.35,1.43C38.08,167.26,18.21,255.73,16.99,341.96c-.26,17.95-3.47,56.91,4.17,71.45c10.47,19.97,33.54,14.22,50.55,6.92c44.82-19.24,65.34-60.7,84.66-102.47c6.97-15.08,13.3-38.45,28.37-47.14c3.84-2.21,8.91-4.1,13.26-1.72c8.37,4.58,35.82,55.85,43.19,67.21c20.33,31.3,45.39,63.28,79.62,80.02c28.69,14.02,58.28,14.09,87.59,1.83c100.13-41.85,86.6-139.1,86.74-228.29c.03-20.89,4.98-76.39-6.06-95.14c-23.58-40.02-86.51,4.19-108.43,25.5c-10.29,10-19.07,21.57-26.11,34.06C337.15,185.05,333.51,218.26,332,253Z';

export const NumaMark: React.FC<NumaMarkProps> = ({ size = 64, light = false }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512">
    <Defs>
      <LinearGradient id="numaRibbon" x1="0%" y1="100%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor={light ? '#D9F8D9' : '#A9F6AD'} />
        <Stop offset="22%" stopColor={light ? '#9EEDC4' : '#42D9AA'} />
        <Stop offset="42%" stopColor={light ? '#5FC9BC' : '#09A49A'} />
        <Stop offset="55%" stopColor={light ? '#3E8F92' : '#025F6A'} />
        <Stop offset="72%" stopColor={light ? '#4FA6A0' : '#047A87'} />
        <Stop offset="88%" stopColor={light ? '#9EEDC4' : '#42D9AA'} />
        <Stop offset="100%" stopColor={light ? '#D9F8D9' : '#A9F6AD'} />
      </LinearGradient>
    </Defs>
    <Path d={RIBBON_PATH} fill="url(#numaRibbon)" />
  </Svg>
);
