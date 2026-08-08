import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome5 } from '@expo/vector-icons';
import { path_product_img } from "../config/enpoints";

const toRupiah = (price) => `Rp ${(Number(price) || 0).toLocaleString('id-ID')}`;

const ProductCard = ({ 
  product, 
  cartQuantity, 
  layoutType = 'home', // 'home' | 'category'
  onPress, 
  onAdd, 
  onIncrease, 
  onDecrease 
}) => {
  let p = { ...product };
  
  if (typeof p.time_slot === 'string') {
    try {
      p.time_slot = JSON.parse(p.time_slot);
    } catch (e) {
      p.time_slot = null;
    }
  }
  if (Array.isArray(p.time_slot)) {
    p.time_slot = p.time_slot[0];
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

  let isSlotExpired = false;
  if (p.time_slot && p.time_slot.end_time) {
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, "0");
    const currentMinutes = now.getMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHours}:${currentMinutes}:00`;
    isSlotExpired = currentTime > p.time_slot.end_time;
  }

  const isHome = layoutType === 'home';
  const containerClass = isHome 
    ? "flex-1 bg-white rounded-xl border border-gray-100 p-2 m-1 relative"
    : "flex-1 bg-white rounded-xl border border-gray-100 p-2 m-1.5 relative";

  return (
    <View className={containerClass}>
      <TouchableOpacity onPress={() => onPress(p.id)} className="relative">
        <View className="items-center mb-2 w-full aspect-square rounded-xl overflow-hidden bg-gray-50 relative">
          {p.time_slot && p.time_slot.start_time && (
            <View className="absolute top-0 left-0 bg-green-700/90 px-2 py-1 rounded-br-xl z-10 flex-col shadow-sm">
              <Text className="text-[9px] font-black uppercase tracking-wider text-yellow-300">Fresh</Text>
            </View>
          )}
          <Image source={displayImage} className="w-full h-full" contentFit="contain" transition={200} />
        </View>
        
        <Text className="text-[11px] font-extrabold text-gray-800 mb-1" numberOfLines={2}>
          {p.name}
        </Text>
        {isSlotExpired && (
          <View className="bg-gray-200 self-start px-2 py-0.5 rounded-[5px] mb-1">
            <Text className="text-[9px] font-bold text-gray-700">Tersedia besok</Text>
          </View>
        )}
        
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
