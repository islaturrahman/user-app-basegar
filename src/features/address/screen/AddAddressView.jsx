import React, { useContext, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppBar from "../../../components/AppBar";
import { BlankBottomSheet } from "../../../components/BlankBottomSheet";
import AddressContext from "../../../context/AddressContext";
import { MapsContext } from "../../../provider/MapsProvider";
import { CustomerProvider } from "../../../provider/CustomerProvider";
import { ConfigContext } from "../../../provider/ConfigProvider";

// Haversine formula to calculate distance between two coordinates in km
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

const AddAddressView = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { addCustomerAddress } = useContext(AddressContext);
  const { getLacationBySearch, getAddressByCoords } = useContext(MapsContext);
  const { config } = useContext(ConfigContext) || {};

  const [searchResult, setSearchResult] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  const [mapUrl, setMapUrl] = useState("");
  const [address, setAddress] = useState({});
  const [confirmMap, setConfirmMap] = useState(false);
  const [isGPSLoading, setIsGPSLoading] = useState(false);

  const [addressType, setAddressType] = useState("home");
  const [addressDetail, setAddressDetail] = useState("");
  const [floor, setFloor] = useState("");

  // Nama & telepon diambil diam-diam dari akun, tidak ditampilkan ke user
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Coba dari cache lokal dulu
        const rawUser = await AsyncStorage.getItem("user");
        if (rawUser) {
          const u = JSON.parse(rawUser);
          const name = (u.f_name && u.l_name)
            ? `${u.f_name} ${u.l_name}`.trim()
            : u.f_name || u.name || u.first_name || "";
          const phone = u.phone || u.mobile || u.whatsapp || "";
          if (name || phone) {
            setContactName(name);
            setContactPhone(phone);
            return;
          }
        }

        // Fallback: fetch dari API
        const customerProvider = new CustomerProvider();
        const userModel = await customerProvider.getCustomer();
        if (userModel) {
          const u = userModel.getUser();
          if (u && u.id) {
            await AsyncStorage.setItem("user", JSON.stringify(u));
            const name = (u.f_name && u.l_name)
              ? `${u.f_name} ${u.l_name}`.trim()
              : u.f_name || u.name || u.first_name || "";
            const phone = u.phone || u.mobile || u.whatsapp || "";
            setContactName(name);
            setContactPhone(phone);
          }
        }
      } catch (e) {
        console.error("Failed to load user info", e);
      }
    };
    loadUser();
  }, []);

  // Listen for picked location from PickAddressView
  useEffect(() => {
    if (route.params?.pickedLocation) {
      const loc = route.params.pickedLocation;
      handleClickAddress({
        geometry: { lat: loc.lat, lng: loc.lng },
        structured_formatting: { main_text: loc.name },
        place_id: loc.placeId,
        description: loc.description
      });
      // Clear param
      navigation.setParams({ pickedLocation: undefined });
    }
  }, [route.params?.pickedLocation]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchTerm && searchTerm.trim().length >= 2) {
        setIsLoadingSearch(true);
        try {
          const response = await getLacationBySearch(searchTerm);
          setSearchResult(response.predictions || []);
        } catch {
          setSearchResult([]);
        } finally {
          setIsLoadingSearch(false);
        }
      } else {
        setSearchResult([]);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleGPSClick = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Akses lokasi diperlukan untuk menggunakan fitur ini.');
      return;
    }
    setIsGPSLoading(true);
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = await getAddressByCoords(location.coords.latitude, location.coords.longitude);
      if (result) {
        handleClickAddress(result);
      } else {
        Alert.alert('Error', 'Gagal mendapatkan alamat dari koordinat GPS.');
      }
    } catch {
      Alert.alert('Error', 'Gagal mendapatkan lokasi Anda.');
    } finally {
      setIsGPSLoading(false);
    }
  };

  const handleClickAddress = async (addr) => {
    if (!addr || !addr.geometry) return;
    const data = {
      lat: addr.geometry.lat,
      lng: addr.geometry.lng,
      name: addr.structured_formatting?.main_text || "Lokasi",
      placeId: addr.place_id,
      description: addr.description || `${addr.geometry.lat}, ${addr.geometry.lng}`,
    };
    setAddress(data);
    if (!addressDetail) setAddressDetail(data.description);
    setConfirmMap(false);
    setSearchTerm("");
  };

  const handleAddressSubmit = async () => {
    if (!contactName || !contactPhone || !addressDetail) {
      Alert.alert("Perhatian", "Mohon lengkapi Nama Penerima, Nomor Telepon, dan Alamat Lengkap.");
      return;
    }
    if (!address?.lat || !address?.lng) {
      Alert.alert("Perhatian", "Lokasi peta wajib dipilih. Gunakan tombol 'Cari / Pin Lokasi di Peta'.");
      return;
    }

    // Cek jangkauan (coverage)
    const storeLat = parseFloat(config?.ecommerce_location_coverage?.latitude || 0);
    const storeLng = parseFloat(config?.ecommerce_location_coverage?.longitude || 0);
    const storeCoverage = parseFloat(config?.ecommerce_location_coverage?.coverage || 0);

    if (storeLat !== 0 && storeLng !== 0 && storeCoverage > 0) {
      const distance = getDistance(storeLat, storeLng, address.lat, address.lng);
      if (distance > storeCoverage) {
        Alert.alert("Layanan Belum Tersedia", "Alamat yang dipilih berada di luar jangkauan pengiriman kami.");
        return;
      }
    }

    const formData = {
      contact_person_name: contactName || "Pelanggan",
      address_type: addressType,
      contact_person_number: contactPhone || "-",
      address: addressDetail,
      floor: floor,
      house: "",
      latitude: String(address.lat),
      longitude: String(address.lng),
    };

    try {
      await addCustomerAddress(formData);
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Gagal menyimpan alamat. Silakan coba lagi.");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <AppBar title="Tambah Alamat" />

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>

        {/* Banner Pilih di Peta */}
        {!address?.lat && (
          <TouchableOpacity
            onPress={() => navigation.navigate("/address/pick")}
            className="p-3.5 border border-green-200 rounded-2xl bg-emerald-50 flex-row items-center justify-between shadow-sm mb-4"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-9 h-9 bg-green-600 rounded-full items-center justify-center">
                <FontAwesome5 name="map-marked-alt" size={14} color="#fff" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-xs font-bold text-green-950">Pilih Langsung di Peta?</Text>
                <Text className="text-[10px] text-green-700 mt-0.5">Buka halaman interaktif</Text>
              </View>
            </View>
            <View className="bg-green-700 px-3 py-1.5 rounded-xl">
              <Text className="text-[10px] font-bold text-white">Buka Peta</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Map Preview */}
        {address?.lat ? (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => navigation.navigate("/address/pick")}
            className="h-40 w-full bg-gray-200 rounded-2xl overflow-hidden border border-gray-200 mb-4 relative"
          >
            <View pointerEvents="none" style={{ flex: 1 }}>
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                      <style>
                        body { padding: 0; margin: 0; }
                        html, body, #map { height: 100vh; width: 100vw; }
                      </style>
                    </head>
                    <body>
                      <div id="map"></div>
                      <script>
                        var map = L.map('map', { 
                          zoomControl: false, 
                          attributionControl: false,
                          dragging: false,
                          touchZoom: false,
                          scrollWheelZoom: false,
                          doubleClickZoom: false
                        }).setView([${address.lat}, ${address.lng}], 16);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
                        L.marker([${address.lat}, ${address.lng}]).addTo(map);
                      </script>
                    </body>
                    </html>
                  `
                }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Form */}
        <View className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-6">

          {/* Alamat Lengkap */}
          <Text className="text-xs font-bold text-gray-700 mb-1">Alamat Lengkap *</Text>
          <TextInput
            value={addressDetail}
            onChangeText={setAddressDetail}
            multiline
            numberOfLines={3}
            placeholder="Nama Jalan, No. Rumah, RT/RW, Kelurahan"
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium bg-white text-gray-800 mb-3"
            style={{ textAlignVertical: 'top' }}
          />

          {/* Patokan */}
          <Text className="text-xs font-bold text-gray-700 mb-1">Patokan Lokasi</Text>
          <TextInput
            value={floor}
            onChangeText={setFloor}
            placeholder="Contoh: Pagar Biru depan Masjid"
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium bg-white text-gray-800 mb-3"
          />

          {/* Nama & WA */}
          <Text className="text-xs font-bold text-gray-700 mb-1">Nama Penerima *</Text>
          <TextInput
            value={contactName}
            onChangeText={setContactName}
            placeholder="Contoh: Budi Santoso"
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium mb-3 bg-white text-gray-800"
          />

          <Text className="text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp *</Text>
          <TextInput
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
            placeholder="Contoh: 081234567890"
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium mb-3 bg-white text-gray-800"
          />

        </View>

        <View className="h-16" />
      </ScrollView>

      {/* Submit Button */}
      <View className="p-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleAddressSubmit}
          className="w-full py-3.5 bg-green-700 rounded-2xl items-center flex-row justify-center shadow-sm"
        >
          <FontAwesome5 name="save" size={14} color="#fff" />
          <Text className="text-white font-bold ml-2 text-sm">Simpan Alamat</Text>
        </TouchableOpacity>
      </View>

      {/* BottomSheet Cari Lokasi */}
      <BlankBottomSheet type="full" isOpen={confirmMap} onClose={() => setConfirmMap(false)}>
        <View className="p-4 flex-1">
          <View className="flex-row justify-between items-center mb-4 mt-2">
            <Text className="text-base font-bold text-gray-900">Cari Alamat Peta</Text>
            <TouchableOpacity onPress={() => setConfirmMap(false)} className="p-1">
              <FontAwesome5 name="times" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className="relative mb-3">
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Ketik nama jalan atau area..."
              className="w-full p-3.5 border border-gray-200 rounded-xl text-xs font-medium bg-white"
            />
            {isLoadingSearch && (
              <View className="absolute right-4 top-4">
                <ActivityIndicator size="small" color="#16a34a" />
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleGPSClick}
            className="p-3.5 border border-green-200 rounded-xl bg-green-50 flex-row items-center mb-4"
          >
            <View className="w-9 h-9 bg-green-600 rounded-full items-center justify-center">
              {isGPSLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome5 name="crosshairs" size={14} color="#fff" />
              )}
            </View>
            <View className="ml-3">
              <Text className="text-green-900 font-bold text-xs">Gunakan Lokasi Saat Ini (GPS)</Text>
              <Text className="text-green-700 text-[10px] mt-0.5">Deteksi koordinat otomatis</Text>
            </View>
          </TouchableOpacity>

          <ScrollView className="flex-1 border-t border-gray-100 mt-2">
            {isLoadingSearch ? (
              <Text className="text-center text-gray-500 py-6 text-xs">Mencari alamat...</Text>
            ) : searchResult && searchResult.length > 0 ? (
              searchResult.map((list, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleClickAddress(list)}
                  className="py-3.5 border-b border-gray-100 flex-row items-center"
                >
                  <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
                    <FontAwesome5 name="map-marker-alt" size={12} color="#4b5563" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-xs font-bold text-gray-800 mb-0.5" numberOfLines={1}>
                      {list.structured_formatting?.main_text || list.description}
                    </Text>
                    <Text className="text-[10px] text-gray-500" numberOfLines={2}>
                      {list.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-center text-gray-400 py-6 text-xs">
                Ketik nama jalan di atas atau pilih lokasi GPS.
              </Text>
            )}
          </ScrollView>
        </View>
      </BlankBottomSheet>
    </View>
  );
};

export default AddAddressView;
