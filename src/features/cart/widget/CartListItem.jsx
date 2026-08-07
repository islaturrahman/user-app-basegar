import React, { useContext, useState } from "react";
import ProductsContext from "../../../context/ProductsContext";
import { View, Text, Image as RNImage, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { Image } from "expo-image";
import CartContext from "../../../context/CartContext";
import { toRupiah } from "../../../components/Helper";
import { path_product_img } from "../../../config/enpoints";

const CartListItem = () => {
  const { cart, removeFromCart, addQuantity, minQuantity, toggleSelectItem, toggleSelectAll, updateItemSelection } = useContext(CartContext);
  const productsContext = useContext(ProductsContext);
  const deliveryDate = productsContext?.deliveryDate || "tomorrow";
  const setDeliveryDate = productsContext?.setDeliveryDate || (() => {});
  
  // Gunakan state dari CartContext agar tersinkron dengan perhitungan total
  const isAllSelected = cart?.length > 0 && cart.every(item => item.is_selected !== false);

  const totalProducts = cart?.length || 0;
  
  const now = new Date();
  const currentHours = now.getHours().toString().padStart(2, "0");
  const currentMinutes = now.getMinutes().toString().padStart(2, "0");
  const currentTime = `${currentHours}:${currentMinutes}:00`;

  const expiredFreshProducts = cart?.filter(item => {
    return item.time_slot && item.time_slot.end_time && currentTime > item.time_slot.end_time;
  }) || [];
  const expiredFreshCount = expiredFreshProducts.length;

  const handleSelectDate = (dateId) => {
    if (dateId === "today" && expiredFreshCount > 0) {
       if (Platform.OS === 'web') {
         const confirm = window.confirm("Batalkan Centang Produk Fresh?\n\nBeberapa Produk Fresh sudah melewati batas waktu pemesanan untuk hari ini (hanya bisa dikirim mulai besok). Apakah Anda ingin tetap memilih pengiriman Hari Ini dan mengabaikan (uncheck) produk tersebut?");
         if (confirm) {
           updateItemSelection(expiredFreshProducts.map(item => item.product_id), false);
           setDeliveryDate(dateId);
         }
       } else {
         Alert.alert(
           "Batalkan Centang Produk Fresh?",
           "Beberapa Produk Fresh sudah melewati batas waktu pemesanan untuk hari ini (hanya bisa dikirim mulai besok). Apakah Anda ingin tetap memilih pengiriman Hari Ini dan mengabaikan (uncheck) produk tersebut?",
           [
             { text: "Batal", style: "cancel" },
             { 
               text: "Ya, Abaikan", 
               onPress: () => {
                 updateItemSelection(expiredFreshProducts.map(item => item.product_id), false);
                 setDeliveryDate(dateId);
               }
             }
           ]
         );
       }
    } else {
       // Jika sebelumnya 'today', dan sekarang pilih yang lain, biarkan user centang manual kembali
       setDeliveryDate(dateId);
    }
  };

  const today = new Date();
  const dates = [0, 1].map(i => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      id: i === 0 ? "today" : i.toString(),
      label: i === 0 ? "Hari ini" : "Besok",
      dateStr: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
    }
  });

  // Komponen Checkbox Sederhana
  const Checkbox = ({ checked, onPress, disabled }) => (
    <TouchableOpacity 
      onPress={onPress}
      disabled={disabled}
      className={`w-6 h-6 mr-3 rounded-full border-2 flex items-center justify-center transition-all ${
        disabled ? 'border-gray-200 bg-gray-100' : checked ? 'border-transparent bg-green-600' : 'border-gray-300 bg-white'
      }`}
    >
      {checked && (
        <Text className={`font-bold text-xs ${disabled ? 'text-gray-300' : 'text-white'}`}>✓</Text>
      )}
    </TouchableOpacity>
  );

  const validCartItems = cart?.filter(item => {
    const isExpiredFresh = !!(item.time_slot && item.time_slot.end_time && currentTime > item.time_slot.end_time);
    return !(deliveryDate === "today" && isExpiredFresh);
  }) || [];
  
  const isAllValidSelected = validCartItems.length > 0 && validCartItems.every(item => item.is_selected !== false);

  const handleSelectAll = () => {
    const validIds = validCartItems.map(item => item.product_id);
    updateItemSelection(validIds, !isAllValidSelected);
  };

  return (
    <View className="mb-0 bg-gray-50">
      <View className="mb-0">
        
        {/* Delivery Date Selection Chips */}
        <View className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
          <Text className="font-bold text-gray-800 mb-3">Pilih Pengiriman</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dates.map((item) => {
              const isSelected = deliveryDate === item.id;
              const availableCount = item.id === "today" ? (totalProducts - expiredFreshCount) : totalProducts;
              
              return (
                <TouchableOpacity 
                  key={item.id}
                  onPress={() => handleSelectDate(item.id)}
                  className={`mr-3 p-3 rounded-xl border flex items-center justify-center min-w-[100px] ${
                    isSelected ? 'border-green-600 bg-green-50 shadow-sm' : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text className={`font-bold text-sm ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>
                    {item.label}
                  </Text>
                  <Text className={`text-xs mt-1 ${isSelected ? 'text-green-700' : 'text-gray-500'}`}>
                    {item.dateStr}
                  </Text>
                  <View className={`mt-2 px-2 py-0.5 rounded-full ${isSelected ? 'bg-green-200' : 'bg-gray-100'}`}>
                    <Text className={`text-[10px] font-medium ${isSelected ? 'text-green-800' : 'text-gray-600'}`}>
                      {availableCount} produk
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {cart && cart.length > 0 && (
          <View className="mt-1 mb-1 p-4 bg-white flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Checkbox checked={isAllValidSelected} onPress={handleSelectAll} />
              <Text className="font-regular text-gray-700">Pilih Semua</Text>
            </View>
            {/* Tombol Hapus Dihilangkan sesuai instruksi */}
          </View>
        )}
        
        {cart && cart.length > 0 ? (
          cart.map((item, index) => {
            let isSlotExpired = false;
            if (item.time_slot && item.time_slot.end_time) {
              isSlotExpired = currentTime > item.time_slot.end_time;
            }

            const isExpiredFresh = !!(item.time_slot && item.time_slot.end_time && currentTime > item.time_slot.end_time);
            const isCheckboxDisabled = deliveryDate === "today" && isExpiredFresh;

            return (
              <View
                key={index.toString()}
                className={`bg-white p-4 mb-0 flex-row items-center border-b border-gray-100 ${isCheckboxDisabled ? 'opacity-60' : ''}`}
              >
              <Checkbox 
                checked={item.is_selected !== false} 
                onPress={() => {
                  if (!isCheckboxDisabled) toggleSelectItem(item.product_id);
                }} 
                disabled={isCheckboxDisabled}
              />
              
              <View className="w-16 h-16 bg-gray-400 mr-3 rounded relative overflow-hidden">
                <Image
                  source={{ uri: `${path_product_img}/${item.image}` }}
                  className="w-full h-full"
                  contentFit="cover"
                  transition={200}
                />
                {item.variant && item.variant.length > 0 && (
                  <View className="absolute bottom-0 left-0 w-full bg-red-600/90 py-0.5">
                    <Text className="text-white text-[9px] text-center font-bold">{item.variant}</Text>
                  </View>
                )}
              </View>
              
              <View className="flex-1 relative">
                <Text className="font-bold text-gray-800">{item.name}</Text>
                <Text className="text-sm text-gray-600 mb-1">
                  {toRupiah(item.price)} x {item.quantity}
                </Text>

                <View className="flex-row flex-wrap gap-1 mt-1">
                  {item.time_slot && item.time_slot.start_time && (
                    <View className="bg-green-600 py-0.5 px-1.5 rounded flex-row items-center self-start">
                      <Text className="text-[10px] text-yellow-300 font-bold">Fresh</Text>
                    </View>
                  )}
                </View>
                {isSlotExpired && (
                  <View className="bg-gray-200 self-start px-2 py-0.5 rounded-[5px] mt-1">
                    <Text className="text-[9px] font-bold text-gray-700">Tersedia besok</Text>
                  </View>
                )}
              </View>
              
              <View className="flex-row items-center ml-auto bg-gray-50 rounded border border-gray-300 overflow-hidden w-20 h-8">
                <TouchableOpacity
                  className="w-7 h-full flex items-center justify-center"
                  onPress={() => minQuantity(item.product_id)}
                >
                  <Text className="text-red-500 font-bold text-lg">-</Text>
                </TouchableOpacity>
                <View className="flex-1 items-center justify-center">
                  <Text className="text-sm font-semibold">{item.quantity}</Text>
                </View>
                <TouchableOpacity
                  className="w-7 h-full flex items-center justify-center"
                  onPress={() => addQuantity(item.product_id)}
                >
                  <Text className="text-green-500 font-bold text-lg">+</Text>
                </TouchableOpacity>
              </View>
            </View>
            );
          })
        ) : (
          <View className="items-center w-full pb-0 justify-center bg-white pt-0 mt-2">
            <Image 
              source={require("../../../assets/images/not_found.jpg")}
              className="h-96"
              style={{ aspectRatio: 1 }}
              contentFit="cover"
            />
            {/* <View className="px-6 mt-6">
              <Text className="text-gray-500 font-bold text-center text-lg">Keranjang kamu masih kosong</Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">Yuk, mulai penuhi dengan belanjaan segar pilihanmu!</Text>
            </View> */}
          </View>
        )}
      </View>
    </View>
  );
};

export default CartListItem;
