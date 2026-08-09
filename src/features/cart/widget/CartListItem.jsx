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

  const parseTimeSlots = (time_slot) => {
    let slots = [];
    if (typeof time_slot === 'string') {
      try {
        const parsed = JSON.parse(time_slot);
        slots = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
      } catch (e) {
        slots = [];
      }
    } else if (Array.isArray(time_slot)) {
      slots = time_slot;
    } else if (time_slot) {
      slots = [time_slot];
    }
    return slots;
  };

  const isProductExpired = (item, currentTime) => {
    const slots = parseTimeSlots(item.time_slot);
    if (slots.length === 0) return false;
    let allExpired = true;
    slots.forEach(slot => {
        if (slot && slot.end_time) {
            if (currentTime <= slot.end_time) {
                allExpired = false;
            }
        }
    });
    return allExpired;
  };

  const handleSelectDate = (dateId) => {
    const expiredIds = cart?.filter(item => isProductExpired(item, currentTime)).map(item => item.product_id) || [];
    
    if (dateId === "today") {
      // Uncheck produk yang tidak bisa diproses hari ini
      if (expiredIds.length > 0) {
        updateItemSelection(expiredIds, false);
      }
    } else {
      // Re-check produk yang sebelumnya kadaluarsa karena dipindahkan ke besok
      if (expiredIds.length > 0) {
        updateItemSelection(expiredIds, true);
      }
    }
    setDeliveryDate(dateId);
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

  const readyToProcess = cart?.filter(item => {
    const isExpiredFresh = isProductExpired(item, currentTime);
    return !(deliveryDate === "today" && isExpiredFresh);
  }) || [];

  const cannotProcess = cart?.filter(item => {
    const isExpiredFresh = isProductExpired(item, currentTime);
    return (deliveryDate === "today" && isExpiredFresh);
  }) || [];
  
  const isAllValidSelected = readyToProcess.length > 0 && readyToProcess.every(item => item.is_selected !== false);

  const handleSelectAll = () => {
    const validIds = readyToProcess.map(item => item.product_id);
    updateItemSelection(validIds, !isAllValidSelected);
  };

  const renderProductItem = (item, index, isCheckboxDisabled) => {
    const slots = parseTimeSlots(item.time_slot);
    const isExpiredFresh = isProductExpired(item, currentTime);
    let dayLabel = isExpiredFresh && slots.length > 0 ? "Besok" : "Hari ini";
    
    let displaySlot = null;
    if (slots.length > 0) {
        const sortedSlots = [...slots].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
        if (isExpiredFresh) {
            displaySlot = sortedSlots[0];
        } else {
            displaySlot = sortedSlots.find(slot => slot.end_time && slot.end_time >= currentTime) || sortedSlots[0];
        }
    }

    return (
      <View
        key={item.product_id || index.toString()}
        className={`bg-white p-4 flex-row items-center border-b border-gray-100 ${isCheckboxDisabled ? 'opacity-50 bg-gray-50' : ''}`}
      >
      <Checkbox 
        checked={item.is_selected !== false} 
        onPress={() => {
          if (!isCheckboxDisabled) toggleSelectItem(item.product_id);
        }} 
        disabled={isCheckboxDisabled}
      />
      
      <View className={`w-16 h-16 bg-gray-400 mr-3 rounded relative overflow-hidden ${isCheckboxDisabled ? 'grayscale' : ''}`}>
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
        <Text className={`font-bold ${isCheckboxDisabled ? 'text-gray-500' : 'text-gray-800'}`}>{item.name}</Text>
        <Text className={`text-sm mb-1 ${isCheckboxDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
          {toRupiah(item.price)} x {item.quantity}
        </Text>

        <View className="flex-row flex-wrap gap-1 mt-1">
          {slots.length > 0 && (
            <View className="bg-green-600 py-0.5 px-1.5 rounded flex-row items-center self-start">
              <Text className="text-[10px] text-yellow-300 font-bold">Fresh</Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center flex-wrap mt-1">
          <View className={`px-1.5 py-0.5 rounded-[4px] mr-1 mb-1 ${isCheckboxDisabled ? 'bg-gray-200' : 'bg-gray-100'}`}>
            <Text className={`text-[9px] font-bold ${isCheckboxDisabled ? 'text-gray-400' : 'text-gray-500'}`}>{dayLabel}</Text>
          </View>
          {displaySlot && displaySlot.start_time && (() => {
            let slotType = null;
            let slotBgClass = "";
            let slotTextClass = "";
            const startHour = parseInt(displaySlot.start_time.split(':')[0], 10);
            if (startHour < 12) {
              slotType = "Pagi"; slotBgClass = "bg-blue-100"; slotTextClass = "text-blue-700";
            } else if (startHour < 15) {
              slotType = "Siang"; slotBgClass = "bg-yellow-100"; slotTextClass = "text-yellow-700";
            } else if (startHour < 18) {
              slotType = "Sore"; slotBgClass = "bg-red-100"; slotTextClass = "text-red-700";
            } else {
              slotType = "Malam"; slotBgClass = "bg-purple-100"; slotTextClass = "text-purple-700";
            }
            if (isCheckboxDisabled) {
                slotBgClass = "bg-gray-200";
                slotTextClass = "text-gray-400";
            }
            return (
              <View className={`px-1.5 py-0.5 rounded-[4px] mb-1 mr-1 ${slotBgClass}`}>
                <Text className={`text-[9px] font-bold ${slotTextClass}`}>{slotType}</Text>
              </View>
            );
          })()}
        </View>
      </View>
      
      <View className={`flex-row items-center ml-auto rounded border overflow-hidden w-20 h-8 ${isCheckboxDisabled ? 'bg-gray-100 border-gray-200 opacity-50' : 'bg-gray-50 border-gray-300'}`}>
        <TouchableOpacity
          className="w-7 h-full flex items-center justify-center"
          onPress={() => { if(!isCheckboxDisabled) minQuantity(item.product_id); }}
        >
          <Text className={`${isCheckboxDisabled ? 'text-gray-400' : 'text-red-500'} font-bold text-lg`}>-</Text>
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center">
          <Text className={`text-sm font-semibold ${isCheckboxDisabled ? 'text-gray-400' : ''}`}>{item.quantity}</Text>
        </View>
        <TouchableOpacity
          className="w-7 h-full flex items-center justify-center"
          onPress={() => { if(!isCheckboxDisabled) addQuantity(item.product_id); }}
        >
          <Text className={`${isCheckboxDisabled ? 'text-gray-400' : 'text-green-500'} font-bold text-lg`}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
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
              
              // Hitung jumlah produk yang secara murni bisa diproses HARI INI 
              // tanpa terpengaruh oleh state `deliveryDate` saat ini
              const todayAvailableCount = cart?.filter(p => !isProductExpired(p, currentTime)).length || 0;
              const availableCount = item.id === "today" ? todayAvailableCount : totalProducts;
              
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

        {cart && cart.length > 0 ? (
          <View>
            {/* Seksi Produk Siap Diproses */}
            <View className="mt-1">
              <View className="bg-white p-4 flex-row items-center justify-between border-b border-gray-100">
                <View className="flex-row items-center">
                  <Checkbox checked={isAllValidSelected} onPress={handleSelectAll} />
                  <Text className="font-bold text-gray-800">
                    Produk Siap Diproses {deliveryDate === "today" ? "(Hari ini)" : "(Besok)"}
                  </Text>
                </View>
              </View>
              {readyToProcess.length > 0 ? (
                readyToProcess.map((item, index) => renderProductItem(item, index, false))
              ) : (
                <View className="bg-white p-6 items-center justify-center">
                  <Text className="text-gray-400 text-sm">Tidak ada produk yang siap diproses.</Text>
                </View>
              )}
            </View>

            {/* Seksi Produk Belum Bisa Diproses */}
            {cannotProcess.length > 0 && (
              <View className="mt-4">
                <View className="bg-white p-4 border-b border-gray-100">
                  <Text className="font-bold text-gray-600">Produk Belum Bisa Diproses</Text>
                  <Text className="text-xs text-gray-400 mt-1">Waktu pengantaran hari ini telah habis. Pilih pengiriman besok untuk memproses produk ini.</Text>
                </View>
                {cannotProcess.map((item, index) => renderProductItem(item, index, true))}
              </View>
            )}
          </View>
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
