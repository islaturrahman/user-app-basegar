import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import ProductsContext from "../../../context/ProductsContext";
import { get } from "../../../data/api";
import { path_product_img, get_popular_products, get_most_reviewed_products } from "../../../config/enpoints";

const SearchProducts = ({ onClose }) => {
  const navigation = useNavigation();
  const { getSearchProducts } = useContext(ProductsContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [popularProducts, setPopularProducts] = useState([]);
  const [topReviewedProducts, setTopReviewedProducts] = useState([]);
  const [loadingDefault, setLoadingDefault] = useState(true);

  // Fetch popular & most reviewed on mount
  useEffect(() => {
    const loadDefaults = async () => {
      setLoadingDefault(true);
      try {
        const [popularRes, reviewedRes] = await Promise.all([
          get(`${get_popular_products}?limit=12&offset=1`),
          get(`${get_most_reviewed_products}?limit=6&offset=1`)
        ]);
        if (popularRes?.products) setPopularProducts(popularRes.products);
        else if (Array.isArray(popularRes)) setPopularProducts(popularRes);

        if (reviewedRes?.products) setTopReviewedProducts(reviewedRes.products);
        else if (Array.isArray(reviewedRes)) setTopReviewedProducts(reviewedRes);
      } catch (e) {
        console.error("Failed to load default search data:", e);
      } finally {
        setLoadingDefault(false);
      }
    };
    loadDefaults();
  }, []);

  // Search debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        setHasSearched(true);
        try {
          const res = await getSearchProducts(searchQuery);
          if (res?.products) setSearchResults(res.products);
          else if (Array.isArray(res)) setSearchResults(res);
          else setSearchResults([]);
        } catch (error) {
          console.error(error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const toRupiah = (price) => `Rp ${Number(price).toLocaleString('id-ID')}`;

  const renderProductImage = (imageStr) => {
    if (Array.isArray(imageStr)) imageStr = imageStr[0];
    else if (typeof imageStr === 'string' && imageStr.startsWith('[')) {
      try { imageStr = JSON.parse(imageStr)[0]; } catch(e) {}
    }
    return typeof imageStr === 'string' && imageStr
      ? (imageStr.startsWith("http") ? { uri: imageStr } : { uri: `${path_product_img}/${imageStr}` })
      : { uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150" };
  };

  const renderStars = (rating) => {
    const stars = Math.round(Number(rating || 0));
    return "★".repeat(stars) + "☆".repeat(5 - stars);
  };

  return (
    <View className="flex-1 items-center bg-black/50">
      <SafeAreaView 
        className="flex-1 bg-white w-full" 
        style={{ paddingTop: Platform.OS == 'ios' ? 40 : 0, maxWidth: Platform.OS === 'web' ? 600 : '100%' }}
      >
      {/* Search Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 mt-2">
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2 h-10">
          <FontAwesome5 name="search" size={14} color="#6b7280" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-800"
            placeholder="Cari beragam kebutuhan harian"
            autoFocus
            style={{ paddingVertical: 0 }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={onClose} className="ml-4">
          <Text className="text-[#0461b4] font-bold text-[14px]">Batal</Text>
        </TouchableOpacity>
      </View>

      {isSearching ? (
        <View className="flex-1 py-10 items-center justify-center">
          <ActivityIndicator size="large" color="#0461b4" />
          <Text className="text-gray-500 mt-3 text-sm">Mencari produk...</Text>
        </View>
      ) : hasSearched ? (
        // ── SEARCH RESULTS (Optimized using FlatList) ──
        <FlatList
          className="flex-1 px-4 pt-5"
          data={searchResults}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={
            <Text className="text-base font-bold text-gray-700 mb-4">
              {searchResults.length} hasil untuk &quot;{searchQuery}&quot;
            </Text>
          }
          ListEmptyComponent={
            <View className="py-10 items-center justify-center">
              <Ionicons name="search-outline" size={40} color="#d1d5db" />
              <Text className="text-gray-400 text-center mt-2">Produk tidak ditemukan</Text>
            </View>
          }
          renderItem={({ item: p }) => (
            <TouchableOpacity
              className="flex-row items-center bg-white p-3 mb-3 rounded-xl border border-gray-100 shadow-sm"
              onPress={() => { onClose(); navigation.navigate("/p/:id", { id: p.id }); }}
            >
              <View className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden mr-3 border border-gray-100">
                <Image source={renderProductImage(p.image)} className="w-full h-full" resizeMode="contain" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-gray-800 mb-0.5" numberOfLines={2}>{p.name}</Text>
                <Text className="text-[10px] text-gray-400 mb-1">{p.unit || ""}</Text>
                <Text className="text-sm font-black text-green-700">{toRupiah(p.price)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        // ── DEFAULT STATE (input kosong) ──
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {loadingDefault ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#0461b4" />
            </View>
          ) : (
            <>
              {/* POPULAR PRODUCTS – Chips */}
              {popularProducts.length > 0 && (
                <View className="mt-5">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-base font-extrabold text-gray-900">🔥 Produk Populer</Text>
                  </View>
                  <View className="flex-row flex-wrap">
                    {popularProducts.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        className="flex-row items-center bg-gray-50 border border-gray-200 rounded-full pl-1 pr-3 py-1 mr-2 mb-2"
                        onPress={() => { onClose(); navigation.navigate("/p/:id", { id: p.id }); }}
                      >
                        <View className="w-7 h-7 rounded-full overflow-hidden bg-white border border-gray-100 mr-1.5">
                          <Image
                            source={renderProductImage(p.image)}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        </View>
                        <Text className="text-xs font-semibold text-gray-700" numberOfLines={1}>
                          {p.name?.split(" ").slice(0, 3).join(" ")}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* TOP REVIEWED – List dengan rating */}
              {topReviewedProducts.length > 0 && (
                <View className="mt-6 mb-10">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-base font-extrabold text-gray-900">⭐ Rating Terbaik</Text>
                  </View>
                  {topReviewedProducts.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      className="flex-row items-center bg-white border border-gray-100 rounded-xl p-3 mb-3 shadow-sm"
                      onPress={() => { onClose(); navigation.navigate("/p/:id", { id: p.id }); }}
                    >
                      <View className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden mr-3 border border-gray-100">
                        <Image source={renderProductImage(p.image)} className="w-full h-full" resizeMode="contain" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-gray-800 mb-0.5" numberOfLines={1}>{p.name}</Text>
                        <Text className="text-[10px] text-amber-500 mb-1 font-bold tracking-widest">
                          {renderStars(p.rating)}
                          <Text className="text-gray-400 font-normal tracking-normal"> ({p.rating_count || 0})</Text>
                        </Text>
                        <Text className="text-sm font-black text-green-700">{toRupiah(p.price)}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  </View>
  );
};

export default SearchProducts;
