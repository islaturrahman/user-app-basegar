import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Keyboard, Animated } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { Home, LayoutGrid, Radio, FileText, User } from 'lucide-react-native';
import CartContext from '../context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Animated LIVE pulse dot for the Live tab
function LiveTabDot() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.7, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, right: 0 }}>
      <Animated.View style={{ position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#fca5a5', opacity: 0.5, transform: [{ scale: pulseAnim }] }} />
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#ef4444' }} />
    </View>
  );
}

export function BottomMenu() {
  const { cart } = useContext(CartContext) || { cart: [] };
  
  const navigation = useNavigation();
  const currentRouteName = useNavigationState(state => {
    if (!state || !state.routes) return '';
    return state.routes[state.index]?.name || '';
  });

  const isActive = (pathName) => {
    return currentRouteName === pathName;
  };

  const activeColor = "#15803d";
  const inactiveColor = "#6b7280";

  const handleProtectedNavigation = async (route) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        navigation.navigate(route);
      } else {
        navigation.navigate('/login');
      }
    } catch (error) {
      console.log('Error checking auth in BottomMenu', error);
      navigation.navigate('/login');
    }
  };

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Hide BottomMenu on specific routes (tambah /live/:id)
  const hiddenRoutes = ['/cart', '/checkout', '/o/:id', '/p/:id', '/categories/:category_id', '/edit-profile', '/live/:id'];
  if (
    currentRouteName &&
    (currentRouteName.startsWith('/address') || hiddenRoutes.includes(currentRouteName))
  ) {
    return null;
  }

  if (isKeyboardVisible) return null;

  return (
    <View
      className="absolute bottom-0 w-full bg-white shadow-xl border-t border-gray-100 flex-row justify-around items-center pt-2.5 z-40"
      style={{ paddingBottom: Platform.OS === 'android' ? 40 : 10 }}
    >
      {/* Home */}
      <TouchableOpacity
        onPress={() => navigation.navigate('/')}
        className="flex-1 items-center py-1"
      >
        <Home 
          size={22} 
          color={isActive('/') ? activeColor : inactiveColor}
          strokeWidth={isActive('/') ? 2.5 : 2}
        />
        <Text 
          className={`text-[10px] font-semibold mt-1 tracking-wide ${isActive('/') ? 'text-green-700' : 'text-gray-500'}`}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Kategori */}
      <TouchableOpacity
        onPress={() => navigation.navigate('/categories/:category_id', { category_id: 1 })}
        className="flex-1 items-center py-1"
      >
        <LayoutGrid 
          size={22} 
          color={isActive('/categories/:category_id') ? activeColor : inactiveColor}
          strokeWidth={isActive('/categories/:category_id') ? 2.5 : 2}
        />
        <Text 
          className={`text-[10px] font-semibold mt-1 tracking-wide ${isActive('/categories/:category_id') ? 'text-green-700' : 'text-gray-500'}`}
        >
          Kategori
        </Text>
      </TouchableOpacity>

      {/* LIVE tab (ganti Chat CS) */}
      <TouchableOpacity
        onPress={() => navigation.navigate('/live')}
        className="flex-1 items-center py-1 relative"
        style={{ position: 'relative' }}
      >
        <View style={{ position: 'relative' }}>
          <Radio 
            size={22} 
            color={isActive('/live') ? '#ef4444' : inactiveColor}
            strokeWidth={isActive('/live') ? 2.5 : 2}
          />
          {!isActive('/live') && <LiveTabDot />}
        </View>
        <Text 
          className={`text-[10px] font-semibold mt-1 tracking-wide ${isActive('/live') ? 'text-red-500' : 'text-gray-500'}`}
        >
          Live 🔴
        </Text>
      </TouchableOpacity>

      {/* Pesanan */}
      <TouchableOpacity
        onPress={() => handleProtectedNavigation('/orders')}
        className="flex-1 items-center py-1 relative"
      >
        <FileText 
          size={22} 
          color={isActive('/orders') ? activeColor : inactiveColor}
          strokeWidth={isActive('/orders') ? 2.5 : 2}
        />
        <Text 
          className={`text-[10px] font-semibold mt-1 tracking-wide ${isActive('/orders') ? 'text-green-700' : 'text-gray-500'}`}
        >
          Pesanan
        </Text>
      </TouchableOpacity>

      {/* Akun */}
      <TouchableOpacity
        onPress={() => handleProtectedNavigation('/account')}
        className="flex-1 items-center py-1"
      >
        <User 
          size={22} 
          color={isActive('/account') ? activeColor : inactiveColor}
          strokeWidth={isActive('/account') ? 2.5 : 2}
        />
        <Text 
          className={`text-[10px] font-semibold mt-1 tracking-wide ${isActive('/account') ? 'text-green-700' : 'text-gray-500'}`}
        >
          Akun
        </Text>
      </TouchableOpacity>
    </View>
  );
}
