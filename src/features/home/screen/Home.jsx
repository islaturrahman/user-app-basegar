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
// import DeliveryProvider from "../../delivery/provider/DeliveryProvider";
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

  // page state removed as useInfiniteQuery handles it
  const [showModal, setShowModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);



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
      try {
        const response = await get(flash_deal);
        if (response && response.flash_deals) return response.flash_deals;
        return [];
      } catch (err) {
        console.log(err);
        return [];
      }
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
          <View className="bg-green-700 rounded-b-[24px] px-4 pt-2 pb-5 z-10">
            <View className="bg-white p-1 rounded-full flex-row items-center h-12 relative">
              <View 
                className="absolute top-1 bottom-1 w-[49%] bg-green-50 rounded-full border border-green-100"
                style={{ left: deliveryDate === "today" ? '1%' : '50%' }}
              />
              
              <TouchableOpacity 
                onPress={() => setDeliveryDate("today")}
                className="flex-1 flex-row items-center justify-center h-full z-10"
              >
                <Text className="text-lg mr-1.5">🚚</Text>
                <View className="justify-center">
                  <Text className={`text-[11.5px] ${deliveryDate === "today" ? "font-extrabold text-gray-800" : "font-semibold text-gray-500"}`}>Hari ini</Text>
                  <Text className="text-[8px] text-gray-400 font-medium">Batas pkl 17:00</Text>
                </View>
              </TouchableOpacity>
              
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
          </View>

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
                      onPress={() => navigation.navigate("/flash-sale/:id", { id: deal.id })}
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
    </View>
  );
}
