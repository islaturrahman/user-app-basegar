import React, { useContext, useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { base_url, path_product_img } from "../config/enpoints";
import CartContext from "../context/CartContext";
import { toRupiah } from "./Helper";
import { ProductModel } from "../models/ProductModel";
import Snackbar from "./Snackbar";
import ProductsContext from "../context/ProductsContext";
import TimeslotModal from "./TimeslotModal";
import { TimeSlotContext } from "../features/checkout/provider/TimeSlotProvider";

const ProductWidget = ({ products, type = "grid" }) => {
  const { addToCart, getCart, addQuantity, minQuantity } = useContext(CartContext) || {};
  const { deliveryDate, setDeliveryDate } = useContext(ProductsContext) || {};
  const { isGlobalExpired } = useContext(TimeSlotContext) || {};
  const [variant, setVariant] = useState("");
  const [variation, setVariation] = useState([]);
  const [snackbar, setSnackbar] = useState({ show: false, message: "" });
  const [showModal, setShowModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);

  const navigation = useNavigation();


  const handleProductClick = (productId) => {
    navigation.navigate('/p/:id', { id: productId });
  };

  const triggerSnackbar = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => {
      setSnackbar({ show: false, message: "" });
    }, 3000);
  };

  const parseTimeSlots = (time_slot) => {
    let slots = [];
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
    return slots;
  };

  const isProductExpired = (product, currentTime) => {
    const slots = parseTimeSlots(product.time_slot);
    if (slots.length === 0) return false;
    let allExpired = true;
    slots.forEach(slot => {
        if (slot && slot.end_time) {
            if (currentTime <= slot.end_time) {
                allExpired = false;
            }
        }
    });
    return allExpired;
  };

  const handleAddProduct = async (product) => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      navigation.navigate("Login");
      return;
    }

    if (product.total_stock > 0) {
      if (deliveryDate === "today") {
        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, "0");
        const currentMinutes = now.getMinutes().toString().padStart(2, "0");
        const currentTime = `${currentHours}:${currentMinutes}:00`;

        if (isProductExpired(product, currentTime)) {
          setPendingProduct(product);
          setShowModal(true);
          return;
        }
      }
      executeAddToCart(product);
    } else {
      triggerSnackbar("Maaf, stok produk ini sedang habis.");
    }
  };

  const executeAddToCart = (product) => {
    if(addToCart) {
      addToCart(
        product.id,
        product.name,
        product.price,
        1,
        variant,
        variation,
        0,
        product.image && product.image[0] ? product.image[0] : product.image,
        product.time_slot
      );
    }
  };

  const confirmTimeslotModal = () => {
    if (pendingProduct) {
      if (setDeliveryDate) setDeliveryDate("tomorrow");
      executeAddToCart(pendingProduct);
    }
    setShowModal(false);
    setPendingProduct(null);
  };

  const closeTimeslotModal = () => {
    setShowModal(false);
    setPendingProduct(null);
  };

  const getParsedImage = (img) => {
    if (!img) return null;
    if (Array.isArray(img)) return img[0];
    if (typeof img === 'string' && img.startsWith('[')) {
      try {
        return JSON.parse(img)[0];
      } catch (e) {
        return img;
      }
    }
    return img;
  };

  const renderProductGrid = () => (
    <View className="flex-row flex-wrap justify-between overflow-hidden">
      {products.map((product, index) => {
        const cartItems = getCart ? getCart() : [];
        const cartItem = cartItems?.find((item) => item.product_id === product.id);
        const parsedImage = getParsedImage(product.image);
        
        const slots = parseTimeSlots(product.time_slot);
        let isSlotExpired = false;
        let currentTime = "00:00:00";
        if (slots.length > 0) {
          const now = new Date();
          const currentHours = now.getHours().toString().padStart(2, "0");
          const currentMinutes = now.getMinutes().toString().padStart(2, "0");
          currentTime = `${currentHours}:${currentMinutes}:00`;
          isSlotExpired = isProductExpired(product, currentTime);
        }
        
        let dayLabel = "Hari ini";
        if (isGlobalExpired || (slots.length > 0 && isSlotExpired)) {
          dayLabel = "Besok";
        }

        let displaySlot = null;
        if (slots.length > 0) {
            const sortedSlots = [...slots].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
            if (isSlotExpired) {
                displaySlot = sortedSlots[0];
            } else {
                displaySlot = sortedSlots.find(slot => slot.end_time && slot.end_time >= currentTime) || sortedSlots[0];
            }
        }

        return (
          <View
            key={index}
            className="w-[48%] mb-4 bg-white rounded-lg p-2 shadow-sm border border-gray-100"
          >
            <TouchableOpacity onPress={() => handleProductClick(product.id)} className="relative">
              <View className="items-center mb-2 relative overflow-hidden rounded-t-lg">
                {slots.length > 0 && (
                  <View className="absolute top-0 left-0 bg-green-700/90 px-2 py-1 rounded-br-xl z-10 flex-col shadow-sm">
                    <Text className="text-[9px] font-black uppercase tracking-wider text-yellow-300">Fresh</Text>
                  </View>
                )}
                {parsedImage ? (
                  <Image
                    source={{ uri: parsedImage.startsWith('http') ? parsedImage : `${path_product_img}/${parsedImage}` }}
                    className="w-full h-24 rounded-t-lg"
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={{ uri: product.fallbackImage || "https://via.placeholder.com/110" }}
                    className="w-full h-24 rounded-t-lg"
                    resizeMode="contain"
                  />
                )}
              </View>
              
              <Text className="text-sm font-semibold text-gray-800 mb-1" numberOfLines={2}>
                {product.name}
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
                    slotType = "Pagi"; slotBgClass = "bg-blue-100"; slotTextClass = "text-blue-700";
                  } else if (startHour < 15) {
                    slotType = "Siang"; slotBgClass = "bg-yellow-100"; slotTextClass = "text-yellow-700";
                  } else if (startHour < 18) {
                    slotType = "Sore"; slotBgClass = "bg-red-100"; slotTextClass = "text-red-700";
                  } else {
                    slotType = "Malam"; slotBgClass = "bg-purple-100"; slotTextClass = "text-purple-700";
                  }
                  return (
                    <View className={`px-1.5 py-0.5 rounded-[4px] mb-1 mr-1 ${slotBgClass}`}>
                      <Text className={`text-[9px] font-bold ${slotTextClass}`}>{slotType}</Text>
                    </View>
                  );
                })()}
              </View>
              
              <View className="flex-row flex-wrap">
                {product.choice_options?.map((item, idx) => (
                  <View key={idx} className="rounded-lg p-1 bg-orange-500 mr-1 mb-1">
                    <Text className="text-[10px] text-white">{item.title}</Text>
                  </View>
                ))}
              </View>
              
              <Text className="text-sm font-bold text-green-700">{toRupiah(product.price)}</Text>
              {product.variant ? (
                <Text className="text-xs text-gray-500">{product.variant}</Text>
              ) : null}
            </TouchableOpacity>

            <View className="mt-2 h-8 justify-end">
              {cartItem ? (
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    className="w-8 h-8 rounded-full items-center justify-center border border-green-200 bg-white shadow-sm"
                    onPress={() => minQuantity && minQuantity(product.id)}
                  >
                    <Text className="text-green-700 font-bold text-base">-</Text>
                  </TouchableOpacity>
                  <View className="items-center justify-center flex-1">
                    <Text className="text-sm font-bold text-gray-800">{cartItem.quantity}</Text>
                  </View>
                  <TouchableOpacity
                    className="w-8 h-8 rounded-full items-center justify-center shadow-sm bg-green-600"
                    onPress={() => addQuantity && addQuantity(product.id)}
                  >
                    <Text className="font-bold text-base text-white">+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  className={`h-8 items-center justify-center rounded-md ${
                    product.total_stock > 0 ? "bg-green-700" : "bg-slate-400"
                  }`}
                  onPress={() => handleAddProduct(product)}
                >
                  <FontAwesome5 name="plus" size={12} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderProductLine = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-2">
      {products.map((product) => {
        const parsedImage = getParsedImage(product.image);
        
        const slots = parseTimeSlots(product.time_slot);

        return (
          <TouchableOpacity
            key={product.id}
            className="mr-3 relative bg-white p-2 rounded-lg border border-gray-100"
            onPress={() => handleProductClick(product.id)}
          >
            <View className="relative overflow-hidden rounded-lg">
              {slots.length > 0 && (
                <View className="absolute top-0 left-0 bg-green-700/90 px-1.5 py-0.5 rounded-br-lg z-10 flex-col shadow-sm">
                  <Text className="text-[7px] font-black uppercase tracking-wider text-yellow-300">Fresh</Text>
                </View>
              )}
              <Image
                source={{ uri: parsedImage ? (parsedImage.startsWith('http') ? parsedImage : `${path_product_img}/${parsedImage}`) : "https://via.placeholder.com/110" }}
                className="w-20 h-20"
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  return (
    <>
      {type === "grid" ? renderProductGrid() : renderProductLine()}
      {snackbar.show && (
        <Snackbar
          type="alert"
          message={snackbar.message}
          duration={3000}
        />
      )}
      <TimeslotModal
        isOpen={showModal}
        onClose={closeTimeslotModal}
        onConfirm={confirmTimeslotModal}
        product={pendingProduct}
      />
    </>
  );
};

export default ProductWidget;
