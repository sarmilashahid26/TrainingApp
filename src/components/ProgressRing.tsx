import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '@/constants/theme';

interface ProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
  color: string;
  trackColor?: string;
  /** Background colour of the inner circle — must match the parent card. */
  backgroundColor?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size,
  strokeWidth,
  progress,
  color,
  trackColor = Colors.dark.ringTrack,
  backgroundColor = Colors.dark.surface,
  children,
  style,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, isNaN(progress) ? 0 : progress));

  // SVG geometry
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);

  const innerSize = size - strokeWidth * 2;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {/* SVG arc — identical on web and native, no gaps */}
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Track ring */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc — rotated so it starts at 12 o'clock */}
        <G rotation="-90" origin={`${cx}, ${cy}`}>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      {/* Inner circle (donut hole) with children centered */}
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        {children}
      </View>
    </View>
  );
};
