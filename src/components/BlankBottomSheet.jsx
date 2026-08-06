import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export const BlankBottomSheet = ({ isOpen, onClose, children, type = "default" }) => {
  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        <View className={`bg-white rounded-t-3xl ${type === "full" ? "h-[90%]" : "max-h-[90%]"}`}>
          {type === "full" ? (
             <View className="flex-1">{children}</View>
          ) : (
             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
               {children}
             </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
