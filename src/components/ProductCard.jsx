import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome5 } from '@expo/vector-icons';
import { path_product_img } from "../config/enpoints";

const toRupiah = (price) => `Rp ${(Number(price) || 0).toLocaleString('id-ID')}`;

const ProductCard = ({ 
  product, 
  cartQuantity, 
  layoutType = 'home', // 'home' | 'category' | 'horizontal'
  onPress, 
  onAdd, 
  onIncrease, 
  onDecrease,
  isGlobalExpired = false
}) => {
  let p = { ...product };
  
  let timeSlots = [];
  if (typeof p.time_slot === 'string') {
    try {
      const parsed = JSON.parse(p.time_slot);
      timeSlots = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
    } catch (e) {
      timeSlots = [];
    }
  } else if (Array.isArray(p.time_slot)) {
    timeSlots = p.time_slot;
  } else if (p.time_slot) {
    timeSlots = [p.time_slot];
  }

  let imageStr = p.image;
  if (Array.isArray(imageStr)) {
    imageStr = imageStr[0];
  } else if (typeof imageStr === 'string' && imageStr.startsWith('[')) {
    try { imageStr = JSON.parse(imageStr)[0]; } catch (e) {}
  }
  
  const displayImage = typeof imageStr === 'string' && imageStr
    ? (imageStr.startsWith("http") ? imageStr : `${path_product_img}/${imageStr}`) 
    : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150";

  let allSlotsExpired = true;
  let hasFresh = timeSlots.length > 0;
  
  if (hasFresh) {
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, "0");
    const currentMinutes = now.getMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHours}:${currentMinutes}:00`;
    
    timeSlots.forEach(slot => {
        if (slot && slot.end_time) {
            const isExpired = currentTime > slot.end_time;
            if (!isExpired) {
                allSlotsExpired = false;
            }
        }
    });
  } else {
    allSlotsExpired = false;
  }

  let dayLabel = "Hari ini";
  if (isGlobalExpired || (hasFresh && allSlotsExpired)) {
      dayLabel = "Besok";
  }

  let displaySlot = null;
  if (hasFresh) {
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, "0");
    const currentMinutes = now.getMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHours}:${currentMinutes}:00`;

    const sortedSlots = [...timeSlots].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
    if (allSlotsExpired) {
        displaySlot = sortedSlots[0];
    } else {
        displaySlot = sortedSlots.find(slot => slot.end_time && slot.end_time >= currentTime) || sortedSlots[0];
    }
  }

  const isHome = layoutType === 'home';
  const isHorizontal = layoutType === 'horizontal';
  const containerClass = isHome 
    ? "flex-1 bg-white rounded-xl border border-gray-100 p-2 m-1 relative"
    : isHorizontal
    ? "w-[115px] bg-white rounded-xl border border-gray-100 p-2 mx-1 my-1 relative"
    : "flex-1 bg-white rounded-xl border border-gray-100 p-2 m-1.5 relative";

  return (
    <View className={containerClass}>
      <TouchableOpacity onPress={() => onPress(p.id)} className="relative">
        <View className="items-center mb-2 w-full aspect-square rounded-xl overflow-hidden bg-gray-50 relative">
          {hasFresh && (
            <View className="absolute top-0 left-0 bg-green-700/90 px-2 py-1 rounded-br-xl z-10 flex-col shadow-sm">
              <Text className="text-[9px] font-black uppercase tracking-wider text-yellow-300">Fresh</Text>
            </View>
          )}
          <Image source={displayImage} className="w-full h-full" contentFit="contain" transition={200} />
        </View>
        
        <Text className="text-[11px] font-extrabold text-gray-800 mb-1" numberOfLines={2}>
          {p.name}
        </Text>
        <View className="flex-row items-center flex-wrap mb-1">
          <View className="bg-gray-100 px-1.5 py-0.5 rounded-[4px] mr-1 mb-1">
            <Text className="text-[9px] font-bold text-gray-500">{dayLabel}</Text>
          </View>
          {displaySlot && displaySlot.start_time && (() => {
            let slotType = null;
            let slotBgClass = "";
            let slotTextClass = "";
            
            const startHour = parseInt(displaySlot.start_time.split(':')[0], 10);
            if (startHour < 12) {
              slotType = "Pagi";
              slotBgClass = "bg-blue-100";
              slotTextClass = "text-blue-700";
            } else if (startHour < 15) {
              slotType = "Siang";
              slotBgClass = "bg-yellow-100";
              slotTextClass = "text-yellow-700";
            } else if (startHour < 18) {
              slotType = "Sore";
              slotBgClass = "bg-red-100";
              slotTextClass = "text-red-700";
            } else {
              slotType = "Malam";
              slotBgClass = "bg-purple-100";
              slotTextClass = "text-purple-700";
            }
            
            return (
              <View className={`px-1.5 py-0.5 rounded-[4px] mb-1 mr-1 ${slotBgClass}`}>
                <Text className={`text-[9px] font-bold ${slotTextClass}`}>{slotType}</Text>
              </View>
            );
          })()}
        </View>
        
        <View className="flex-row flex-wrap">
          {p.choice_options?.map((item, idx) => (
            <View key={idx} className="rounded-lg p-1 bg-orange-500 mr-1 mb-1">
              <Text className="text-[9px] text-white font-bold">{item.title}</Text>
            </View>
          ))}
        </View>
        
        <Text className="text-[11.5px] font-black text-green-700">{toRupiah(p.price)}</Text>
        {p.variant || p.capacity ? (
          <Text className="text-[9px] text-gray-500 mt-0.5">{p.variant || `${p.capacity} ${p.unit}`}</Text>
        ) : null}
      </TouchableOpacity>
      
      <View className="mt-3 h-8 justify-end">
        {cartQuantity > 0 ? (
          <View className="flex-row items-center justify-between bg-green-50 border border-green-200 rounded-lg overflow-hidden h-full">
            <TouchableOpacity
              className="w-8 h-full items-center justify-center bg-green-100"
              onPress={() => onDecrease(p.id)}
            >
              <FontAwesome5 name="minus" size={10} color="#15803d" />
            </TouchableOpacity>
            <Text className="font-bold text-green-800 text-xs px-2">{cartQuantity}</Text>
            <TouchableOpacity
              className="w-8 h-full items-center justify-center bg-green-100"
              onPress={() => onIncrease(p.id)}
            >
              <FontAwesome5 name="plus" size={10} color="#15803d" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className={`h-full flex-row items-center justify-center rounded-lg ${
              p.total_stock > 0 || typeof p.total_stock === 'undefined' ? "bg-green-700" : "bg-slate-400"
            }`}
            onPress={() => onAdd(p)}
          >
            <FontAwesome5 name="plus" size={10} color="white" />
            <Text className="text-white font-bold text-[10px] ml-1.5">Tambah</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default memo(ProductCard);
