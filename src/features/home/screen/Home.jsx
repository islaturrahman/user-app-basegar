import React, { useState, useEffect, useContext, useCallback } from "react";
import { View, Text, Image as RNImage, TouchableOpacity, ScrollView, Dimensions, Modal, Platform } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useInfiniteQuery } from "@tanstack/react-query";
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Contexts (Assumes these have been migrated)
import ProductsContext from "../../../context/ProductsContext";
import { ConfigContext } from "../../../provider/ConfigProvider";
import CartContext from "../../../context/CartContext";
// import DeliveryProvider from "../../delivery/provider/DeliveryProvider";

import HeroWidget from "../widget/HeroWidget";
import CategoryWidget from "../widget/CategoryWidget";
import BannerWidget from "../widget/BannerWidget";
import ProductCard from "../../../components/ProductCard";
import FloatingFreeDeliveryProgress from "../../cart/widget/FloatingFreeDeliveryProgress";
// import Footer from "../../address/footer";

// import { BottomMenu } from "../../../component/bottom_menu";
import TimeslotModal from "../../../components/TimeslotModal";

// Helper (Assumes a basic helper is available)
import { path_product_img } from "../../../config/enpoints";
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

  const inspirations = [
    { id: 1, title: "Promo\nCuci Gudang", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=150", bgColor: "bg-orange-500" },
    { id: 2, title: "Grill & Goal!", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=150", bgColor: "bg-teal-500" },
    { id: 3, title: "Ready, Set,\nSchool!", image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=150", bgColor: "bg-blue-600" },
    { id: 4, title: "Siap Siaga\nSekolah", image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=150", bgColor: "bg-cyan-500" }
  ];

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
      if (deliveryDate === "today" && p.time_slot && p.time_slot.end_time) {
        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, "0");
        const currentMinutes = now.getMinutes().toString().padStart(2, "0");
        const currentTime = `${currentHours}:${currentMinutes}:00`;

        if (currentTime > p.time_slot.end_time) {
          console.log("Timeslot expired, showing modal");
          setPendingProduct(p);
          setShowModal(true);
          return;
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
    data, 
    isFetching, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage, 
    refetch 
  } = useInfiniteQuery({
    queryKey: ['homeProducts', deliveryDate],
    queryFn: async ({ pageParam = 1 }) => {
      if (!fetchProducts) return [];
      const model = await fetchProducts({ page: pageParam, limit: 10 });
      return (model && typeof model.getProducts === 'function') 
        ? model.getProducts() 
        : (Array.isArray(model) ? model : []);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const products = data ? data.pages.flat() : [];

  const handleRefresh = async () => {
    await refetch();
  };

  const renderHeader = () => (
    <View className="bg-white relative z-0">
      {/* Bounce filler for pull-to-refresh */}
      <View className="absolute top-[-1000px] left-0 right-0 h-[1000px] bg-[#0461b4]" />
      
      {/* Scrollable Blue Extension containing Date Toggle */}
      <View className="bg-[#0461b4] rounded-b-[24px] px-4 pt-2 pb-5 z-10">
        <View className="bg-white p-1 rounded-full flex-row items-center h-12 relative">
          {/* Animated Background Pill representation */}
          <View 
            className="absolute top-1 bottom-1 w-[49%] bg-blue-50 rounded-full border border-blue-100"
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

      {/* Promo Grid Banners (Commented out temporarily) */}
      {/* 
      <View className="px-4 mt-3">
        <View className="flex-row justify-between mb-2">
          <TouchableOpacity className="w-[48%] h-28 rounded-xl bg-[#0c3b2e] p-2.5 flex-col justify-between overflow-hidden relative">
            <View className="absolute top-2 right-2 w-12 h-12 bg-white/10 rounded-full"></View>
            <View>
              <Text className="text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-black/20 self-start">⚡ Hanya Minggu Ini!</Text>
              <Text className="text-white text-[11px] font-extrabold mt-1">BACK TO SCHOOL PROTEIN BOOST!</Text>
            </View>
            <View className="flex-row justify-between items-end w-full">
               <Text className="bg-[#ea2b4c] text-white px-2 py-0.5 rounded-lg text-[9px] font-bold">Diskon s.d 16%</Text>
               <PromoImage src="" fallbackEmoji="🥩" bgColor="bg-red-50" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="w-[48%] h-28 rounded-xl bg-[#fbf5eb] p-2.5 flex-col justify-between overflow-hidden relative border border-orange-100">
            <View>
              <Text className="text-[9px] italic font-bold text-green-700">Kitchen</Text>
              <Text className="text-green-900 text-[11px] font-extrabold mt-1">MENU BEKAL SEKOLAH PRAKTIS!</Text>
            </View>
            <View className="flex-row justify-between items-end w-full">
               <Text className="bg-green-700 text-white px-2 py-0.5 rounded-lg text-[9px] font-bold">Diskon s.d 20%</Text>
               <PromoImage src="" fallbackEmoji="🥪" bgColor="bg-orange-50" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      */}

      {/* Inspirasi Untukmu (Commented out temporarily) */}
      {/* 
      <View className="px-4 mt-5 bg-white py-4 rounded-2xl mx-4 border border-gray-100 shadow-sm">
      ...
      </View>
      */}

      <View className="bg-white pt-5 pb-3 px-4">
        <Text className="text-sm font-extrabold text-gray-800">Produk Pilihan</Text>
      </View>
    </View>
  );

  const renderProduct = useCallback(({ item: p }) => {
    const cartItem = getCart()?.find(c => c.product_id === p.id);
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    return (
      <ProductCard 
        product={p}
        cartQuantity={cartQuantity}
        layoutType="home"
        onPress={handlePressProduct}
        onAdd={handleAddProduct}
        onIncrease={addQuantity}
        onDecrease={minQuantity}
      />
    );
  }, [getCart, handlePressProduct, handleAddProduct, addQuantity, minQuantity]);

  return (
    <View className="flex-1 bg-white">
      {/* Sticky Header */}
      <HeroWidget deliveryDate={deliveryDate} setDeliveryDate={setDeliveryDate} />
      
      <FlashList
        key={'3-columns'}
        data={products}
        extraData={cart}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        numColumns={3}
        estimatedItemSize={250}
        renderItem={renderProduct}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 200 : 160 }}
        showsVerticalScrollIndicator={false}
        refreshing={isFetching && !isFetchingNextPage}
        onRefresh={handleRefresh}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center justify-center">
              <Text className="text-gray-500 text-xs font-bold">Memuat...</Text>
            </View>
          ) : null
        }
      />
      
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
