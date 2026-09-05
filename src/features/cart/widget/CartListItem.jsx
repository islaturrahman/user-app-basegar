import React, { useContext, useState, useEffect } from "react";
import ProductsContext from "../../../context/ProductsContext";
import { View, Text, Image as RNImage, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { Image } from "expo-image";
import CartContext from "../../../context/CartContext";
import { toRupiah } from "../../../components/Helper";
import { path_product_img } from "../../../config/enpoints";
import { TimeSlotContext } from "../../checkout/provider/TimeSlotProvider";

const CartListItem = () => {
  const { cart, removeFromCart, addQuantity, minQuantity, toggleSelectItem, toggleSelectAll, updateItemSelection, clearCart } = useContext(CartContext);
  const productsContext = useContext(ProductsContext);
  const deliveryDate = productsContext?.deliveryDate || "tomorrow";
  const setDeliveryDate = productsContext?.setDeliveryDate || (() => {});
  const { isGlobalExpired } = useContext(TimeSlotContext) || {};

  // Jika slot hari ini sudah habis, paksa ke besok
  useEffect(() => {
    if (isGlobalExpired && deliveryDate === "today") {
      setDeliveryDate("tomorrow");
    }
  }, [isGlobalExpired]);
  
  // Gunakan state dari CartContext agar tersinkron dengan perhitungan total
  const isAllSelected = cart?.length > 0 && cart.every(item => item.is_selected !== false);

  const totalProducts = cart?.length || 0;
  
  const now = new Date();
  const currentHours = now.getHours().toString().padStart(2, "0");
  const currentMinutes = now.getMinutes().toString().padStart(2, "0");
  const currentTime = `${currentHours}:${currentMinutes}:00`;

  const processedCart = React.useMemo(() => {
    if (!cart) return [];
    
    return cart.map(item => {
      let slots = [];
      const time_slot = item.time_slot;
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
      
      let isExpiredFresh = false;
      if (slots.length > 0) {
        let allExpired = true;
        for (let i = 0; i < slots.length; i++) {
          const slot = slots[i];
          if (slot && slot.end_time) {
             if (currentTime <= slot.end_time) {
                 allExpired = false;
                 break;
             }
          }
        }
        isExpiredFresh = allExpired;
      }
      
      return {
        ...item,
        _parsedSlots: slots,
        _isExpiredFresh: isExpiredFresh
      };
    });
  }, [cart, currentTime]);

  const handleSelectDate = (dateId) => {
    if (dateId === "today") {
      // Uncheck produk yang tidak bisa diproses hari ini (yang saat ini masih ter-check)
      const expiredIdsToUncheck = processedCart
        .filter(item => item._isExpiredFresh && item.is_selected !== false)
        .map(item => item.product_id);
        
      if (expiredIdsToUncheck.length > 0) {
        updateItemSelection(expiredIdsToUncheck, false);
      }
    } else {
      // Re-check produk yang sebelumnya kadaluarsa karena dipindahkan ke besok (yang saat ini sedang uncheck)
      const expiredIdsToCheck = processedCart
        .filter(item => item._isExpiredFresh && item.is_selected === false)
        .map(item => item.product_id);
        
      if (expiredIdsToCheck.length > 0) {
        updateItemSelection(expiredIdsToCheck, true);
      }
    }
    setDeliveryDate(dateId);
  };

  const today = new Date();
  const dates = [0, 1].map(i => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      id: i === 0 ? "today" : "tomorrow",
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

  const readyToProcess = processedCart.filter(item => {
    return !(deliveryDate === "today" && item._isExpiredFresh);
  });

  const cannotProcess = processedCart.filter(item => {
    return (deliveryDate === "today" && item._isExpiredFresh);
  });
  
  const isAllValidSelected = readyToProcess.length > 0 && readyToProcess.every(item => item.is_selected !== false);

  const handleSelectAll = () => {
    const validIds = readyToProcess.map(item => item.product_id);
    updateItemSelection(validIds, !isAllValidSelected);
  };

  const confirmDeleteSelected = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm("Yakin ingin menghapus semua produk yang ditandai?");
      if (confirm) {
        clearCart();
      }
    } else {
      Alert.alert(
        "Hapus Produk",
        "Yakin ingin menghapus semua produk yang ditandai?",
        [
          { text: "Batal", style: "cancel" },
          { text: "Hapus", onPress: clearCart, style: "destructive" }
        ]
      );
    }
  };

  const renderProductItem = (item, index, isCheckboxDisabled) => {
    const slots = item._parsedSlots;
    const isExpiredFresh = item._isExpiredFresh;
    let dayLabel = (isGlobalExpired || (isExpiredFresh && slots.length > 0) || deliveryDate === "tomorrow") ? "Besok" : "Hari ini";

    let displaySlot = null;
    if (slots.length > 0) {
        const sortedSlots = [...slots].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
        if (isExpiredFresh || isGlobalExpired || deliveryDate === "tomorrow" || dayLabel === "Besok") {
            displaySlot = sortedSlots[0];
        } else {
            displaySlot = sortedSlots.find(slot => slot.end_time && slot.end_time >= currentTime) || sortedSlots[0];
        }
    }

    return (
      <View
        key={item.product_id || index.toString()}
        className={`bg-white px-4 py-3 flex-row items-center border-b border-gray-100 ${isCheckboxDisabled ? 'opacity-50 bg-gray-50' : ''}`}
      >
      <Checkbox 
        checked={item.is_selected !== false} 
        onPress={() => {
          if (!isCheckboxDisabled) toggleSelectItem(item.product_id);
        }} 
        disabled={isCheckboxDisabled}
      />
      
      <View className={`w-14 h-14 bg-gray-400 mr-3 rounded-xl relative overflow-hidden ${isCheckboxDisabled ? 'grayscale' : ''}`}>
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
        <Text className={`text-xs ${isCheckboxDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
          {toRupiah(item.price)} x {item.quantity}
        </Text>

        <View className="flex-row items-center flex-wrap gap-1 mt-0.5">
          {slots.length > 0 && (
            <View className="bg-green-600 py-0.5 px-1.5 rounded flex-row items-center self-start">
              <Text className="text-[10px] text-yellow-300 font-bold">Fresh</Text>
            </View>
          )}
          <View className={`px-1.5 py-0.5 rounded-[4px] ${isCheckboxDisabled ? 'bg-gray-200' : 'bg-gray-100'}`}>
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
              <View className={`px-1.5 py-0.5 rounded-[4px] ${slotBgClass}`}>
                <Text className={`text-[9px] font-bold ${slotTextClass}`}>{slotType}</Text>
              </View>
            );
          })()}
        </View>
      </View>
      
      <View className={`flex-row items-center ml-auto ${isCheckboxDisabled ? 'opacity-50' : ''}`}>
        <TouchableOpacity
          className={`w-7 h-7 rounded-full items-center justify-center border ${isCheckboxDisabled ? 'border-gray-200 bg-gray-100' : 'border-green-200 bg-white shadow-sm'}`}
          onPress={() => { if(!isCheckboxDisabled) minQuantity(item.product_id); }}
        >
          <Text className={`${isCheckboxDisabled ? 'text-gray-400' : 'text-green-700'} font-bold text-sm`}>-</Text>
        </TouchableOpacity>
        <View className="w-8 items-center justify-center">
          <Text className={`text-sm font-bold ${isCheckboxDisabled ? 'text-gray-400' : 'text-gray-800'}`}>{item.quantity}</Text>
        </View>
        <TouchableOpacity
          className={`w-7 h-7 rounded-full items-center justify-center shadow-sm ${isCheckboxDisabled ? 'bg-gray-200' : 'bg-green-600'}`}
          onPress={() => { if(!isCheckboxDisabled) addQuantity(item.product_id); }}
        >
          <Text className={`font-bold text-sm ${isCheckboxDisabled ? 'text-gray-400' : 'text-white'}`}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  return (
    <View className="mb-0 bg-gray-50">
      <View className="mb-0">
        
        {/* Delivery Date Selection Chips */}
        {cart && cart.length > 0 && (
          <View className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
            <Text className="font-bold text-gray-800 mb-3">Pilih Pengiriman</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dates.map((item) => {
                const isSelected = deliveryDate === item.id;
                const isTodayChip = item.id === "today";
                const isDisabled = isTodayChip && !!isGlobalExpired;
                
                // Hitung jumlah produk yang secara murni bisa diproses HARI INI 
                // tanpa terpengaruh oleh state `deliveryDate` saat ini
                const todayAvailableCount = processedCart.filter(p => !p._isExpiredFresh).length;
                const availableCount = item.id === "today" ? todayAvailableCount : totalProducts;
                
                return (
                  <TouchableOpacity 
                    key={item.id}
                    onPress={() => !isDisabled && handleSelectDate(item.id)}
                    disabled={isDisabled}
                    className={`mr-3 p-3 rounded-xl border flex items-center justify-center min-w-[100px] ${
                      isDisabled
                        ? 'border-gray-100 bg-gray-50'
                        : isSelected ? 'border-green-600 bg-green-50 shadow-sm' : 'border-gray-200 bg-white'
                    }`}
                    style={{ opacity: isDisabled ? 0.5 : 1 }}
                  >
                    <Text className={`font-bold text-sm ${
                      isDisabled ? 'text-gray-400' : isSelected ? 'text-green-800' : 'text-gray-700'
                    }`}>
                      {isTodayChip && isGlobalExpired ? '🚫 ' : ''}{item.label}
                    </Text>
                    <Text className={`text-xs mt-1 ${
                      isDisabled ? 'text-gray-300' : isSelected ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {isTodayChip && isGlobalExpired ? 'Sudah tutup' : item.dateStr}
                    </Text>
                    {!isDisabled && (
                      <View className={`mt-2 px-2 py-0.5 rounded-full ${isSelected ? 'bg-green-200' : 'bg-gray-100'}`}>
                        <Text className={`text-[10px] font-medium ${isSelected ? 'text-green-800' : 'text-gray-600'}`}>
                          {availableCount} produk
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        )}

        {cart && cart.length > 0 ? (
          <View>
            {/* Seksi Produk Siap Diproses */}
            <View className="mt-1">
              <View className="bg-white p-4 flex-row items-center justify-between border-b border-gray-100">
                <View className="flex-row items-center">
                  <Checkbox checked={isAllValidSelected} onPress={handleSelectAll} />
                  <Text className="font-bold text-gray-800">
                    Pilih Semua {deliveryDate === "today" ? "(Hari ini)" : "(Besok)"}
                  </Text>
                </View>
                {readyToProcess.some(item => item.is_selected !== false) && (
                  <TouchableOpacity onPress={confirmDeleteSelected} className="px-2 py-1">
                    <Text className="text-red-500 font-bold text-sm">Hapus</Text>
                  </TouchableOpacity>
                )}
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
