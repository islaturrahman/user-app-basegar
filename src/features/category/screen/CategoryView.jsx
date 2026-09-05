import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Modal, Image as RNImage, RefreshControl, Platform, InteractionManager } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Image } from "expo-image";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import CartContext from "../../../context/CartContext";
import ProductsContext from "../../../context/ProductsContext";
import TimeslotModal from "../../../components/TimeslotModal";
import ImageWithSkeleton from "../../../components/ImageWithSkeleton";
import ProductCard from "../../../components/ProductCard";
import FloatingFreeDeliveryProgress from "../../cart/widget/FloatingFreeDeliveryProgress";
import SearchProducts from "../../home/screen/SearchProducts";

import { path_product_img, path_category_img, path_category_banner_img, base_url, category as category_endpoint, category_childs, category_products_all } from "../../../config/enpoints";
import { get } from "../../../data/api";
import { TimeSlotContext } from "../../../features/checkout/provider/TimeSlotProvider";

const { width } = Dimensions.get('window');
const toRupiah = (price) => `Rp ${(Number(price) || 0).toLocaleString('id-ID')}`;

const CategoryBanner = ({ categoryName, bannerImage }) => {
  const [imgError, setImgError] = useState(false);

  const getFullBannerUrl = (img) => {
    if (!img || img === "def.png") return null;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return `${path_category_banner_img}/${img}`;
  };

  const customBannerSrc = getFullBannerUrl(bannerImage);

  if (customBannerSrc && !imgError) {
    return (
      <View className="w-full rounded-2xl overflow-hidden shadow-sm h-32 relative mb-4 bg-gray-100">
        <ImageWithSkeleton
          source={{ uri: customBannerSrc }}
          style={{ width: '100%', height: '100%' }}
          className="rounded-2xl"
          onError={() => setImgError(true)}
          resizeMode="cover"
        />
      </View>
    );
  }

  const bannerInfo = {
    sayuran: {
      title: "Porsi Baru!", subtitle: "Pas Untuk Kebutuhanmu!", tag1: "100% Fresh", tag2: "Porsi kecil", action: "Klik di sini", bgClass: "bg-[#1b9a47]", img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=250"
    },
    buah: {
      title: "Buah Pilihan!", subtitle: "Segar & Penuh Vitamin C", tag1: "Lokal & Impor", tag2: "Manis", action: "Pesan", bgClass: "bg-[#ef6c00]", img: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&q=80&w=250"
    },
    daging: {
      title: "Daging Premium!", subtitle: "Potongan Segar & Bersih", tag1: "Higenis", tag2: "Halal", action: "Beli Daging", bgClass: "bg-[#c62828]", img: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=250"
    },
    seafood: {
      title: "Seafood Tangkapan!", subtitle: "Segar dari Laut Langsung", tag1: "Tanpa Pengawet", tag2: "Beku Segar", action: "Beli Seafood", bgClass: "bg-[#1565c0]", img: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&q=80&w=250"
    }
  };

  const key = categoryName?.toLowerCase() || "";
  let match = null;
  for (const k in bannerInfo) {
    if (key.includes(k)) {
      match = bannerInfo[k];
      break;
    }
  }

  if (!match) {
    return (
      <View className="w-full bg-[#388e3c] rounded-2xl p-4 flex-row justify-between items-center shadow-sm h-28 overflow-hidden relative mb-4">
        <View className="z-10 w-[65%]">
          <Text className="text-base font-bold text-white">{categoryName || "Produk Pilihan"}</Text>
          <Text className="text-[10px] text-white/80 font-light mt-1">Kualitas segar terbaik langsung ke rumah Anda</Text>
        </View>
        <View className="absolute right-0 top-0 bottom-0 w-[40%] opacity-30">
          <Image source="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200" className="w-full h-full" contentFit="cover" />
        </View>
      </View>
    );
  }

  return (
    <View className={`w-full ${match.bgClass} rounded-2xl p-3 text-white flex-row justify-between items-center shadow-sm h-32 overflow-hidden relative mb-4`}>
      <View className="absolute top-2 left-6 w-1 h-1 bg-white opacity-40 rounded-full" />
      <View className="absolute bottom-2 left-12 w-2 h-2 bg-yellow-300 opacity-30 rounded-full" />

      <View className="z-10 flex-col justify-between h-full w-[60%]">
        <View>
          <Text className="text-lg font-extrabold text-white tracking-tight">{match.title}</Text>
          <Text className="text-[10px] text-white/95 font-light mt-0.5 leading-tight">{match.subtitle}</Text>
        </View>
        <View className="flex-row flex-wrap mt-1.5">
          <View className="bg-white/20 px-2 py-0.5 rounded-full mr-1 mb-1">
             <Text className="text-[7.5px] font-bold text-white uppercase">🌿 {match.tag1}</Text>
          </View>
          <View className="bg-white/20 px-2 py-0.5 rounded-full mb-1">
             <Text className="text-[7.5px] font-bold text-white uppercase">🍎 {match.tag2}</Text>
          </View>
        </View>
      </View>

      <View className="w-[35%] h-full flex-col justify-between items-end z-10 pt-1 pb-1">
        <View className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-sm bg-white">
          <Image source={match.img} className="w-full h-full" contentFit="cover" transition={200} />
        </View>
        <View className="bg-yellow-400 px-2 py-0.5 rounded-full shadow-sm mt-1 items-center justify-center">
          <Text className="text-green-950 text-[9px] font-black">{match.action}</Text>
        </View>
      </View>
    </View>
  );
};

