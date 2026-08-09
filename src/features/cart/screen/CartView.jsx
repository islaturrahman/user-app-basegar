import React, { useCallback } from "react";
import { View, ScrollView, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppBar from "../../../components/AppBar";
import CartProvider from "../provider/CartProvider";
import CartListItem from "../widget/CartListItem";
import BottomCartView from "../widget/BottomCartView";
import ConfigProvider from "../../../provider/ConfigProvider";

// import DeliveryProvider from "../../delivery/provider/DeliveryProvider";

const CartView = () => {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          navigation.replace("/login");
        }
      };
      checkAuth();
    }, [navigation])
  );

  return (
    <View className="flex-1 bg-gray-50">
      <AppBar title={"Keranjang"} route={"/"} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 180 : 140 }} showsVerticalScrollIndicator={false}>
        <CartListItem />
      </ScrollView>


      
      {/* Bottom bar ditempatkan di luar ScrollView agar selalu sticky di bawah */}
      <BottomCartView />
    </View>
  );
};

export default CartView;
