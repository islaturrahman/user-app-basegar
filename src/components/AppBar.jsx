import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';

const AppBar = ({ title, route }) => {
  const navigation = useNavigation();
  return (
    <View className={`flex-row items-center px-4 pb-4 ${Platform.OS === 'web' ? 'pt-4' : 'pt-12'} bg-white z-50 shadow-sm border-b border-gray-100`}>
      <TouchableOpacity
        className="mr-3 p-1"
        onPress={() => (route ? navigation.navigate(route) : navigation.goBack())}
      >
        <FontAwesome5 name="arrow-left" size={20} color="#365314" />
      </TouchableOpacity>
      <Text className="text-2xl text-lime-900 font-light">{title}</Text>
    </View>
  );
};

export default AppBar;
