import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Switch, DeviceEventEmitter } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { CustomerProvider } from "../../../provider/CustomerProvider";
import { PaymentContext } from "../provider/PaymentProvider";
import CartContext from "../../../context/CartContext";
import { BlankBottomSheet } from "../../../components/BlankBottomSheet";
import { toRupiah } from "../../../components/Helper";
import { Wallet } from "lucide-react-native";

const PaymentWidget = ({ config }) => {
  const { payment, setPayment } = useContext(PaymentContext);
  const { getTotalPrice } = useContext(CartContext);

  const [handleSelectedPayment, setHandleSelectedPayment] = useState(null);
  const [openSelectPayment, setOpenSelectPayment] = useState(false);
  const [user, setUser] = useState(null);
  const [useWallet, setUseWallet] = useState(false);
  
  const total = getTotalPrice ? getTotalPrice() : 0;
  const paymentMethods = [];

  const isCodActive =
    config &&
    (config.cash_on_delivery === "1" ||
      config.cash_on_delivery === 1 ||
      config.cash_on_delivery === "true" ||
      config.cash_on_delivery === true ||
      config.cash_on_delivery?.status === "1" ||
      config.cash_on_delivery?.status === 1 ||
      config.cash_on_delivery?.status === "true" ||
      config.cash_on_delivery?.status === true);

  if (isCodActive) {
    paymentMethods.push({
      id: "cash_on_delivery",
      slug: "cash_on_delivery",
      method: "Cash On Delivery (COD)",
      description: "Bayar tunai di tempat saat pesanan diterima",
      isAvailable:
        config.maximum_amount_for_cod_order_status &&
        total > config.maximum_amount_for_cod_order
          ? false
          : true,
    });
  }

  if (config && Array.isArray(config.active_payment_method_list)) {
    config.active_payment_method_list.forEach((item) => {
      paymentMethods.push({
        id: item.gateway,
        slug: item.gateway,
        method: item.gateway_title || item.gateway.toUpperCase(),
        description: `Pembayaran Digital (${item.gateway_title || item.gateway.toUpperCase()})`,
        image: item.gateway_image && config.base_urls?.gateway_image_url
          ? `${config.base_urls.gateway_image_url}/${item.gateway_image}`
          : null,
        isAvailable: true,
      });
    });
  }

  if (paymentMethods.length === 0) {
    paymentMethods.push({
      id: "cash_on_delivery",
      slug: "cash_on_delivery",
      method: "Cash On Delivery (COD)",
      description: "Bayar tunai di tempat",
      isAvailable: true,
    });
  }

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const savedMethod = await AsyncStorage.getItem("payment_method");
        if (savedMethod) {
          const idx = paymentMethods.findIndex((m) => m.slug === savedMethod);
          if (idx !== -1) {
            setHandleSelectedPayment(idx);
            if (setPayment) setPayment(savedMethod);
            return;
          }
        }
        if (paymentMethods.length > 0 && handleSelectedPayment === null) {
          setHandleSelectedPayment(0);
          if (setPayment) setPayment(paymentMethods[0].slug);
          await AsyncStorage.setItem("payment_method", paymentMethods[0].slug);
        }

        // Ambil status is_partial yang tersimpan (opsional, jika ingin persisten)
        const savedIsPartial = await AsyncStorage.getItem("is_partial");
        const initialUseWallet = savedIsPartial === "1";
        setUseWallet(initialUseWallet);
        
        DeviceEventEmitter.emit('walletToggled', { 
          useWallet: initialUseWallet, 
          balance: parseFloat(user?.wallet_balance) || 0 
        });
      } catch (e) {
        console.error(e);
      }
    };
    initializePayment();
  }, [config]);

  // Fetch data user secara spesifik setiap kali checkout dikunjungi
  useFocusEffect(
    React.useCallback(() => {
      const fetchWalletBalance = async () => {
        try {
          const customerProvider = new CustomerProvider();
          const userModel = await customerProvider.getCustomer();
          let userToUse = null;
          let balance = 0;
          if (userModel) {
            const userData = userModel.getUser();
            if (userData && (userData.id || userData.f_name)) {
              setUser(userData);
              userToUse = userData;
              await AsyncStorage.setItem("user", JSON.stringify(userData));
            } else {
              const savedUser = await AsyncStorage.getItem("user");
              if (savedUser) {
                 userToUse = JSON.parse(savedUser);
                 setUser(userToUse);
              }
            }
          }
          balance = parseFloat(userToUse?.wallet_balance) || 0;
          
          let isPartialVal = await AsyncStorage.getItem("is_partial");
          
          // Jika saldo 0, otomatis nonaktifkan partial payment agar tidak nyangkut
          if (balance <= 0 && isPartialVal === "1") {
            isPartialVal = "0";
            await AsyncStorage.setItem("is_partial", "0");
            setUseWallet(false);
          }

          DeviceEventEmitter.emit('walletToggled', { 
            useWallet: isPartialVal === "1", 
            balance: balance 
          });
        } catch (e) {
          console.error("Gagal update wallet:", e);
        }
      };
      
      fetchWalletBalance();
    }, [])
  );

  const handleSelectPayment = async (index) => {
    setHandleSelectedPayment(index);
    const selectedSlug = paymentMethods[index].slug;
    if (setPayment) setPayment(selectedSlug);
    await AsyncStorage.setItem("payment_method", selectedSlug);
    setOpenSelectPayment(false);
  };

  const toggleWallet = async (value) => {
    setUseWallet(value);
    
    const balance = parseFloat(user?.wallet_balance) || 0;
    const isSufficient = balance >= total;

    // is_partial is ONLY true if wallet is used BUT NOT sufficient to cover the whole total
    const isPartial = value && !isSufficient;
    await AsyncStorage.setItem("is_partial", isPartial ? "1" : "0");
    
    DeviceEventEmitter.emit('walletToggled', { 
      useWallet: value, 
      balance: balance 
    });
    
    if (value && isSufficient) {
      if (setPayment) setPayment("wallet_payment");
      await AsyncStorage.setItem("payment_method", "wallet_payment");
    } else {
      if (handleSelectedPayment !== null && paymentMethods[handleSelectedPayment]) {
        const selectedSlug = paymentMethods[handleSelectedPayment].slug;
        if (setPayment) setPayment(selectedSlug);
        await AsyncStorage.setItem("payment_method", selectedSlug);
      }
    }
  };

  const walletBalance = parseFloat(user?.wallet_balance) || 0;
  const isWalletSufficient = walletBalance >= total;
  const showWalletToggle = walletBalance > 0;
  const remainingTagihan = isWalletSufficient ? 0 : total - walletBalance;

  return (
    <View className="bg-white p-4 mt-2 mb-6">
      {showWalletToggle && (
        <View className="mb-4">
          <Text className="font-bold text-gray-800 mb-3 text-sm">Gunakan Saldo Wallet</Text>
          <View className={`border rounded-xl p-3 flex-row items-center justify-between ${useWallet ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
            <View className="flex-row items-center flex-1">
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${useWallet ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Wallet size={16} color={useWallet ? '#16a34a' : '#6b7280'} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-800 text-xs">Saldo Wallet</Text>
                <Text className="text-[11px] text-gray-500 mt-0.5">{toRupiah(walletBalance)}</Text>
              </View>
            </View>
            <Switch
              value={useWallet}
              onValueChange={toggleWallet}
              disabled={walletBalance <= 0}
              trackColor={{ false: "#d1d5db", true: "#86efac" }}
              thumbColor={useWallet ? "#16a34a" : "#f3f4f6"}
            />
          </View>
          
        {useWallet && isWalletSufficient && (
          <View className="mt-2 flex-row justify-between items-center bg-green-100 px-3 py-2 rounded-lg border border-green-200">
            <Text className="text-[10px] text-green-800">Saldo mencukupi untuk seluruh tagihan.</Text>
          </View>
        )}
        </View>
      )}

      {/* Jika saldo wallet menutupi SEMUA tagihan DAN toggle wallet aktif, sembunyikan pemilihan metode pembayaran lain */}
      {!(useWallet && isWalletSufficient) && (
        <>
          <Text className="font-bold text-gray-800 mb-3 text-sm">Metode Pembayaran {useWallet ? "Sisa Tagihan" : ""}</Text>
      
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpenSelectPayment(true)}
        className="flex-row items-center justify-between p-3 border border-gray-200 rounded-xl"
      >
        {handleSelectedPayment !== null && paymentMethods[handleSelectedPayment] ? (
          <View className="flex-row items-center flex-1">
            {paymentMethods[handleSelectedPayment].image ? (
              <Image
                source={{ uri: paymentMethods[handleSelectedPayment].image }}
                className="w-8 h-8 rounded"
                resizeMode="contain"
              />
            ) : (
              <View className="w-8 h-8 bg-gray-100 rounded items-center justify-center">
                <FontAwesome5 name="wallet" size={14} color="#6b7280" />
              </View>
            )}
            <View className="ml-3 flex-1">
              <Text className="font-bold text-gray-800 text-xs">
                {paymentMethods[handleSelectedPayment].method}
              </Text>
              <Text className="text-[10px] text-gray-500 mt-0.5" numberOfLines={1}>
                {paymentMethods[handleSelectedPayment].description}
              </Text>
            </View>
          </View>
        ) : (
          <Text className="text-gray-500 text-xs flex-1">Pilih Metode Pembayaran</Text>
        )}
        <FontAwesome5 name="chevron-right" size={12} color="#9ca3af" />
      </TouchableOpacity>

      <BlankBottomSheet
        type="full"
        isOpen={openSelectPayment}
        onClose={() => setOpenSelectPayment(false)}
      >
        <View className="p-4 flex-1">
          <View className="flex-row justify-between items-center mb-4 mt-2">
            <Text className="text-base font-bold text-gray-900">Pilih Metode Pembayaran</Text>
            <TouchableOpacity onPress={() => setOpenSelectPayment(false)} className="p-1">
              <FontAwesome5 name="times" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 space-y-3" showsVerticalScrollIndicator={false}>
            {paymentMethods.map((pm, index) => {
              const isSelected = handleSelectedPayment === index;
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  disabled={!pm.isAvailable}
                  onPress={() => handleSelectPayment(index)}
                  className={`flex-row items-center p-3.5 border rounded-xl mb-3 ${
                    !pm.isAvailable
                      ? "border-gray-200 bg-gray-50 opacity-60"
                      : isSelected
                      ? "border-green-600 bg-emerald-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {pm.image ? (
                    <Image
                      source={{ uri: pm.image }}
                      className="w-8 h-8 rounded"
                      resizeMode="contain"
                    />
                  ) : (
                    <View className="w-8 h-8 bg-gray-100 rounded items-center justify-center">
                      <FontAwesome5 name="money-bill-wave" size={14} color="#6b7280" />
                    </View>
                  )}
                  <View className="ml-3 flex-1">
                    <Text
                      className={`text-sm ${
                        !pm.isAvailable
                          ? "text-gray-400"
                          : isSelected
                          ? "text-green-800 font-bold"
                          : "text-gray-800 font-medium"
                      }`}
                    >
                      {pm.method}
                    </Text>
                    <Text className="text-[10px] text-gray-500 mt-0.5">{pm.description}</Text>
                  </View>
                  {isSelected && (
                    <FontAwesome5 name="check-circle" size={18} color="#16a34a" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </BlankBottomSheet>
        </>
      )}
    </View>
  );
};

export default PaymentWidget;
