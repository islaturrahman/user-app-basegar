import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions } from 'react-native';

export const BlankBottomSheet = ({ isOpen, onClose, children, type = "default" }) => {
  const [showModal, setShowModal] = useState(isOpen);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
      slideAnim.setValue(Dimensions.get('window').height);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start();
    } else if (showModal) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: Dimensions.get('window').height, duration: 250, useNativeDriver: true })
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [isOpen]);

  if (!showModal && !isOpen) return null;

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end items-center"
        pointerEvents="box-none"
      >
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={onClose} 
          />
        </Animated.View>

        <Animated.View 
          className={`bg-white rounded-t-3xl w-full ${type === "full" ? "h-[90%]" : "max-h-[90%]"}`}
          style={{ maxWidth: Platform.OS === 'web' ? 600 : '100%', transform: [{ translateY: slideAnim }] }}
        >
          {type === "full" ? (
             <View className="flex-1">{children}</View>
          ) : (
             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
               {children}
             </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
