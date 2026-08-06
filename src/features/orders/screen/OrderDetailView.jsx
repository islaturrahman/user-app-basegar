import React from "react";
import { View } from "react-native";
import { useRoute } from "@react-navigation/native";
import OrderProvider from "../provider/OrderProvider";
import OrderDetailProvider from "../provider/OrderDetailProvider";
import OrderDetailWidget from "../widget/OrderDetailWidget";
import AppBar from "../../../components/AppBar";

export default function OrderDetailView() {
  const route = useRoute();
  const orderId = route.params?.id;

  return (
    <View className="flex-1 bg-gray-50">
      <AppBar title={`Detail Pesanan #${orderId || ""}`} />
      <OrderProvider>
        <OrderDetailProvider orderId={orderId}>
          <OrderDetailWidget />
        </OrderDetailProvider>
      </OrderProvider>
    </View>
  );
}
