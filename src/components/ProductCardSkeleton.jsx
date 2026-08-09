import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const ProductCardSkeleton = ({ layoutType = 'horizontal' }) => {
  const fadeAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  if (layoutType === 'horizontal') {
    return (
      <View className="w-[140px] rounded-xl bg-white shadow-sm border border-gray-100 mr-3 overflow-hidden pb-3">
        {/* Image Placeholder */}
        <Animated.View style={{ opacity: fadeAnim }} className="w-full h-32 bg-gray-200" />
        
        {/* Content */}
        <View className="px-2 mt-2 space-y-2">
          {/* Title Placeholder */}
          <Animated.View style={{ opacity: fadeAnim }} className="w-full h-4 bg-gray-200 rounded" />
          <Animated.View style={{ opacity: fadeAnim }} className="w-2/3 h-4 bg-gray-200 rounded" />
          
          {/* Price Placeholder */}
          <Animated.View style={{ opacity: fadeAnim }} className="w-1/2 h-5 bg-gray-200 rounded mt-2" />
          
          {/* Button Placeholder */}
          <Animated.View style={{ opacity: fadeAnim }} className="w-full h-8 bg-blue-100 rounded-lg mt-3" />
        </View>
      </View>
    );
  }

  // Vertical (Grid) Layout
  return (
    <View className="flex-1 m-1 rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden pb-3">
      <Animated.View style={{ opacity: fadeAnim }} className="w-full aspect-square bg-gray-200" />
      <View className="p-2 space-y-2">
        <Animated.View style={{ opacity: fadeAnim }} className="w-full h-4 bg-gray-200 rounded" />
        <Animated.View style={{ opacity: fadeAnim }} className="w-1/2 h-5 bg-gray-200 rounded mt-1" />
        <Animated.View style={{ opacity: fadeAnim }} className="w-full h-8 bg-blue-100 rounded-lg mt-2" />
      </View>
    </View>
  );
};

export default ProductCardSkeleton;
