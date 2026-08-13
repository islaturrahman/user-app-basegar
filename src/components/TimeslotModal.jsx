import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

const TimeslotModal = ({ isOpen, onClose, onConfirm, product }) => {
  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center p-4 bg-black/50">
        <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
          <View className="p-5 items-center text-center">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
              <Text className="text-2xl">⏰</Text>
            </View>
            <Text className="text-lg font-bold text-gray-800 mb-2 text-center">
              Melewati Batas Waktu
            </Text>
            <Text className="text-sm text-gray-600 mb-1 text-center">
              Waktu pengiriman &quot;Hari Ini&quot; untuk produk{' '}
              <Text className="font-bold">{product?.name}</Text> telah habis (Batas: {product?.time_slot?.end_time}).
            </Text>
            <Text className="text-sm font-semibold text-red-600 text-center">
              Jika kamu menambahkan produk ini, pengiriman otomatis dipindahkan ke esok hari.
            </Text>
          </View>
          
          <View className="flex-row border-t border-gray-100">
            <TouchableOpacity 
              onPress={onClose}
              className="flex-1 py-4 items-center justify-center"
            >
              <Text className="text-sm font-semibold text-gray-500">Batal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onConfirm}
              className="flex-1 py-4 items-center justify-center bg-green-600 border-l border-gray-100"
            >
              <Text className="text-sm font-bold text-white">Ya, Pindahkan ke Besok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TimeslotModal;
