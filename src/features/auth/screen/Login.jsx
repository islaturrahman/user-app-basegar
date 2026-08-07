import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, DeviceEventEmitter } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome5 } from "@expo/vector-icons";

import { check_phone, phone_verify } from "../../../config/enpoints";
import { formatNumberPhone } from "../../../components/Helper";
import { post } from "../../../data/api";
import { Loader } from "../../../components/Loader";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [step, setStep] = useState("phone"); // "phone", "otp"
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (token && token !== "undefined") {
        navigation.replace("/account"); // Navigate to account if already logged in
      }
    };
    checkToken();
  }, [navigation]);

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      setError("Tolong masukkan nomor HP anda");
      return;
    }

    // Bersihkan karakter selain angka dan +
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const digitOnly = cleanPhone.replace(/\D/g, '');

    // Izinkan nomor telepon dengan panjang 10 hingga 14 digit angka (misal: 08123456789 = 11 digit)
    if (digitOnly.length < 10 || digitOnly.length > 14) {
      setError("Nomor HP tidak valid. Masukkan 10-14 digit angka.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const formattedPhoneNumber = formatNumberPhone(cleanPhone);
      const response = await post(check_phone, {
        phone: formattedPhoneNumber,
      });

      if (response && response.token === "active") {
        if (response.waSent) {
          setIsNewUser(!response.is_exists);
          setStep("otp");
        } else {
          setError(response.message || "Gagal mengirim OTP via WhatsApp");
        }
      } else {
        setError(response.message || "Gagal mengirim OTP");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.message || 
        "Gagal mengirim OTP. Pastikan nomor HP benar dan WhatsApp Service aktif."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError("Tolong masukkan kode OTP anda");
      return;
    }
    if (isNewUser && !fullName) {
      setError("Nama lengkap wajib diisi untuk pendaftaran baru");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const formattedPhoneNumber = formatNumberPhone(phoneNumber);
      const payload = {
        phone: formattedPhoneNumber,
        token: otp,
      };

      if (isNewUser) {
        const [f_name, ...rest] = fullName.split(" ");
        const l_name = rest.join(" ");
        payload.f_name = f_name;
        payload.l_name = l_name || "";
      }

      const response = await post(phone_verify, payload);

      if (response && response.status && response.token) {
        await AsyncStorage.setItem("authToken", response.token);
        DeviceEventEmitter.emit('authStateChanged', true);
        
        // Reset and go to Home or Account
        navigation.reset({
          index: 0,
          routes: [{ name: "/" }],
        });
      } else {
        setError("Gagal memverifikasi OTP");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.message || 
        "Kode OTP salah atau kedaluwarsa."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader type="full" isLoading={true} />;
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="bg-[#F4F7F1]"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className={`${Platform.OS === 'web' ? 'pt-6' : 'pt-14'} px-6 mb-8 flex-row items-center z-10`}>
          <TouchableOpacity 
            onPress={() => {
              if (step === "otp") {
                setStep("phone");
              } else if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.replace("/"); // or navigation.navigate("/")
              }
            }}
            className="flex-row items-center"
          >
            <FontAwesome5 name="arrow-left" size={20} color="#15803d" />
            <Text className="text-lg text-green-700 font-bold ml-4">Akun</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View className="px-6 mb-16 z-10 items-center">
          <View className="items-center justify-center">
            {/* Logo Mark Approximation */}
            <View className="w-24 h-24 items-center justify-center relative mb-2 mt-4">
              {/* Outer Drop */}
              <View 
                style={{
                  width: 72, height: 72,
                  borderTopLeftRadius: 36, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, borderTopRightRadius: 4,
                  transform: [{ rotate: '-45deg' }],
                  borderWidth: 9,
                  borderColor: '#0f5132', // Dark Green
                }}
                className="items-center justify-center absolute"
              />
              {/* Inner Circle / Element */}
              <View 
                style={{
                  width: 28, height: 28,
                  borderRadius: 14,
                  borderWidth: 6,
                  borderColor: '#f59e0b', // Orange
                  transform: [{ rotate: '45deg' }, { translateX: -1 }, { translateY: 1 }]
                }}
                className="absolute"
              />
            </View>
            <Text className="text-[36px] font-extrabold tracking-tight mt-1">
              <Text style={{ color: '#0f5132' }}>Base</Text>
              <Text style={{ color: '#f59e0b' }}>gar</Text>
            </Text>
          </View>
        </View>

        {/* Form Container */}
        <View className="px-6 flex-1 z-10">
          <Text className="text-[22px] font-bold text-gray-900 mb-2">
            {step === "phone" ? "Selamat Datang di Basegar!" : "Verifikasi OTP"}
          </Text>
          <Text className="text-gray-500 text-sm mb-6 pr-4">
            {step === "phone"
              ? "Masukkan nomor HP Anda untuk melanjutkan"
              : "Masukkan kode OTP yang kami kirimkan ke nomor WhatsApp Anda"}
          </Text>

          {/* Inputs */}
          <View className="space-y-4">
            {step === "phone" && (
              <View className="mb-4">
                <TextInput
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (error) setError("");
                  }}
                  placeholder="081xxx"
                  className={`w-full p-4 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-xl text-center font-medium text-gray-700 bg-white`}
                  style={{ fontSize: 16 }}
                />
                {!!error && <Text className="text-red-500 text-xs mt-1.5 ml-1">{error}</Text>}
              </View>
            )}

            {step === "otp" && (
              <>
                {isNewUser && (
                  <View className="mb-4">
                    <TextInput
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        if (error) setError("");
                      }}
                      placeholder="Nama Lengkap Anda"
                      className={`w-full p-4 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-xl text-center font-medium text-gray-700 bg-white`}
                      style={{ fontSize: 16 }}
                    />
                  </View>
                )}
                <View className="mb-4">
                  <TextInput
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text);
                      if (error) setError("");
                    }}
                    maxLength={6}
                    placeholder="xxxxxx"
                    className={`w-full p-4 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-xl text-center font-bold tracking-widest text-xl text-gray-700 bg-white`}
                  />
                  {!!error && <Text className="text-red-500 text-xs mt-1.5 ml-1">{error}</Text>}
                </View>
              </>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={step === "phone" ? handleSendOtp : handleVerifyOtp}
              className="w-full bg-[#2E8B1F] py-4 rounded-xl items-center mt-2 shadow-sm"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-base">LANJUT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Policy Links */}
        <View className="px-6 mt-8">
          <View className="flex-row justify-center items-center flex-wrap mt-2">
            <TouchableOpacity onPress={() => navigation.navigate("/about-us")}>
              <Text className="text-[#15803d] text-[11px] font-medium">Tentang Kami</Text>
            </TouchableOpacity>
            <Text className="text-gray-300 mx-2">•</Text>
            <TouchableOpacity onPress={() => navigation.navigate("/privacy-policy")}>
              <Text className="text-[#15803d] text-[11px] font-medium">Kebijakan Privasi</Text>
            </TouchableOpacity>
            <Text className="text-gray-300 mx-2">•</Text>
            <TouchableOpacity onPress={() => navigation.navigate("/terms-and-conditions")}>
              <Text className="text-[#15803d] text-[11px] font-medium">Syarat & Ketentuan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Decorative Bottom Right Image (Placeholder or empty space to keep UI balanced) */}
        {/* We can skip the exact image since it's a web asset, but we leave space */}
        <View className="h-20" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
