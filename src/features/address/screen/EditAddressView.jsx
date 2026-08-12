import React, { useContext, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, Switch, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Location from 'expo-location';

import AppBar from "../../../components/AppBar";
import { BlankBottomSheet } from "../../../components/BlankBottomSheet";
import AddressContext from "../../../context/AddressContext";
import { MapsContext } from "../../../provider/MapsProvider";
import { apiRequest, post } from "../../../data/api";
import { address as addressEndpoint } from "../../../config/enpoints";

const EditAddressView = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};

  const { allAddress, getAddress, updateCustomerAddress } = useContext(AddressContext);
  const { getLacationBySearch, getAddressByCoords } = useContext(MapsContext);
  
  const [searchResult, setSearchResult] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  
  const [mapUrl, setMapUrl] = useState("");
  const [address, setAddress] = useState({});
  const [confirmMap, setConfirmMap] = useState(false);
  const [isGPSLoading, setIsGPSLoading] = useState(false);
  
  const [useAccountInfo, setUseAccountInfo] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressType, setAddressType] = useState("home"); // home / office
  
  const [addressDetail, setAddressDetail] = useState("");
  const [floor, setFloor] = useState("");
  const [house, setHouse] = useState("");

  useEffect(() => {
    if (id && allAddress.length > 0) {
      const data = allAddress.find((addr) => String(addr.id) === String(id));
      if (data) {
        setRecipientName(data.contact_person_name || "");
        setRecipientPhone(data.contact_person_number || "");
        setAddressDetail(data.address || "");
        setFloor(data.floor || "");
        setHouse(data.house || "");
        setAddressType(data.address_type || "home");

        if (data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          const mockPlace = {
            geometry: { lat, lng },
            description: data.address,
            place_id: `old_${data.id}`
          };
          handleClickAddress(mockPlace, false); // Initialize map but don't clear form
        }
      }
    }
  }, [id, allAddress]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchTerm && searchTerm.trim().length >= 2) {
        setIsLoadingSearch(true);
        try {
          const response = await getLacationBySearch(searchTerm);
          setSearchResult(response.predictions || []);
        } catch (error) {
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
    } catch (error) {
      Alert.alert('Error', 'Gagal mendapatkan lokasi Anda.');
    } finally {
      setIsGPSLoading(false);
    }
  };

  const handleClickAddress = async (addr, overrideAddress = true) => {
    if (!addr || !addr.geometry) return;
    
    const data = {
      lat: addr.geometry.lat,
      lng: addr.geometry.lng,
      name: addr.structured_formatting?.main_text || "Lokasi",
      placeId: addr.place_id,
      description: addr.description || `${addr.geometry.lat}, ${addr.geometry.lng}`,
    };

    const zoom = 15;
    const width = 600;
    const height = 300;
    const osmStaticUrl = `https://static-maps.yandex.ru/1.x/?ll=${data.lng},${data.lat}&size=${width},${height}&z=${zoom}&l=map&pt=${data.lng},${data.lat},pm2gnm`;

    setMapUrl(osmStaticUrl);
    setAddress(data);
    
    if (overrideAddress) {
       setAddressDetail(data.description);
    }
    
    setConfirmMap(false);
    setSearchTerm("");
  };

  const handleAddressSubmit = async () => {
    if (!recipientName || !recipientPhone || !addressDetail) {
      Alert.alert("Perhatian", "Mohon lengkapi Nama Penerima, Nomor Telepon, dan Alamat Lengkap.");
      return;
    }

    if (!address?.lat || !address?.lng) {
      Alert.alert("Perhatian", "Lokasi GPS/Peta wajib didapatkan. Gunakan tombol 'Cari / Pin Lokasi di Peta'.");
      return;
    }

    const formData = {
      id: id,
      contact_person_name: recipientName,
      address_type: addressType,
      contact_person_number: recipientPhone,
      address: addressDetail,
      floor: floor,
      house: house,
      latitude: String(address.lat),
      longitude: String(address.lng),
    };

    try {
      const resp = await updateCustomerAddress(id, formData);
      if (resp && resp.status === false) {
        Alert.alert("Error", resp.message || "Gagal menyimpan perubahan alamat.");
      } else {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert("Error", "Terjadi kesalahan saat menyimpan alamat.");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <AppBar title="Edit Alamat" />

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        
        {/* Map Preview Card */}
        {mapUrl ? (
          <TouchableOpacity 
            onPress={() => setConfirmMap(true)}
            activeOpacity={0.9}
            className="h-40 w-full bg-gray-200 rounded-2xl overflow-hidden border border-gray-200 mb-4"
          >
            <Image source={{ uri: mapUrl }} className="w-full h-full" resizeMode="cover" />
            <View className="absolute top-3 right-3 bg-white p-2.5 rounded-full shadow-sm">
              <FontAwesome5 name="pen" size={12} color="#4b5563" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => setConfirmMap(true)}
            className="w-full p-4 border border-dashed border-green-300 rounded-2xl bg-green-50 flex-row items-center justify-center mb-4 space-x-2"
          >
            <FontAwesome5 name="location-arrow" size={14} color="#16a34a" />
            <Text className="text-green-800 font-bold text-xs ml-2">Cari / Pin Lokasi di Peta</Text>
          </TouchableOpacity>
        )}

        {/* Main Address Form */}
        <View className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-6">

          {/* Tipe Alamat (Label) */}
          <Text className="text-xs font-bold text-gray-700 mb-2">Simpan Sebagai *</Text>
          <View className="flex-row space-x-3 mb-4">
            <TouchableOpacity 
              onPress={() => setAddressType("home")}
              className={`flex-1 py-2 rounded-lg border flex-row items-center justify-center space-x-2 ${addressType === "home" ? "bg-green-50 border-green-600" : "bg-white border-gray-200"}`}
            >
              <FontAwesome5 name="home" size={12} color={addressType === "home" ? "#16a34a" : "#6b7280"} />
              <Text className={`text-xs font-bold ${addressType === "home" ? "text-green-700" : "text-gray-600"}`}>Rumah</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setAddressType("office")}
              className={`flex-1 py-2 rounded-lg border flex-row items-center justify-center space-x-2 ${addressType === "office" ? "bg-green-50 border-green-600" : "bg-white border-gray-200"}`}
            >
              <FontAwesome5 name="building" size={12} color={addressType === "office" ? "#16a34a" : "#6b7280"} />
              <Text className={`text-xs font-bold ${addressType === "office" ? "text-green-700" : "text-gray-600"}`}>Kantor</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setAddressType("other")}
              className={`flex-1 py-2 rounded-lg border flex-row items-center justify-center space-x-2 ${addressType === "other" ? "bg-green-50 border-green-600" : "bg-white border-gray-200"}`}
            >
              <FontAwesome5 name="map-marker-alt" size={12} color={addressType === "other" ? "#16a34a" : "#6b7280"} />
              <Text className={`text-xs font-bold ${addressType === "other" ? "text-green-700" : "text-gray-600"}`}>Lainnya</Text>
            </TouchableOpacity>
          </View>

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

          <Text className="text-xs font-bold text-gray-700 mb-1">Patokan Lokasi</Text>
          <TextInput
            value={floor}
            onChangeText={setFloor}
            placeholder="Contoh: Pagar Biru depan Masjid"
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium bg-white text-gray-800 mb-3"
          />

          <Text className="text-xs font-bold text-gray-700 mb-1">Nama Penerima *</Text>
          <TextInput
            value={recipientName}
            onChangeText={setRecipientName}
            placeholder="Contoh: Budi Santoso"
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium mb-3 bg-white text-gray-800"
          />

          <Text className="text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp *</Text>
          <TextInput
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            keyboardType="phone-pad"
            placeholder="Contoh: 081234567890"
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium mb-3 bg-white text-gray-800"
          />

          <Text className="text-xs font-bold text-gray-700 mb-1">Catatan Pengiriman</Text>
          <TextInput
            value={house}
            onChangeText={setHouse}
            placeholder="Instruksi untuk kurir..."
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-medium bg-white text-gray-800 mb-3"
          />
          
          <View className="flex-row flex-wrap mt-1">
            {["WA Penerima", "Titip satpam", "Depan pintu"].map((note, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setHouse(note)}
                className="bg-gray-100 rounded-full px-3 py-1.5 mr-2 mb-2"
              >
                <Text className="text-[10px] text-gray-700">{note}</Text>
              </TouchableOpacity>
            ))}
          </View>

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
          <Text className="text-white font-bold ml-2 text-sm">Simpan Perubahan</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Search Location BottomSheet */}
      <BlankBottomSheet
        type="full"
        isOpen={confirmMap}
        onClose={() => setConfirmMap(false)}
      >
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

export default EditAddressView;
