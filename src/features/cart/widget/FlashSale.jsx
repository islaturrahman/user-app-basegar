import React, { useEffect, useState, useContext } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import { flash_deal, path_product_img, base_url } from "../../../config/enpoints";
// import { get } from "../../../data/api"; // Disable karena belum dipindahkan, pakai fetch biasa atau uncomment nanti
import { toRupiah } from "../../../components/Helper";
import CartContext from "../../../context/CartContext";
// import ProductsContext from "../../../context/ProductsContext";
import TimeslotModal from "../../../components/TimeslotModal";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FlashSale = () => {
  const [flashDeal, setFlashDeal] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);
  // const { deliveryDate, setDeliveryDate } = useContext(ProductsContext) || {};
  const deliveryDate = "today"; // fallback
  const setDeliveryDate = () => {}; // fallback
  const navigation = useNavigation();

  const [showModal, setShowModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

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

  const calculateTimeLeft = (endDateString) => {
    if (!endDateString) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const difference = +new Date(endDateString) - +new Date();
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        expired: false
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  };

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        setLoading(true);
        // Menggunakan fetch biasa sementara get() dari data/api belum ada
        const response = await fetch(`${base_url}${flash_deal}?limit=10&offset=1`);
        const json = await response.json();
        
        if (json && json.products && json.products.length > 0) {
          setFlashDeal(json.flash_deal);
          setProducts(json.products);
        }
      } catch (error) {
        console.log("Error fetching flash sale:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSale();
  }, []);

  useEffect(() => {
    if (!flashDeal || !flashDeal.end_date) return;

    setTimeLeft(calculateTimeLeft(flashDeal.end_date));

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(flashDeal.end_date);
      setTimeLeft(remaining);
      if (remaining.expired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [flashDeal]);

  if (loading) return null;

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

  const isProductExpired = (item, currentTime) => {
    const slots = parseTimeSlots(item.time_slot);
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

  const handleAddProduct = async (item, discountedPrice) => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      navigation.navigate("/login");
      return;
    }

    if (deliveryDate === "today") {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, "0");
      const currentMinutes = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${currentHours}:${currentMinutes}:00`;

      if (isProductExpired(item, currentTime)) {
        setPendingProduct({ item, discountedPrice });
        setShowModal(true);
        return;
      }
    }
    executeAddToCart(item, discountedPrice);
  };

  const executeAddToCart = (item, discountedPrice) => {
    addToCart(
      item.id,
      item.name,
      discountedPrice,
      1,
      "",
      [],
      item.tax || 0,
      getParsedImage(item.image),
      item.time_slot
    );
  };

  const confirmTimeslotModal = () => {
    if (pendingProduct) {
      if (setDeliveryDate) setDeliveryDate("tomorrow");
      executeAddToCart(pendingProduct.item, pendingProduct.discountedPrice);
    }
    setShowModal(false);
    setPendingProduct(null);
  };

  const closeTimeslotModal = () => {
    setShowModal(false);
    setPendingProduct(null);
  };

  return (
    <View className="bg-orange-50 mt-0 mb-4">
      <View className="p-4 pb-2 flex-row justify-between items-center">
        <Text className="text-lg font-bold text-orange-700">⚡ Flash Sale</Text>
        
        {flashDeal && (
          <View className="flex-row items-center">
            <Text className="text-[10px] font-semibold text-orange-700 mr-1 hidden sm:flex">
              Berakhir dalam:
            </Text>
            {timeLeft.expired ? (
              <View className="bg-red-600 px-2.5 py-1 rounded-full">
                <Text className="text-xs font-semibold text-white">Promo Berakhir</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                {timeLeft.days > 0 && (
                  <>
                    <View className="bg-orange-600 px-1.5 py-0.5 rounded shadow-sm">
                      <Text className="text-white text-[11px] font-bold">{String(timeLeft.days).padStart(2, "0")}h</Text>
                    </View>
                    <Text className="text-xs text-orange-600 font-bold mx-0.5">:</Text>
                  </>
                )}
                <View className="bg-orange-600 px-1.5 py-0.5 rounded shadow-sm">
                  <Text className="text-white text-[11px] font-bold">{String(timeLeft.hours).padStart(2, "0")}</Text>
                </View>
                <Text className="text-xs text-orange-600 font-bold mx-0.5">:</Text>
                <View className="bg-orange-600 px-1.5 py-0.5 rounded shadow-sm">
                  <Text className="text-white text-[11px] font-bold">{String(timeLeft.minutes).padStart(2, "0")}</Text>
                </View>
                <Text className="text-xs text-orange-600 font-bold mx-0.5">:</Text>
                <View className="bg-orange-600 px-1.5 py-0.5 rounded shadow-sm">
                  <Text className="text-white text-[11px] font-bold">{String(timeLeft.seconds).padStart(2, "0")}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
      
      {products.length === 0 ? (
        <View className="px-4 pb-4 items-center">
          <Text className="text-orange-600 text-sm font-medium">Saat ini belum ada produk Flash Sale yang aktif.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-4 px-4">
          <View className="flex-row pr-8">
            {products.map((item, index) => {
              const discount = item.discount || 0;
              const originalPrice = item.price;
              const discountedPrice = item.discount_type === "percent" 
                ? originalPrice - (originalPrice * discount / 100) 
                : originalPrice - discount;

              return (
                <View key={index.toString()} className="flex-row w-[280px] items-center bg-white p-3 rounded-xl border border-orange-100 mr-3">
                  <TouchableOpacity onPress={() => navigation.navigate(`/p/${item.id}`)} className="relative mr-3">
                    <Image 
                      source={{ uri: `${path_product_img}/${getParsedImage(item.image)}` }} 
                      className="w-16 h-16 rounded-lg bg-gray-100"
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <View className="flex-1">
                    <TouchableOpacity onPress={() => navigation.navigate(`/p/${item.id}`)}>
                      <Text className="font-bold text-gray-800 text-sm" numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                    <View className="flex-col mt-1">
                      <Text className="text-sm font-semibold text-orange-600">{toRupiah(discountedPrice)}</Text>
                      {discount > 0 && (
                        <View className="flex-row items-center mt-0.5">
                          <Text className="text-[10px] text-gray-400 line-through mr-1">{toRupiah(originalPrice)}</Text>
                          <View className="bg-red-100 py-0.5 px-1.5 rounded">
                            <Text className="text-[10px] text-red-600 font-medium">
                              {item.discount_type === "percent" ? `${discount}%` : `-${toRupiah(discount)}`}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleAddProduct(item, discountedPrice)}
                    className="bg-orange-100 h-8 w-8 items-center justify-center rounded-lg ml-2"
                  >
                    <Text className="text-orange-600 font-bold text-lg">+</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* 
        TODO: TimeslotModal needs to be adapted for React Native if it hasn't been already.
        We'll pass the props and hope the generic TimeslotModal handles it correctly.
      */}
      {showModal && (
        <TimeslotModal
          isOpen={showModal}
          onClose={closeTimeslotModal}
          onConfirm={confirmTimeslotModal}
          product={pendingProduct?.item}
        />
      )}
    </View>
  );
};

export default FlashSale;
