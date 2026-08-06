import React from "react";
import { View, ScrollView, Platform } from "react-native";
import AppBar from "../../../components/AppBar";
import CartProvider from "../provider/CartProvider";
import CartListItem from "../widget/CartListItem";
import FlashSale from "../widget/FlashSale";
import BottomCartView from "../widget/BottomCartView";
import ConfigProvider from "../../../provider/ConfigProvider";
// import DeliveryProvider from "../../delivery/provider/DeliveryProvider";

const CartView = () => {
  return (
    <View className="flex-1 bg-gray-50">
      <AppBar title={"Keranjang"} route={"/"} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 180 : 140 }} showsVerticalScrollIndicator={false}>
        <CartListItem />
        <FlashSale />
      </ScrollView>

      {/* Bottom bar ditempatkan di luar ScrollView agar selalu sticky di bawah */}
      <BottomCartView />
    </View>
  );
};

export default CartView;
