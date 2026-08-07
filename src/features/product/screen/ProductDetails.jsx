import React, { useContext, useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Platform, Dimensions } from "react-native";
import ImageWithSkeleton from "../../../components/ImageWithSkeleton";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Ionicons } from '@expo/vector-icons';
import ProductsContext from "../../../context/ProductsContext";
import CartContext from "../../../context/CartContext";
import { path_product_img, category as categoryEndpoint, base_url } from "../../../config/enpoints";
import { toRupiah } from "../../../components/Helper";
import Snackbar from "../../../components/Snackbar";
import TimeslotModal from "../../../components/TimeslotModal";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProductDetails = () => {
  const windowWidth = Dimensions.get('window').width;
  const width = Platform.OS === 'web' ? Math.min(windowWidth, 600) : windowWidth;
  
  const { productDetails, fetchProducts } = useContext(ProductsContext) || {};
  // const { deliveryDate, setDeliveryDate } = useContext(ProductsContext) || {};
  const deliveryDate = "today";
  const setDeliveryDate = () => {};

  const { cart, getCart, addToCart, addQuantity, minQuantity } = useContext(CartContext) || {};
  
  const route = useRoute();
  const { id } = route.params || {};
  const navigation = useNavigation();

  const scrollRef = useRef(null);

  const [selectedVariation, setSelectedVariation] = useState(null);
  const [activeTab, setActiveTab] = useState("serupa"); // "serupa" or "bareng"
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [snackbar, setSnackbar] = useState({ show: false, message: "" });
  
  const [showModal, setShowModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch(`${base_url}${categoryEndpoint}`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['homeProducts', 'today', 1],
    queryFn: async () => {
      if (!fetchProducts) return [];
      const model = await fetchProducts({ page: 1, limit: 15 });
      return (model && typeof model.getProducts === 'function') 
        ? model.getProducts() 
        : (Array.isArray(model) ? model : []);
    }
  });

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!productDetails || !id) return null;
      const productModel = await productDetails(id);
      const data = productModel && typeof productModel.getProducts === 'function' ? productModel.getProducts() : productModel;
      const targetProduct = Array.isArray(data) ? data[0] : data;
      return targetProduct;
    },
    enabled: !!id
  });

  const otherProducts = relatedProducts.slice(0, 4);
  const similarProducts = relatedProducts.slice(4, 10);
  const frequentlyBought = relatedProducts.slice(10, 15);

  const getCategoryNames = () => {
    if (!product || !product.category_ids || categories.length === 0) return "";
    let ids = [];
    let parsed = product.category_ids;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch (e) { parsed = []; }
    }
    parsed.forEach(c => {
      if (String(c.position) === "1") ids.push(c.id);
    });
    const names = ids.map(id => {
      const cat = categories.find(c => String(c.id) === String(id));
      return cat ? cat.name : null;
    }).filter(Boolean);
    return names.join(", ");
  };

  const triggerSnackbar = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => {
      setSnackbar({ show: false, message: "" });
    }, 3000);
  };

  const handleNavigateAndClose = (route, params) => {
    navigation.goBack();
    setTimeout(() => {
      navigation.navigate(route, params);
    }, 150);
  };

  const handleAddProduct = async (p) => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      handleNavigateAndClose("/login"); // Asumsi nama route login
      return;
    }
    if (p.total_stock !== undefined && p.total_stock <= 0) {
      triggerSnackbar("Maaf, stok produk ini sedang habis.");
      return;
    }

    if (deliveryDate === "today" && p.time_slot && p.time_slot.end_time) {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, "0");
      const currentMinutes = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${currentHours}:${currentMinutes}:00`;

      if (currentTime > p.time_slot.end_time) {
        setPendingProduct(p);
        setShowModal(true);
        return;
      }
    }
    
    executeAddToCart(p);
  };

  const executeAddToCart = (p) => {
    const isMainProduct = product && p.id === product.id;
    const currentVar = isMainProduct ? selectedVariation : null;
    
    const itemPrice = currentVar 
      ? Number(currentVar.price) 
      : (Number(p.price ?? p.unit_price ?? 0) || 0);

    if(addToCart) {
      addToCart(
        p.id,
        p.name,
        itemPrice,
        1,
        currentVar ? currentVar.type : "",
        currentVar ? [currentVar] : [],
        0,
        p.image && Array.isArray(p.image) ? p.image[0] : p.image,
        p.time_slot
      );
    }
  };

  const confirmTimeslotModal = () => {
    if (pendingProduct) {
      setDeliveryDate("tomorrow");
      executeAddToCart(pendingProduct);
    }
    setShowModal(false);
    setPendingProduct(null);
  };

  const closeTimeslotModal = () => {
    setShowModal(false);
    setPendingProduct(null);
  };

  if (!product) {
    return (
      <View className="flex-1 bg-black/60 items-center justify-center">
        <View className="bg-white p-6 rounded-2xl shadow-xl items-center">
          <ActivityIndicator size="large" color="#15803d" />
          <Text className="text-sm font-medium mt-3 text-gray-500">Loading details...</Text>
        </View>
      </View>
    );
  }

  const cartItem = cart?.find(item => item.product_id === product.id);
  const price = selectedVariation 
    ? Number(selectedVariation.price) 
    : (Number(product.price ?? product.unit_price ?? 0) || 0);
  const originalPrice = price ? Math.round(price * 1.25) : 0;

  let productImages = [];
  if (product.image) {
    if (Array.isArray(product.image)) {
      productImages = product.image;
    } else if (typeof product.image === 'string' && product.image.startsWith('[')) {
      try {
        productImages = JSON.parse(product.image);
      } catch (e) {
        productImages = [product.image];
      }
    } else {
      productImages = [product.image];
    }
  }

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentImageIndex(index);
  };

  return (
    <View className="flex-1 bg-black/60 pt-10">
      <TouchableOpacity 
        style={{ flex: 1 }} 
        onPress={() => navigation.goBack()} 
        activeOpacity={1}
      />
      
      {/* Bottom Sheet Container */}
      <View className="bg-white w-full rounded-t-[10px] h-[92%] overflow-hidden flex-col shadow-2xl">
        
        {/* Drag handle */}
        <View className="w-full items-center py-3 bg-white z-30 border-b border-gray-50">
          <View className="w-14 h-1 bg-gray-300 rounded-full" />
        </View>

        <FlatList
          className="flex-1"
          showsVerticalScrollIndicator={false}
          bounces={false}
          data={activeTab === "serupa" ? similarProducts : frequentlyBought}
          keyExtractor={(p) => p.id.toString()}
          numColumns={3}
          columnWrapperStyle={{ paddingHorizontal: 16, justifyContent: 'flex-start' }}
          contentContainerStyle={{ paddingBottom: 80, backgroundColor: 'white' }}
          ListHeaderComponent={
            <>
          
          {/* Product Image Carousel */}
          <View className="w-full aspect-square bg-gray-100 relative">
            {productImages.length === 0 ? (
              <View style={{ width, height: width, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                <Text className="text-gray-400">No Image</Text>
              </View>
            ) : (
              <FlatList
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                data={productImages}
                keyExtractor={(_, idx) => idx.toString()}
                renderItem={({ item: img }) => (
                  <Image
                    source={img.startsWith('http') || img.startsWith('data:') ? img : `${path_product_img}/${img}`}
                    style={{ width, height: width }}
                    contentFit="cover"
                    transition={200}
                  />
                )}
              />
            )}

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 items-center justify-center"
            >
              <Ionicons name="chevron-down" size={20} color="white" />
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 items-center justify-center"
            >
              <Ionicons name="share-social" size={20} color="white" />
            </TouchableOpacity>

            {/* Image index */}
            {productImages.length > 1 && (
              <View className="absolute bottom-4 right-4 bg-black/40 px-2.5 py-0.5 rounded-full">
                <Text className="text-white text-[10px] font-bold">
                  {currentImageIndex + 1}/{productImages.length}
                </Text>
              </View>
            )}
          </View>

          {/* Promo strip */}
          {product.choice_options && product.choice_options.length > 0 && (
            <View className="bg-[#c62828] py-2.5 px-4 flex-row items-center">
              <Ionicons name="pricetag" size={12} color="white" />
              <Text className="text-white text-xs ml-2 font-bold uppercase tracking-wider">
                {product.choice_options.map(co => co.title).join(", ")}
              </Text>
            </View>
          )}

          {/* Pricing details */}
          <View className="p-4 border-b border-gray-100 bg-white">
            <View className="flex-row items-baseline">
              <Text className="text-2xl font-bold text-[#ea2b4c]">{toRupiah(price)}</Text>
              <View className="bg-[#ea2b4c] px-1.5 py-0.5 rounded ml-2">
                <Text className="text-xs text-white font-bold">26%</Text>
              </View>
              <Text className="text-xs text-gray-400 line-through ml-2">{toRupiah(originalPrice)}</Text>
            </View>
            <Text className="text-lg font-bold text-gray-800 mt-2">{product.name}</Text>
            <Text className="text-xs text-gray-500 font-medium mt-1">
              Berat / Unit: {selectedVariation ? selectedVariation.type : (product.capacity ? `${product.capacity} ${product.unit}` : "250 - 350 gram / pack")}
            </Text>
          </View>

          {/* Variations */}
          {product.variations && product.variations.length > 0 && (
            <View className="p-4 border-b border-gray-100 bg-white">
              <Text className="text-sm font-bold text-gray-800 mb-3">Pilih Variasi</Text>
              <View className="flex-row flex-wrap">
                {product.variations.map((v, idx) => {
                  const isSelected = selectedVariation && selectedVariation.type === v.type;
                  return (
                    <TouchableOpacity
                      key={idx.toString()}
                      onPress={() => setSelectedVariation(isSelected ? null : v)}
                      className={`px-4 py-2 rounded-lg border mr-2 mb-2 ${
                        isSelected ? "bg-green-100 border-green-600" : "bg-white border-gray-200"
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${isSelected ? "text-green-800" : "text-gray-600"}`}>
                        {v.type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Description */}
          <View className="p-4 border-b border-gray-100 bg-white">
            <Text className="text-[13px] text-gray-600 leading-relaxed mb-6">
              {product.description || "Tidak ada deskripsi produk."}
            </Text>
            <View className="mt-3 pt-3 border-t border-gray-100 flex-row">
               <Text className="text-xs font-bold text-gray-800">Kategori: </Text>
               <Text className="text-xs text-green-700 font-bold">{getCategoryNames() || "-"}</Text>
            </View>
          </View>

          {/* Produk Lainnya */}
          <View className="p-4 border-b border-gray-100 bg-white">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-bold text-gray-800">Produk lainnya</Text>
              <TouchableOpacity className="flex-row items-center" onPress={() => handleNavigateAndClose("/")}>
                <Text className="text-[10px] text-green-700 font-bold mr-1">Lihat Semua</Text>
                <Ionicons name="chevron-forward" size={10} color="#15803d" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              className="pb-2"
              contentContainerStyle={{ paddingRight: 16 }}
              data={otherProducts}
              keyExtractor={(p) => p.id.toString()}
              renderItem={({ item: p }) => {
                const inCart = cart?.find(item => item.product_id === p.id);
                const pImage = p.image ? (Array.isArray(p.image) ? p.image[0] : (typeof p.image === 'string' && p.image.startsWith('[') ? JSON.parse(p.image)[0] : p.image)) : "def.png";
                const displayImage = pImage.startsWith('http') ? pImage : `${path_product_img}/${pImage}`;
                
                return (
                  <View className="w-32 bg-white rounded-xl border border-gray-100 p-2 mr-3 justify-between shadow-sm">
                    <TouchableOpacity onPress={() => handleNavigateAndClose("/p/:id", { id: p.id })}>
                      <View className="w-full aspect-square bg-gray-50 rounded-lg overflow-hidden relative">
                        {p.time_slot && p.time_slot.start_time && (
                          <View className="absolute top-0 left-0 bg-green-700/90 px-2 py-0.5 rounded-br-lg z-10">
                            <Text className="text-[7.5px] font-bold text-yellow-300">Fresh</Text>
                          </View>
                        )}
                        <Image source={displayImage} className="w-full h-full" contentFit="cover" transition={200} />
                      </View>
                      <View className="mt-1">
                        <Text className="text-[10px] font-bold text-gray-800" numberOfLines={1}>{p.name}</Text>
                        <Text className="text-[8px] text-gray-400 mt-0.5">{p.capacity ? `${p.capacity} ${p.unit}` : "500 gram / pack"}</Text>
                      </View>
                    </TouchableOpacity>
                    
                    <View className="flex-row justify-between items-center mt-2 pt-1 border-t border-gray-50">
                      <Text className="text-[10px] font-bold text-[#ea2b4c]">{toRupiah(p.price)}</Text>
                      {inCart ? (
                        <View className="flex-row items-center bg-green-50 rounded-full px-1 border border-green-200">
                          <TouchableOpacity className="w-4 h-4 rounded-full bg-green-700 items-center justify-center" onPress={() => minQuantity(p.id)}>
                            <Text className="text-white text-[9px] font-bold">-</Text>
                          </TouchableOpacity>
                          <Text className="text-[9px] font-bold text-green-800 mx-1">{inCart.quantity}</Text>
                          <TouchableOpacity className="w-4 h-4 rounded-full bg-green-700 items-center justify-center" onPress={() => addQuantity(p.id)}>
                            <Text className="text-white text-[9px] font-bold">+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity className="w-5 h-5 rounded-full bg-green-700 items-center justify-center" onPress={() => handleAddProduct(p)}>
                          <Text className="text-white text-xs font-bold">+</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          </View>

          {/* Tab Section */}
          <View className="px-4 pt-4 bg-white pb-2">
            <View className="flex-row border-b border-gray-100 mb-2">
              <TouchableOpacity onPress={() => setActiveTab("serupa")} className="pb-2 mr-6 relative">
                <Text className={`text-xs font-bold ${activeTab === "serupa" ? "text-green-800" : "text-gray-400"}`}>Produk Serupa</Text>
                {activeTab === "serupa" && <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-800" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab("bareng")} className="pb-2 relative">
                <Text className={`text-xs font-bold ${activeTab === "bareng" ? "text-green-800" : "text-gray-400"}`}>Sering Dibeli Bareng</Text>
                {activeTab === "bareng" && <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-800" />}
              </TouchableOpacity>
            </View>

            </View>
            </>
          }
          renderItem={({ item: p }) => {
            const inCart = cart?.find(item => item.product_id === p.id);
            const pImage = p.image ? (Array.isArray(p.image) ? p.image[0] : (typeof p.image === 'string' && p.image.startsWith('[') ? JSON.parse(p.image)[0] : p.image)) : "def.png";
            const displayImage = pImage.startsWith('http') ? pImage : `${path_product_img}/${pImage}`;
            const itemWidth = (width - 40) / 3;
            
            return (
              <View style={{ width: itemWidth, marginRight: 8, marginBottom: 8, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6', padding: 8, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                <TouchableOpacity onPress={() => handleNavigateAndClose("/p/:id", { id: p.id })}>
                  <View className="w-full aspect-square bg-gray-50 rounded-lg overflow-hidden relative">
                    <Image source={displayImage} className="w-full h-full" contentFit="cover" transition={200} />
                  </View>
                  <View className="mt-1">
                    <Text className="text-[9px] font-bold text-gray-800" numberOfLines={2}>{p.name}</Text>
                    <Text className="text-[8px] text-gray-400 mt-0.5">{p.capacity ? `${p.capacity} ${p.unit}` : "500g"}</Text>
                  </View>
                </TouchableOpacity>
                
                <View className="flex-row justify-between items-center mt-2 pt-1 border-t border-gray-50">
                  <Text className="text-[9px] font-bold text-gray-800">{toRupiah(p.price)}</Text>
                  {inCart ? (
                    <View className="flex-row items-center bg-green-50 rounded-full px-1 border border-green-200">
                      <TouchableOpacity className="w-4 h-4 rounded-full bg-green-700 items-center justify-center" onPress={() => minQuantity(p.id)}>
                        <Text className="text-white text-[9px] font-bold">-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="w-4 h-4 rounded-full bg-green-700 items-center justify-center ml-1" onPress={() => addQuantity(p.id)}>
                        <Text className="text-white text-[9px] font-bold">+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity className="w-5 h-5 rounded-full bg-green-700 items-center justify-center" onPress={() => handleAddProduct(p)}>
                      <Text className="text-white text-xs font-bold">+</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />

        {/* Sticky Footer Action Bar */}
        <View className="w-full bg-white border-t border-gray-200 py-3 px-4 flex-row items-center justify-between shadow-lg">
          
          <TouchableOpacity 
            onPress={() => {
              const p_image = (product.image && product.image.length > 0) ? `${path_product_img}/${product.image[0]}` : "";
              const productEmbed = `[PRODUCT:id=${product.id}|name=${encodeURIComponent(product.name)}|price=${product.price}|image=${encodeURIComponent(p_image)}|stock=${product.total_stock}] `;
              handleNavigateAndClose("/cs", { productEmbed });
            }}
            className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 items-center justify-center"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#4b5563" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => handleNavigateAndClose("/cart")}
            className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 items-center justify-center ml-2 relative"
          >
            <Ionicons name="cart-outline" size={20} color="#4b5563" />
            {cart && cart.length > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center border border-white">
                <Text className="text-white text-[8px] font-bold">{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {cartItem ? (
            <View className="flex-1 flex-row items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2 ml-4 h-11">
              <TouchableOpacity className="w-7 h-7 rounded-full bg-green-700 items-center justify-center" onPress={() => minQuantity(product.id)}>
                <Text className="text-white font-bold">-</Text>
              </TouchableOpacity>
              <Text className="font-bold text-green-800 text-sm">{cartItem.quantity} di keranjang</Text>
              <TouchableOpacity className="w-7 h-7 rounded-full bg-green-700 items-center justify-center" onPress={() => addQuantity(product.id)}>
                <Text className="text-white font-bold">+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => handleAddProduct(product)}
              className={`flex-1 rounded-xl ml-4 h-11 items-center justify-center shadow-md ${
                product.total_stock !== undefined && product.total_stock <= 0 ? "bg-slate-400" : "bg-green-700"
              }`}
              disabled={product.total_stock !== undefined && product.total_stock <= 0}
            >
              <Text className="text-white font-bold text-sm">Tambah Ke Keranjang</Text>
            </TouchableOpacity>
          )}

        </View>

      </View>
      
      {snackbar.show && (
        <Snackbar type="alert" message={snackbar.message} />
      )}

      {showModal && (
        <TimeslotModal
          isOpen={showModal}
          onClose={closeTimeslotModal}
          onConfirm={confirmTimeslotModal}
          product={pendingProduct}
        />
      )}

    </View>
  );
};

export default ProductDetails;
