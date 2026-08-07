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

const ProductWidget = ({ products, type = "grid" }) => {
  const { addToCart, getCart, addQuantity, minQuantity } = useContext(CartContext) || {};
  const { deliveryDate, setDeliveryDate } = useContext(ProductsContext) || {};
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

  const handleAddProduct = async (product) => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      navigation.navigate("Login");
      return;
    }

    if (product.total_stock > 0) {
      if (deliveryDate === "today" && product.time_slot && product.time_slot.end_time) {
        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, "0");
        const currentMinutes = now.getMinutes().toString().padStart(2, "0");
        const currentTime = `${currentHours}:${currentMinutes}:00`;

        if (currentTime > product.time_slot.end_time) {
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
        
        let isSlotExpired = false;
        if (product.time_slot && product.time_slot.end_time) {
          const now = new Date();
          const currentHours = now.getHours().toString().padStart(2, "0");
          const currentMinutes = now.getMinutes().toString().padStart(2, "0");
          const currentTime = `${currentHours}:${currentMinutes}:00`;
          isSlotExpired = currentTime > product.time_slot.end_time;
        }

        return (
          <View
            key={index}
            className="w-[48%] mb-4 bg-white rounded-lg p-2 shadow-sm border border-gray-100"
          >
            <TouchableOpacity onPress={() => handleProductClick(product.id)} className="relative">
              <View className="items-center mb-2 relative overflow-hidden rounded-t-lg">
                {product.time_slot && product.time_slot.start_time && (
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
              {isSlotExpired && (
                <View className="bg-gray-200 self-start px-2 py-0.5 rounded-[5px] mb-1">
                  <Text className="text-[9px] font-bold text-gray-700">Tersedia besok</Text>
                </View>
              )}
              
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
                <View className="flex-row items-center justify-between bg-gray-100 rounded-md">
                  <TouchableOpacity
                    className="w-8 h-8 items-center justify-center"
                    onPress={() => minQuantity && minQuantity(product.id)}
                  >
                    <FontAwesome5 name="minus" size={12} color="#4b5563" />
                  </TouchableOpacity>
                  <Text className="font-semibold text-gray-800">{cartItem.quantity}</Text>
                  <TouchableOpacity
                    className="w-8 h-8 items-center justify-center"
                    onPress={() => addQuantity && addQuantity(product.id)}
                  >
                    <FontAwesome5 name="plus" size={12} color="#15803d" />
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
        
        let isSlotExpired = false;
        if (product.time_slot && product.time_slot.end_time) {
          const now = new Date();
          const currentHours = now.getHours().toString().padStart(2, "0");
          const currentMinutes = now.getMinutes().toString().padStart(2, "0");
          const currentTime = `${currentHours}:${currentMinutes}:00`;
          isSlotExpired = currentTime > product.time_slot.end_time;
        }

        return (
          <TouchableOpacity
            key={product.id}
            className="mr-3 relative bg-white p-2 rounded-lg border border-gray-100"
            onPress={() => handleProductClick(product.id)}
          >
            <View className="relative overflow-hidden rounded-lg">
              {product.time_slot && product.time_slot.start_time && (
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