export default function CategoryView() {
  const navigation = useNavigation();
  const route = useRoute();
  const category_id = route.params?.category_id || 10;
  
  const { cart, getCart, addToCart, addQuantity, minQuantity } = useContext(CartContext) || {};
  const { deliveryDate, setDeliveryDate } = useContext(ProductsContext) || {};
  const { timeslot } = useContext(TimeSlotContext) || {};

  const flashListRef = useRef(null);

  const [active, setActive] = useState(false); // false = "Semua"
  const [isTopSheetOpen, setIsTopSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [masterTimeSlots, setMasterTimeSlots] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const { isGlobalExpired } = useContext(TimeSlotContext) || {};
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => {
      task.cancel();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const loadMasterTimeSlots = async () => {
      try {
        const stored = await AsyncStorage.getItem("timeslot");
        if (stored) {
          setMasterTimeSlots(JSON.parse(stored));
        } else {
          // If not in storage, fetch from API directly
          const resp = await get("/api/v1/timeSlot");
          if (resp) setMasterTimeSlots(resp);
        }
      } catch (e) {
        console.error("Error loading master timeslots", e);
      }
    };
    loadMasterTimeSlots();
  }, []);

  // Fallbacks
  const fallbackCategories = [
    { id: 10, name: "Sembako", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=150" },
    { id: 12, name: "Buah", image: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&q=80&w=150" },
    { id: 1, name: "Sayur", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=150" },
    { id: 8, name: "Daging", image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=150" },
    { id: 3, name: "Ikan", image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&q=80&w=150" }
  ];

  const getCategoryImageUrl = (img) => {
    if (!img || img === "def.png") return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return `${path_category_img}/${img}`;
  };

  const { data: allCategories = fallbackCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(`${base_url}${category_endpoint}`);
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
    enabled: isReady
  });

  const { data: subCategories = [] } = useQuery({
    queryKey: ['subcategories', category_id],
    queryFn: async () => {
      const res = await fetch(`${base_url}${category_childs}/${category_id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!category_id && isReady
  });

  const targetFetchId = (active !== false && typeof subCategories[active]?.id === "number")
    ? subCategories[active].id
    : category_id;

  const { 
    data: fetchedData, 
    isLoading: loadingProducts, 
    isFetching: isFetchingProducts,
    isFetchingNextPage: isFetchingNextProducts,
    hasNextPage: hasNextProducts,
    fetchNextPage: fetchNextProducts,
    refetch: refetchProducts 
  } = useInfiniteQuery({
    queryKey: ['products', targetFetchId, deliveryDate],
    queryFn: async ({ pageParam = 1 }) => {
      let endpoint = deliveryDate 
        ? `${category_products_all}/${targetFetchId}/all?delivery_date=${deliveryDate}`
        : `${category_products_all}/${targetFetchId}/all`;
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
    enabled: !!targetFetchId && isReady
  });

  const fetchedProducts = fetchedData ? fetchedData.pages.flat() : [];

  const displayCategories = allCategories.length > 0 ? allCategories.map(cat => ({
    ...cat,
    image: getCategoryImageUrl(cat.image)
  })) : fallbackCategories;

  const currentCategory = displayCategories.find(c => String(c.id) === String(category_id)) || displayCategories[0];
  const displaySubcategories = subCategories;

  const handleClickCategoryChild = (id, index) => {
    setActive(index);
    flashListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const getFilteredProducts = () => {
    const listToFilter = fetchedProducts || [];
    let filtered = listToFilter;

    if (active !== false) {
      const subcat = displaySubcategories[active];
      if (subcat && typeof subcat.id !== "number") {
        // Local filtering
        const keyword = subcat.id;
        filtered = listToFilter.filter((product) => {
          const name = product.name?.toLowerCase() || "";
          if (keyword === "sayuran-daun") {
            return name.includes("daun") || name.includes("bayam") || name.includes("kangkung") || name.includes("sawi");
          }
          if (keyword === "bumbu-dapur") {
            return name.includes("bawang") || name.includes("cabai") || name.includes("cabe") || name.includes("serai") || name.includes("sereh");
          }
          if (keyword === "rempah") {
            return name.includes("rempah") || name.includes("jahe") || name.includes("kunyit") || name.includes("kencur") || name.includes("lengkuas");
          }
          if (keyword === "umbi-kacang") {
            return name.includes("kentang") || name.includes("wortel") || name.includes("kacang") || name.includes("singkong") || name.includes("tomat");
          }
          if (keyword === "jamur") {
            return name.includes("jamur") || name.includes("mushroom");
          }
          if (keyword === "buah-tropis") {
            return name.includes("pisang") || name.includes("mangga") || name.includes("nanas") || name.includes("pepaya") || name.includes("alpukat");
          }
          if (keyword === "apel-pir") {
            return name.includes("apel") || name.includes("apple") || name.includes("pir") || name.includes("pear");
          }
          if (keyword === "jeruk") {
            return name.includes("jeruk") || name.includes("orange") || name.includes("lemon") || name.includes("lime");
          }
          if (keyword === "alpukat") {
            return name.includes("alpukat") || name.includes("avocado");
          }
          return true;
        });
      }
    }

    // Hydrate time_slot from time_slot_id using timeslots array
    return filtered.map(product => {
      let p = { ...product };
      
      // First, try standard fallback parsing if time_slot exists
      if (p.time_slot && typeof p.time_slot === 'string') {
        try { p.time_slot = JSON.parse(p.time_slot); } catch (e) { p.time_slot = null; }
      }
      // Jika time_slot adalah array, biarkan utuh — ProductCard/CartListItem handle array

      // If time_slot is still null/undefined but time_slot_id exists, hydrate it!
      if (!p.time_slot && p.time_slot_id && masterTimeSlots && masterTimeSlots.length > 0) {
        const foundTimeslot = masterTimeSlots.find(t => String(t.id) === String(p.time_slot_id));
        if (foundTimeslot) {
          p.time_slot = foundTimeslot;
        }
      }
      return p;
    });
  };

  const filteredProducts = React.useMemo(() => {
    return getFilteredProducts();
  }, [fetchedProducts, active, displaySubcategories, masterTimeSlots]);

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
        tick={tick}
      />
    );
  }, [getCart, handlePressProduct, handleAddProduct, addQuantity, minQuantity, isGlobalExpired, tick]);

  return (
    <View className="flex-1 bg-white">
      {/* Top Header */}
      <View className={`bg-white border-b border-gray-100 px-3 py-2 flex-row items-center justify-between z-50 ${Platform.OS === 'web' ? 'pt-4' : 'pt-12'}`}>
        
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="w-9 h-9 items-center justify-center bg-gray-50 rounded-full"
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>

        <View className="flex-1 mx-2 relative">
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setIsSearchOpen(true)}
            className="flex-row items-center bg-gray-100 rounded-full py-1.5 px-3.5 h-9"
          >
            <Text className="text-sm mr-1.5">🍊</Text>
            <Text className="text-gray-400 text-[11px] flex-1">Cari beragam kebutuhan harian</Text>
            <Ionicons name="search" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => navigation.navigate("/cart")}
          className="items-center justify-center w-9 h-9 rounded-full relative"
        >
          <Ionicons name="cart-outline" size={24} color="#374151" />
          {getCart && getCart().length > 0 && (
            <View className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 items-center justify-center border border-white">
              <Text className="text-white text-[8px] font-black">{getCart().length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Horizontal Strip */}
      <View className="bg-white border-b border-gray-100 flex-row h-[90px]">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 py-3 px-3">
          {displayCategories.map((cat, idx) => {
            const isCatActive = String(cat.id) === String(category_id);
            return (
              <TouchableOpacity 
                key={cat.id || idx}
                onPress={() => navigation.navigate("/categories/:category_id", { category_id: cat.id })}
                className="flex-col items-center mr-4"
              >
                <View className={`w-11 h-11 rounded-full overflow-hidden border items-center justify-center ${isCatActive ? "border-green-600 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
                  <Image source={cat.image} className="w-full h-full" contentFit="cover" transition={200} />
                </View>
                <View className="mt-1 items-center justify-center">
                  {isCatActive ? (
                    <View className="bg-green-700 rounded-full px-2 py-0.5">
                      <Text className="text-white text-[9px] font-bold">{cat.name}</Text>
                    </View>
                  ) : (
                    <Text className="text-gray-500 text-[9px] font-medium">{cat.name}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity 
          onPress={() => setIsTopSheetOpen(true)}
          className="bg-white items-center justify-center px-3 border-l border-gray-50 pt-2 pb-2 shadow-l"
        >
          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center border border-gray-200">
            <Ionicons name="grid-outline" size={18} color="#4b5563" />
          </View>
          <Text className="text-gray-500 text-[8.5px] font-medium mt-1">Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      {/* Main layout container (Left Sidebar + Right Panel) */}
      <View className="flex-1 flex-row bg-white">
        {/* Left Sidebar */}
        <ScrollView className="w-[24%] bg-[#f7f9fa] border-r border-gray-100 py-2">
          <TouchableOpacity
            onPress={() => {
              setActive(false);
              flashListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }}
            className={`w-full py-3 px-2 flex-row items-center border-l-4 ${active === false ? "bg-white border-green-700" : "border-transparent"}`}
          >
            <Text className={`text-[11px] ${active === false ? "font-bold text-green-700" : "font-medium text-gray-500"}`}>Semua</Text>
          </TouchableOpacity>

          {loadingProducts ? (
            Array.from({ length: 7 }).map((_, idx) => (
              <View key={`skel-${idx}`} className="w-full py-4 px-3 flex-row items-center border-l-4 border-transparent">
                <View className="w-full h-3 bg-gray-200 rounded-sm" />
              </View>
            ))
          ) : (
            displaySubcategories.map((item, idx) => {
              const isSubActive = active === idx;
              return (
                <TouchableOpacity
                  key={item.id || idx}
                  onPress={() => handleClickCategoryChild(item.id, idx)}
                  className={`w-full py-3 px-2 flex-row items-center border-l-4 ${isSubActive ? "bg-white border-green-700" : "border-transparent"}`}
                >
                  <Text numberOfLines={2} className={`text-[10px] ${isSubActive ? "font-bold text-green-700" : "font-medium text-gray-500"}`}>{item.name}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Right Panel */}
        <View className="w-[76%] bg-white p-3 content-container">
          <FlashList
            ref={flashListRef}
            key={'category-products'}
            data={loadingProducts ? [] : filteredProducts}
            extraData={{ cart, isGlobalExpired, deliveryDate, tick }}
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
            ListHeaderComponent={
              <>
                <CategoryBanner categoryName={currentCategory?.name} bannerImage={currentCategory?.banner} />
                <View className="bg-gray-50 py-1.5 px-3 rounded-lg mb-3 self-start">
                  <Text className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                    {active === false ? "Semua" : displaySubcategories[active]?.name}
                  </Text>
                </View>
              </>
            }
            ListEmptyComponent={
              loadingProducts ? (
                <View className="flex-row flex-wrap justify-between">
                  <View className="w-[48%] h-44 bg-gray-100 rounded-2xl mb-3" />
                  <View className="w-[48%] h-44 bg-gray-100 rounded-2xl mb-3" />
                </View>
              ) : (
                <View className="items-center justify-center py-10">
                  <Text className="text-[10px] text-gray-400 font-medium">Tidak ada produk dalam kategori ini.</Text>
                </View>
              )
            }
            ListFooterComponent={
              isFetchingNextProducts ? (
                <View className="w-full flex-row flex-wrap justify-between mt-2 px-1">
                  <View className="w-[48%] h-48 bg-gray-100 rounded-2xl mb-3 overflow-hidden">
                    <View className="w-full h-[60%] bg-gray-200" />
                    <View className="p-2">
                      <View className="w-3/4 h-3 bg-gray-200 rounded mb-2" />
                      <View className="w-1/2 h-3 bg-gray-200 rounded" />
                    </View>
                  </View>
                  <View className="w-[48%] h-48 bg-gray-100 rounded-2xl mb-3 overflow-hidden">
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
      </View>

      {/* Top Sheet Modal (Lihat Semua) */}
      <Modal visible={isTopSheetOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setIsTopSheetOpen(false)} className="flex-1 bg-black/60 items-center">
          <View 
            className="bg-white rounded-b-3xl shadow-xl overflow-hidden pt-[90px] w-full"
            style={{ maxWidth: Platform.OS === 'web' ? 600 : '100%' }}
          >
            <View className="flex-row flex-wrap p-4">
              {displayCategories.map((cat, idx) => {
                const isCatActive = String(cat.id) === String(category_id);
                return (
                  <TouchableOpacity
                    key={cat.id || idx}
                    onPress={() => {
                      navigation.navigate("/categories/:category_id", { category_id: cat.id });
                      setIsTopSheetOpen(false);
                    }}
                    className="w-[20%] items-center mb-4"
                  >
                    <View className={`w-11 h-11 rounded-full overflow-hidden border items-center justify-center ${isCatActive ? "border-green-600 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
                      <Image source={cat.image} className="w-full h-full" contentFit="cover" transition={200} />
                    </View>
                    <View className="mt-1 items-center justify-center h-6">
                      {isCatActive ? (
                        <View className="bg-green-700 rounded-full px-1.5 py-0.5">
                          <Text className="text-white text-[8px] font-bold text-center" numberOfLines={1}>{cat.name}</Text>
                        </View>
                      ) : (
                        <Text className="text-gray-500 text-[8px] font-medium text-center" numberOfLines={2}>{cat.name}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={() => setIsTopSheetOpen(false)} className="w-full py-3 bg-gray-50 border-t border-gray-100 items-center justify-center flex-row">
              <Text className="text-[10px] text-gray-500 font-bold mr-1">Tutup</Text>
              <Ionicons name="chevron-up" size={12} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <FloatingFreeDeliveryProgress isCategory={true} />

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

      {/* Modal Search Products */}
      <Modal
        visible={isSearchOpen}
        animationType="slide"
        onRequestClose={() => setIsSearchOpen(false)}
      >
        <SearchProducts onClose={() => setIsSearchOpen(false)} />
      </Modal>
    </View>
  );
}
