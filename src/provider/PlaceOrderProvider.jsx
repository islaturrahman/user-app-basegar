import { createContext, React, useContext, useState, useRef, useEffect } from "react";
import { Linking, TouchableOpacity, Text, View, ActivityIndicator, Platform, Animated, Dimensions, StyleSheet, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { FontAwesome5 } from "@expo/vector-icons";
import { place_order, dana_charge, base_url } from "../config/enpoints";
import { post } from "../data/api";

export const OrderPlaceContext = createContext();

const OrderPlaceProvider = ({ children }) => {
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigationRef = useRef(null);
  const orderDataRef = useRef(null);
  
  const [isModalReady, setIsModalReady] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Efek untuk menganimasikan bottom sheet saat modal terbuka
  useEffect(() => {
    if (showPaymentModal) {
      setIsModalReady(false);
      slideAnim.setValue(Dimensions.get('window').height);
      fadeAnim.setValue(0);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsModalReady(true);
      });

      const onBackPress = () => {
        closePaymentModal();
        return true;
      };
      const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => backHandler.remove();
    }
  }, [showPaymentModal]);

  const validationLocalStorage = async () => {
    const cart = await AsyncStorage.getItem("cart");
    const addressStr = await AsyncStorage.getItem("selectAddress");
    const dateslot = await AsyncStorage.getItem("dateslot");
    const timeslot_id = await AsyncStorage.getItem("timeslotId");
    const order_amount = await AsyncStorage.getItem("order_amount");
    const distance = await AsyncStorage.getItem("distance");
    const payment_method = await AsyncStorage.getItem("payment_method");

    if (!cart) return { status: false, message: "Keranjang belanja masih kosong" };
    if (!addressStr || addressStr === "{}" || addressStr === "null") {
      return { status: false, message: "Silakan pilih alamat pengiriman" };
    }
    
    const address = JSON.parse(addressStr);
    
    if (!address || Object.keys(address).length === 0 || !address.id) {
      return { status: false, message: "Silakan pilih alamat pengiriman" };
    }

    if (!address.contact_person_name || address.contact_person_name.trim() === "" || address.contact_person_name === "-") {
      return { status: false, message: "Silakan lengkapi Nama Penerima di Data Penerima" };
    }
    if (!address.contact_person_number || address.contact_person_number.trim() === "" || address.contact_person_number === "-") {
      return { status: false, message: "Silakan lengkapi Nomor WhatsApp di Data Penerima" };
    }

    if (!dateslot) return { status: false, message: "Silakan pilih tanggal pengiriman" };
    if (!timeslot_id) return { status: false, message: "Silakan pilih waktu pengiriman" };
    if (!order_amount) return { status: false, message: "Total pesanan tidak valid" };
    if (!distance) return { status: false, message: "Jarak pengiriman belum dihitung" };
    if (!payment_method) return { status: false, message: "Silakan pilih metode pembayaran" };

    return { success: true, message: "All validations passed" };
  };

  const placeOrder = async (navigation, clearCart) => {
    const validate = await validationLocalStorage();

    if (!validate.success) {
      setSuccess(validate); 
      return;
    }

    setLoading(true);
    const cart = JSON.parse(await AsyncStorage.getItem("cart"));
    const address = JSON.parse(await AsyncStorage.getItem("selectAddress"));
    const dateslot = await AsyncStorage.getItem("dateslot");
    const timeslot_id = await AsyncStorage.getItem("timeslotId");
    const order_amount = await AsyncStorage.getItem("order_amount");
    const distance = await AsyncStorage.getItem("distance");
    const payment_method = await AsyncStorage.getItem("payment_method");
    const order_note = (await AsyncStorage.getItem("order_note")) || "";

    const jsonBody = {
      order_amount: parseFloat(order_amount),
      payment_method: payment_method,
      delivery_address_id: address.id,
      order_type: "delivery",
      branch_id: 1,
      distance: distance,
      is_partial: 0,
      cart: cart.filter(item => item.is_selected !== false),
      coupon_code: "",
      coupon_discount_amount: 0,
      time_slot_id: timeslot_id,
      delivery_date: dateslot,
      order_note: order_note,
      payment_by: "",
      payment_note: "",
    };

    let isRedirecting = false;
    try {
      const response = await post(place_order, jsonBody);

      if (response.order_id) {
        navigationRef.current = navigation;
        orderDataRef.current = {
          order_id: response.order_id,
          order_amount: parseFloat(order_amount),
          payment_method: payment_method
        };

        if (payment_method === "dana") {
          const chargeResponse = await post(dana_charge, { order_id: response.order_id });
          if (chargeResponse.checkoutUrl) {
            await clearLocalStorage();
            if (clearCart) clearCart();
            setPaymentUrl(chargeResponse.checkoutUrl);
            setShowPaymentModal(true);
            isRedirecting = true;
          } else {
            navigation.navigate("/o/:id/success", {
              is_error: true,
              error_message: chargeResponse.message || "Gagal memulai pembayaran DANA",
            });
          }
        } else if (payment_method !== "cash_on_delivery" && payment_method !== "offline_payment") {
          const customer_id = address?.user_id || 1;
          const callback_url = `basegar://o/${response.order_id}`;
          // Fix btoa not being available directly in some RN versions
          // If btoa fails, we might need an alternative or ensure it's polyfilled. 
          // Assuming it's already working in the app since it was used before.
          let token = "";
          try {
            const tokenRaw = `customer_id=${customer_id}&&callback=${callback_url}&&order_amount=${order_amount}&&is_guest=1&&attribute_id=${response.order_id}`;
            token = btoa(tokenRaw);
          } catch(e) {
            // simple base64 fallback if btoa is missing
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            const str = `customer_id=${customer_id}&&callback=${callback_url}&&order_amount=${order_amount}&&is_guest=1&&attribute_id=${response.order_id}`;
            let output = '';
            for (let block, charCode, idx = 0, map = chars;
              str.charAt(idx | 0) || (map = '=', idx % 1);
              output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
              charCode = str.charCodeAt(idx += 3/4);
              if (charCode > 0xFF) { throw new Error("'btoa' failed"); }
              block = block << 8 | charCode;
            }
            token = output;
          }
          
          await clearLocalStorage();
          if (clearCart) clearCart();
          
          setPaymentUrl(`${base_url}/payment-mobile?token=${token}&payment_method=${payment_method}&payment_platform=mobile`);
          setShowPaymentModal(true);
          isRedirecting = true;
        } else {
          await clearLocalStorage();
          if (clearCart) clearCart();
          navigation.navigate("/o/:id/success", {
            order_id: response.order_id,
            order_amount: parseFloat(order_amount),
            payment_method: payment_method,
            is_error: false,
          });
        }
      } else {
        const errMsg = response.message || "Pesanan gagal diproses oleh server";
        navigation.navigate("/o/:id/success", {
          is_error: true,
          error_message: errMsg,
        });
      }
    } catch (error) {
      navigation.navigate("/o/:id/success", {
        is_error: true,
        error_message: error.message || "Terjadi kesalahan pada koneksi server",
      });
    } finally {
      if (!isRedirecting) {
        setLoading(false);
      }
    }
  };

  const clearLocalStorage = async () => {
    const keys = [
      "dateslot", "timeslotId", "order_amount", "distance",
      "payment_method", "dateslotId", "lastEndTimeFetchToday", "timeslot", "delivery_charge",
    ];
    await AsyncStorage.multiRemove(keys);
  };

  const closePaymentModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowPaymentModal(false);
      setIsModalReady(false);
      if (navigationRef.current && orderDataRef.current) {
        navigationRef.current.navigate("/o/:id/success", {
          ...orderDataRef.current,
          is_error: false,
        });
      }
    });
  };

  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    
    // Jika redirect ke success URL atau basegar scheme
    if (url.startsWith('basegar://') || url.includes('payment/success')) {
      closePaymentModal();
      return false;
    }
    
    // Tangani deep links seperti gojek://, shopeepay://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) Linking.openURL(url);
      });
      return false;
    }
    
    return true;
  };

  const value = { success, loading, placeOrder };

  return (
    <OrderPlaceContext.Provider value={value}>
      {children}
      
      {/* Payment WebView Bottom Sheet / Modal */}
      {showPaymentModal && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="box-none">
          <Animated.View style={[{ opacity: fadeAnim }, StyleSheet.absoluteFill]} className="bg-black/60">
             <TouchableOpacity style={{ flex: 1 }} onPress={closePaymentModal} activeOpacity={1} />
          </Animated.View>
          <View className="flex-1 justify-end" pointerEvents="box-none">
            <Animated.View 
              style={{ transform: [{ translateY: slideAnim }] }}
              className="bg-white rounded-t-3xl overflow-hidden h-[85%] shadow-lg w-full max-w-[600px] self-center"
            >
            {/* Header */}
            <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100 bg-white shadow-sm">
              <View>
                <Text className="text-base font-black text-gray-800">Selesaikan Pembayaran</Text>
                <Text className="text-[10px] font-semibold text-green-700 mt-0.5">Aman dan terenkripsi 🔒</Text>
              </View>
              <TouchableOpacity
                onPress={closePaymentModal}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <FontAwesome5 name="times" size={14} color="#374151" />
              </TouchableOpacity>
            </View>
            
            {/* WebView */}
            {!isModalReady ? (
              <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#15803d" />
                <Text className="text-sm font-medium mt-3 text-gray-500">Menyiapkan pembayaran...</Text>
              </View>
            ) : paymentUrl ? (
              Platform.OS === 'web' ? (
                <View style={{ flex: 1, backgroundColor: 'white' }}>
                  <iframe 
                    src={paymentUrl} 
                    style={{ flex: 1, width: '100%', height: '100%', border: 'none' }} 
                    title="Payment"
                    allow="payment"
                  />
                </View>
              ) : (
                <WebView
                  source={{ uri: paymentUrl }}
                  style={{ flex: 1 }}
                  onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View className="absolute inset-0 items-center justify-center bg-white z-10">
                      <ActivityIndicator size="large" color="#15803d" />
                      <Text className="text-xs text-gray-500 mt-3 font-medium">Memuat halaman pembayaran...</Text>
                    </View>
                  )}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  scalesPageToFit={true}
                />
              )
            ) : null}
            
            <SafeAreaView className="bg-white" />
          </Animated.View>
        </View>
      </View>
      )}
    </OrderPlaceContext.Provider>
  );
};

export default OrderPlaceProvider;
