import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, Platform, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import CartContext from "../../../context/CartContext";
import ProductsContext from "../../../context/ProductsContext";
import TimeslotModal from "../../../components/TimeslotModal";
import ProductCard from "../../../components/ProductCard";
import FloatingFreeDeliveryProgress from "../../cart/widget/FloatingFreeDeliveryProgress";

import { base_url, flash_deal } from "../../../config/enpoints";
import { get } from "../../../data/api";
import { TimeSlotContext } from "../../../features/checkout/provider/TimeSlotProvider";

export default function FlashSaleView() {
  const navigation = useNavigation();
  const route = useRoute();
  const flash_deal_id = route.params?.id;
  
  const { cart, getCart, addToCart, addQuantity, minQuantity } = useContext(CartContext) || {};
  const { deliveryDate, setDeliveryDate } = useContext(ProductsContext) || {};
  const { timeslot } = useContext(TimeSlotContext) || {};

  const flashListRef = useRef(null);
  const [masterTimeSlots, setMasterTimeSlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const { isGlobalExpired } = useContext(TimeSlotContext) || {};

  useEffect(() => {
    const loadMasterTimeSlots = async () => {
      try {
        const stored = await AsyncStorage.getItem("timeslot");
        if (stored) {
          setMasterTimeSlots(JSON.parse(stored));
        } else {
          const resp = await get("/api/v1/timeSlot");
          if (resp) setMasterTimeSlots(resp);
        }
      } catch (e) {
        console.error("Error loading master timeslots", e);
      }
    };
    loadMasterTimeSlots();
  }, []);

  const { 
    data: fetchedData, 
    isLoading: loadingProducts, 
    isFetching: isFetchingProducts,
    isFetchingNextPage: isFetchingNextProducts,
    hasNextPage: hasNextProducts,
    fetchNextPage: fetchNextProducts,
    refetch: refetchProducts 
  } = useInfiniteQuery({
    queryKey: ['flashSaleProducts', flash_deal_id, deliveryDate],
    queryFn: async ({ pageParam = 1 }) => {
      // The endpoint we created: /api/v1/flash-deals/products/{flash_deal_id}
      let endpoint = `${flash_deal}/products/${flash_deal_id}`;
      const sep = endpoint.includes("?") ? "&" : "?";
      endpoint += `${sep}offset=${pageParam}&limit=10`;
      
      const json = await get(endpoint);
      if (Array.isArray(json)) return json;
      if (json && Array.isArray(json.products)) return json.products;
      if (json && Array.isArray(json.data)) return json.data;
      return [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return (lastPage && lastPage.length === 10) ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!flash_deal_id
  });

  const fetchedProducts = fetchedData ? fetchedData.pages.flat() : [];

  const getFilteredProducts = () => {
    const listToFilter = fetchedProducts || [];
    
    // Hydrate time_slot from time_slot_id using timeslots array
    return listToFilter.map(product => {
      let p = { ...product };
      if (p.time_slot && typeof p.time_slot === 'string') {
        try { p.time_slot = JSON.parse(p.time_slot); } catch (e) { p.time_slot = null; }
      }
      // Jika time_slot adalah array, biarkan utuh — ProductCard/CartListItem handle array
      if (!p.time_slot && p.time_slot_id && masterTimeSlots && masterTimeSlots.length > 0) {
        const foundTimeslot = masterTimeSlots.find(t => String(t.id) === String(p.time_slot_id));
        if (foundTimeslot) p.time_slot = foundTimeslot;
      }
      return p;
    });
  };

  const filteredProducts = getFilteredProducts();

  const handleAddProduct = useCallback(async (product) => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      navigation.navigate("/login");
      return;
    }
    const stock = product.total_stock !== undefined ? product.total_stock : 10;
    if (stock > 0) {
      if (deliveryDate === "today" && product.time_slot && product.time_slot.end_time) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:00`;
        if (currentTime > product.time_slot.end_time) {
          setPendingProduct(product);
          setShowModal(true);
          return;
        }
      }
      const img = Array.isArray(product.image) ? product.image[0] : (typeof product.image === "string" && product.image.startsWith("[") ? JSON.parse(product.image)[0] : product.image);
      if(addToCart) addToCart(product.id, product.name, Number(product.price) || 0, 1, "", [], 0, img, product.time_slot);
    }
  }, [navigation, deliveryDate, addToCart]);

  const handlePressProduct = useCallback((id) => {
    navigation.navigate("/p/:id", { id });
  }, [navigation]);

  const renderProduct = useCallback(({ item: p }) => {
    const cartItem = getCart ? getCart().find(item => item.product_id === p.id) : null;
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    return (
      <ProductCard 
        product={p}
        cartQuantity={cartQuantity}
        layoutType="category"
        onPress={handlePressProduct}
        onAdd={handleAddProduct}
        onIncrease={addQuantity}
        onDecrease={minQuantity}
        isGlobalExpired={isGlobalExpired}
      />
    );
  }, [getCart, handlePressProduct, handleAddProduct, addQuantity, minQuantity, isGlobalExpired]);

  return (
    <View className="flex-1 bg-white">
      {/* Top Header */}
      <View className={`bg-white border-b border-gray-100 px-3 py-2 flex-row items-center justify-between z-50 ${Platform.OS === 'web' ? 'pt-4' : 'pt-12'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="items-center justify-center w-8 h-8 rounded-full">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <View className="flex-1 mx-2">
          <Text className="text-sm font-bold text-gray-800 text-center">
            {route.params?.title || "Flash Sale"}
          </Text>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("/cart")} className="items-center justify-center w-9 h-9 rounded-full relative">
          <Ionicons name="cart-outline" size={24} color="#374151" />
          {getCart && getCart().length > 0 && (
            <View className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 items-center justify-center border border-white">
              <Text className="text-white text-[8px] font-black">{getCart().length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <View className="flex-1 bg-gray-50 p-3 content-container">
        <FlashList
          ref={flashListRef}
          key={'flash-sale-products'}
          data={loadingProducts ? [] : filteredProducts}
          keyExtractor={(item, idx) => (item.id || idx).toString()}
          numColumns={2}
          estimatedItemSize={250}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 120 : 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetchingProducts && !loadingProducts && !isFetchingNextProducts}
              onRefresh={refetchProducts}
              colors={["#16a34a"]}
            />
          }
          onEndReached={() => {
            if (hasNextProducts && !isFetchingNextProducts) {
              fetchNextProducts();
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            loadingProducts ? (
              <View className="flex-row flex-wrap justify-between">
                <View className="w-[48%] h-44 bg-white rounded-2xl mb-3 shadow-sm" />
                <View className="w-[48%] h-44 bg-white rounded-2xl mb-3 shadow-sm" />
                <View className="w-[48%] h-44 bg-white rounded-2xl mb-3 shadow-sm" />
                <View className="w-[48%] h-44 bg-white rounded-2xl mb-3 shadow-sm" />
              </View>
            ) : (
              <View className="items-center justify-center py-10">
                <Text className="text-[12px] text-gray-400 font-medium">Tidak ada produk dalam Flash Sale ini.</Text>
              </View>
            )
          }
          ListFooterComponent={
            isFetchingNextProducts ? (
              <View className="w-full flex-row flex-wrap justify-between mt-2 px-1">
                <View className="w-[48%] h-48 bg-white shadow-sm rounded-2xl mb-3 overflow-hidden">
                  <View className="w-full h-[60%] bg-gray-200" />
                  <View className="p-2">
                    <View className="w-3/4 h-3 bg-gray-200 rounded mb-2" />
                    <View className="w-1/2 h-3 bg-gray-200 rounded" />
                  </View>
                </View>
                <View className="w-[48%] h-48 bg-white shadow-sm rounded-2xl mb-3 overflow-hidden">
                  <View className="w-full h-[60%] bg-gray-200" />
                  <View className="p-2">
                    <View className="w-3/4 h-3 bg-gray-200 rounded mb-2" />
                    <View className="w-1/2 h-3 bg-gray-200 rounded" />
                  </View>
                </View>
              </View>
            ) : null
          }
          renderItem={renderProduct}
        />
      </View>

      <FloatingFreeDeliveryProgress />

      <TimeslotModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => {
          if (pendingProduct) {
            if(setDeliveryDate) setDeliveryDate("tomorrow");
            const img = Array.isArray(pendingProduct.image) ? pendingProduct.image[0] : (typeof pendingProduct.image === "string" && pendingProduct.image.startsWith("[") ? JSON.parse(pendingProduct.image)[0] : pendingProduct.image);
            if(addToCart) addToCart(pendingProduct.id, pendingProduct.name, Number(pendingProduct.price) || 0, 1, "", [], 0, img, pendingProduct.time_slot);
          }
          setShowModal(false);
        }}
        product={pendingProduct}
      />
    </View>
  );
}
