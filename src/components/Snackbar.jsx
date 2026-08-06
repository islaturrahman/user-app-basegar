import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

export default function Snackbar({ type = "alert", message, duration = 3000 }) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setVisible(true);
    setProgress(100);
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration, message]);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, ((duration - elapsed) / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) clearInterval(timer);
    }, 10);
    return () => clearInterval(timer);
  }, [duration, message]);

  if (!visible) return null;

  return (
    <View
      className={`absolute bottom-4 self-center w-[90%] max-w-sm ${
        type === "alert" ? "bg-red-50" : "bg-green-50"
      } shadow-lg rounded-lg overflow-hidden`}
    >
      <View className="p-4">
        <Text className="text-gray-900">{message}</Text>
      </View>
      <View
        className={`h-1 absolute bottom-0 left-0 ${
          type === "alert" ? "bg-red-500" : "bg-green-500"
        }`}
        style={{ width: `${progress}%` }}
      />
    </View>
  );
}
