import React, { useState, useEffect, useContext, useCallback } from "react";
import { View, Text, Image as RNImage, TouchableOpacity, ScrollView, Dimensions, Modal, Platform, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Contexts (Assumes these have been migrated)
import ProductsContext from "../../../context/ProductsContext";
import { ConfigContext } from "../../../provider/ConfigProvider";
import CartContext from "../../../context/CartContext";
import { TimeSlotContext } from "../../../features/checkout/provider/TimeSlotProvider";
import * as SplashScreen from 'expo-splash-screen';

import HeroWidget from "../widget/HeroWidget";
import CategoryWidget from "../widget/CategoryWidget";
import BannerWidget from "../widget/BannerWidget";
import ProductCard from "../../../components/ProductCard";
import ProductCardSkeleton from "../../../components/ProductCardSkeleton";
import FloatingFreeDeliveryProgress from "../../cart/widget/FloatingFreeDeliveryProgress";
// import Footer from "../../address/footer";

// import { BottomMenu } from "../../../component/bottom_menu";
import TimeslotModal from "../../../components/TimeslotModal";
import { BlankBottomSheet } from "../../../components/BlankBottomSheet";

// Helper (Assumes a basic helper is available)
import { path_offer_img, flash_deal } from "../../../config/enpoints";
import { get } from "../../../data/api";
const toRupiah = (price) => `Rp ${price.toLocaleString('id-ID')}`;

const PromoImage = ({ src, fallbackEmoji, bgColor }) => {
  const [hasError, setHasError] = useState(false);
  return (
    <View className={`w-11 h-11 rounded-full shadow-md overflow-hidden items-center justify-center bg-white ${bgColor}`}>
      {!hasError ? (
        <Image 
          source={src}
          className="w-full h-full" 
          onError={() => setHasError(true)}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <Text className="text-lg">{fallbackEmoji}</Text>
      )}
    </View>
  );
};

export default function Home() {
  const windowWidth = Dimensions.get('window').width;
  const width = Platform.OS === 'web' ? Math.min(windowWidth, 600) : windowWidth;

  const navigation = useNavigation();
  
  const { fetchProducts, deliveryDate, setDeliveryDate } = useContext(ProductsContext);
  const { config } = useContext(ConfigContext);
  const { cart, getCart, addToCart, addQuantity, minQuantity } = useContext(CartContext);
  const { isGlobalExpired, maxEndTime = "17:00" } = useContext(TimeSlotContext) || {};

  // Jika slot hari ini sudah habis, paksa ke besok
  useEffect(() => {
    if (isGlobalExpired && deliveryDate === "today") {
      setDeliveryDate("tomorrow");
    }
  }, [isGlobalExpired]);

  // page state removed as useInfiniteQuery handles it
  const [showModal, setShowModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [showScheduleInfo, setShowScheduleInfo] = useState(false);



  const handleAddProduct = useCallback(async (p) => {
    console.log("Add button tapped for:", p.name);
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      console.log("No token found, navigating to login");
      navigation.navigate("/login");
      return;
    }
    
    const stock = p.total_stock !== undefined ? p.total_stock : 10;
    console.log("Stock available:", stock);
    if (stock > 0) {
      console.log("Delivery date:", deliveryDate, "Timeslot:", p.time_slot);
      if (deliveryDate === "today") {
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

        if (timeSlots.length > 0) {
          const now = new Date();
          const currentHours = now.getHours().toString().padStart(2, "0");
          const currentMinutes = now.getMinutes().toString().padStart(2, "0");
          const currentTime = `${currentHours}:${currentMinutes}:00`;

          let allExpired = true;
          timeSlots.forEach(slot => {
              if (slot && slot.end_time && currentTime <= slot.end_time) {
                  allExpired = false;
              }
          });

          if (allExpired) {
            console.log("Timeslot expired, showing modal");
            setPendingProduct(p);
            setShowModal(true);
            return;
          }
        }
      }
      console.log("Proceeding to executeAddToCart");
      addToCart(p.id, p.name, p.price, 1, "", [], 0, p.image, p.time_slot);
    }
  }, [navigation, deliveryDate, addToCart]);

  const handlePressProduct = useCallback((id) => {
    navigation.navigate("/p/:id", { id });
  }, [navigation]);

  const confirmTimeslotModal = useCallback(() => {
    if (pendingProduct) {
      if (setDeliveryDate) setDeliveryDate("tomorrow");
      addToCart(pendingProduct.id, pendingProduct.name, pendingProduct.price, 1, "", [], 0, pendingProduct.image, pendingProduct.time_slot);
    }
    setShowModal(false);
    setPendingProduct(null);
  }, [pendingProduct, setDeliveryDate, addToCart]);

  const closeTimeslotModal = () => {
    setShowModal(false);
    setPendingProduct(null);
  };

  const { 
    data: flashDeals = [], 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['flashDeals'],
    queryFn: async () => {
      const response = await get(flash_deal);
      if (response && response.flash_deals) return response.flash_deals;
      return [];
    }
  });

  useEffect(() => {
    if (!isFetching) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore if already hidden
      });
    }
  }, [isFetching]);

  const handleRefresh = async () => {
    await refetch();
  };

  const renderProduct = useCallback(({ item: p }) => {
    // keeping this empty or removing since we don't use it anymore on the home screen
  }, []);

  return (
    <View className="flex-1 bg-white">
      <View className="absolute top-0 left-0 right-0 h-[50vh] bg-green-700" />
      {/* Sticky Header */}
      <HeroWidget deliveryDate={deliveryDate} setDeliveryDate={setDeliveryDate} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Platform.OS === 'android' ? 200 : 160 }}
        refreshControl={
          <RefreshControl 
            refreshing={isFetching} 
            onRefresh={handleRefresh} 
            tintColor="#ffffff" 
          />
        }
      >
        <View className="bg-white flex-1" style={{ minHeight: '100%' }}>
          {/* Scrollable Blue Extension containing Date Toggle */}
          <View className="bg-green-700 rounded-b-[24px] px-4 pt-2 pb-5 z-10 flex-row items-center">
            <View className="bg-white p-1 rounded-full flex-row items-center h-12 relative flex-1">
              <View 
                className="absolute top-1 bottom-1 w-[49%] bg-green-50 rounded-full border border-green-100"
                style={{ left: deliveryDate === "today" ? '1%' : '50%' }}
              />
              
              {/* TAB HARI INI */}
              <TouchableOpacity 
                onPress={() => !isGlobalExpired && setDeliveryDate("today")}
                disabled={!!isGlobalExpired}
                className="flex-1 flex-row items-center justify-center h-full z-10"
                style={{ opacity: isGlobalExpired ? 0.4 : 1 }}
              >
                <Text className="text-lg mr-1.5">{isGlobalExpired ? '🚫' : '🚚'}</Text>
                <View className="justify-center">
                  <Text className={`text-[11.5px] ${deliveryDate === "today" && !isGlobalExpired ? "font-extrabold text-gray-800" : "font-semibold text-gray-400"}`}>Hari ini</Text>
                  <Text className="text-[8px] text-gray-400 font-medium">{isGlobalExpired ? 'Sudah tutup' : `Batas pkl ${maxEndTime}`}</Text>
                </View>
              </TouchableOpacity>
              
              {/* TAB BESOK */}
              <TouchableOpacity 
                onPress={() => setDeliveryDate("tomorrow")}
                className="flex-1 flex-row items-center justify-center h-full z-10"
              >
                <Text className="text-lg mr-1.5">📅</Text>
                <View className="justify-center">
                  <Text className={`text-[11.5px] ${deliveryDate === "tomorrow" ? "font-extrabold text-gray-800" : "font-semibold text-gray-500"}`}>Besok</Text>
                  <Text className="text-[8px] text-gray-400 font-medium">Pengiriman Pagi</Text>
                </View>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              onPress={() => setShowScheduleInfo(true)} 
              className="ml-3 w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <FontAwesome5 name="info-circle" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Live Banner dihapus sesuai permintaan */}

          <View className="py-3">
            <BannerWidget />
          </View>

          <View className="h-2 w-full bg-gray-100" />

          <View className="py-3 px-4">
            <CategoryWidget />
          </View>

          <View className="h-2 w-full bg-gray-100" />

          <View className="bg-white pt-5 pb-3 px-4">
            <Text className="text-sm font-extrabold text-gray-800">Flash Sale Spesial</Text>
          </View>

          <View className="w-full px-3 mb-6" style={{ minHeight: 200 }}>
            {isFetching && flashDeals.length === 0 ? (
              <View className="flex-row flex-wrap justify-between">
                <View className="w-[48%] h-32 bg-gray-100 rounded-xl mb-3 shadow-sm" />
                <View className="w-[48%] h-32 bg-gray-100 rounded-xl mb-3 shadow-sm" />
              </View>
            ) : flashDeals.length > 0 ? (
              <View className="flex-row flex-wrap justify-between">
                {flashDeals.map((deal) => {
                  const imgUrl = `${path_offer_img}/${deal.image}`;
                  return (
                    <TouchableOpacity
                      key={deal.id}
                      onPress={() => navigation.navigate("/flash-sale/:id", { id: deal.id, title: deal.title })}
                      className="w-[48%] h-32 bg-white rounded-xl mb-3 shadow-sm overflow-hidden"
                    >
                      <Image
                        source={imgUrl}
                        className="w-full h-full"
                        contentFit="cover"
                        transition={200}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View className="items-center justify-center py-6">
                <Text className="text-gray-400 text-xs">Belum ada promo Flash Sale saat ini.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Menu Anchor */}
      {/* <BottomMenu /> */}
      <View className="absolute bottom-0 w-full h-16 bg-white border-t border-gray-200 items-center justify-center">
        <Text className="text-gray-500 text-xs">BottomMenu Placeholder</Text>
      </View>

      <FloatingFreeDeliveryProgress />

      <TimeslotModal
        isOpen={showModal}
        onClose={closeTimeslotModal}
        onConfirm={confirmTimeslotModal}
        product={pendingProduct}
      />

      <BlankBottomSheet isOpen={showScheduleInfo} onClose={() => setShowScheduleInfo(false)}>
        <View className="p-6">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-xl font-bold text-gray-800">Informasi Pengiriman</Text>
            <TouchableOpacity onPress={() => setShowScheduleInfo(false)} className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
              <FontAwesome5 name="times" size={14} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View className="mb-5 bg-green-50 p-4 rounded-xl border border-green-100">
            <View className="flex-row items-center mb-2">
              <Text className="text-xl mr-2">🚚</Text>
              <Text className="text-lg font-bold text-gray-800">Hari Ini</Text>
            </View>
            <Text className="text-gray-600 text-sm leading-relaxed">
              Pesanan yang dibuat dengan jadwal "Hari Ini" akan dikirimkan pada hari yang sama. Pastikan Anda memesan sebelum batas waktu yang ditentukan yaitu pukul {maxEndTime}.
            </Text>
          </View>

          <View className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <View className="flex-row items-center mb-2">
              <Text className="text-xl mr-2">📅</Text>
              <Text className="text-lg font-bold text-gray-800">Besok</Text>
            </View>
            <Text className="text-gray-600 text-sm leading-relaxed">
              Pesanan dengan jadwal "Besok" akan diproses dan dikirimkan pada keesokan harinya di pagi hari. Sangat cocok untuk Anda yang ingin merencanakan belanjaan lebih awal tanpa terburu-buru.
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => setShowScheduleInfo(false)}
            className="w-full bg-green-600 py-3.5 rounded-xl items-center shadow-sm"
          >
            <Text className="text-white font-bold text-base">Mengerti</Text>
          </TouchableOpacity>
        </View>
      </BlankBottomSheet>
    </View>
  );
}
