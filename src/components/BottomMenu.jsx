import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Platform, Keyboard } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import CartContext from '../context/CartContext';
import ChatContext from '../context/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export function BottomMenu() {
  const { cart } = useContext(CartContext) || { cart: [] };
  const { globalUnreadCount } = useContext(ChatContext) || { globalUnreadCount: 0 };
  
  const navigation = useNavigation();
  const currentRouteName = useNavigationState(state => {
    if (!state || !state.routes) return '';
    return state.routes[state.index]?.name || '';
  });

  const isActive = (pathName) => {
    // Basic route matching; adjust based on your exact navigation setup
    return currentRouteName === pathName;
  };

  const activeColor = "#15803d"; // text-green-700
  const inactiveColor = "#6b7280"; // text-gray-500

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

  // Hide BottomMenu on specific routes
  const hiddenRoutes = ['/cart', '/checkout', '/o/:id', '/orders'];
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
        <FontAwesome5 
          name="home" 
          size={20} 
          color={isActive('/') ? activeColor : inactiveColor} 
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
        <FontAwesome5 
          name="th-large" 
          size={20} 
          color={isActive('/categories/:category_id') ? activeColor : inactiveColor} 
        />
        <Text 
          className={`text-[10px] font-semibold mt-1 tracking-wide ${isActive('/categories/:category_id') ? 'text-green-700' : 'text-gray-500'}`}
        >
          Kategori
        </Text>
      </TouchableOpacity>

      {/* Chat CS */}
      <TouchableOpacity
        onPress={() => handleProtectedNavigation('/cs')}
        className="flex-1 items-center py-1 relative"
      >
        <FontAwesome5 
          name="comments" 
          size={20} 
          color={isActive('/cs') ? activeColor : inactiveColor} 
        />
        {globalUnreadCount > 0 && (
          <View className="absolute top-0 right-4 bg-red-500 rounded-full w-4 h-4 items-center justify-center border border-white">
            <Text className="text-white text-[9px] font-black">{globalUnreadCount}</Text>
          </View>
        )}
        <Text 
          className={`text-[10px] font-semibold mt-1 tracking-wide ${isActive('/cs') ? 'text-green-700' : 'text-gray-500'}`}
        >
          Chat CS
        </Text>
      </TouchableOpacity>

      {/* Keranjang */}
      <TouchableOpacity
        onPress={() => handleProtectedNavigation('/cart')}
        className="flex-1 items-center py-1 relative"
      >
        <FontAwesome5 
          name="shopping-cart" 
          size={20} 
          color={isActive('/cart') ? activeColor : inactiveColor} 
        />
        {cart && cart.length > 0 && (
          <View className="absolute top-0 right-4 bg-red-500 rounded-full w-4 h-4 items-center justify-center border border-white">
            <Text className="text-white text-[9px] font-black">{cart.length}</Text>
          </View>
        )}
        <Text 
          className={`text-[10px] font-semibold mt-1 tracking-wide ${isActive('/cart') ? 'text-green-700' : 'text-gray-500'}`}
        >
          Keranjang
        </Text>
      </TouchableOpacity>

      {/* Akun */}
      <TouchableOpacity
        onPress={() => handleProtectedNavigation('/account')}
        className="flex-1 items-center py-1"
      >
        <FontAwesome5 
          name="user" 
          size={20} 
          color={isActive('/account') ? activeColor : inactiveColor} 
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
