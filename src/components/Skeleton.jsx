import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

const Skeleton = ({ width, height, style, borderRadius = 8, className }) => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  return (
    <Animated.View
      className={className}
      style={[
        {
          width,
          height,
          backgroundColor: '#e5e7eb', // Tailwind gray-200
          borderRadius,
          opacity: animatedValue,
        },
        style,
      ]}
    />
  );
};

export default Skeleton;
