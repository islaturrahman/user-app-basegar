import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export function Loader({ type = "full", isLoading = true }) {
  if (!isLoading) return null;

  return (
    <View
      className={`absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 ${
        type === "transparent" ? "bg-black/10" : "bg-white"
      }`}
    >
      <View className={`${type === "transparent" ? "p-2 bg-white rounded-full" : ""}`}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    </View>
  );
}

export function Shimmer({ type = "card", isLoading = true, count = 1 }) {
  if (!isLoading) return null;

  return Array(count)
    .fill(0)
    .map((_, index) => {
      switch (type) {
        case "card":
          return (
            <View key={index} className="border border-gray-200 rounded-md p-4 mb-4">
              <View className="h-32 bg-gray-200 rounded-md mb-4" />
              <View className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <View className="h-4 bg-gray-200 rounded w-1/2" />
            </View>
          );
        case "card-title":
          return (
            <View key={index} className="border border-gray-200 rounded-md p-4 mb-4">
              <View className="h-10 bg-gray-200 rounded-md mb-4" />
              <View className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <View className="h-4 bg-gray-200 rounded w-1/2" />
            </View>
          );
        case "cardHorizontal":
          return (
            <View key={index} className="flex-row space-x-4 mb-4">
              <View className="h-24 w-24 bg-gray-200 rounded-md" />
              <View className="flex-1 justify-center">
                <View className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <View className="h-4 bg-gray-200 rounded w-1/2" />
              </View>
            </View>
          );
        case "textarea":
          return (
            <View key={index} className="mb-4">
              <View className="h-32 bg-gray-200 rounded-md" />
            </View>
          );
        case "order-details":
          return (
            <View key={index} className="border border-gray-200 rounded-md p-4 mb-4">
              <View className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
              <View className="h-4 bg-gray-200 rounded w-full mb-2" />
              <View className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <View className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <View className="h-6 bg-gray-200 rounded w-1/3" />
            </View>
          );
        case "category-grid":
          return (
            <View key={index} className="mb-2">
              <View className="border border-gray-200 rounded p-2">
                <View className="h-3 bg-gray-200 rounded w-full mb-2" />
                <View className="h-20 w-20 bg-gray-200 self-center" />
              </View>
            </View>
          );
        default:
          return null;
      }
    });
}

export function LoaderMoreProducts() {
  return (
    <View className="items-center justify-center p-4">
      <ActivityIndicator size="small" color="#22c55e" />
    </View>
  );
}
