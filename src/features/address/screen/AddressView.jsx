import React, { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import AppBar from "../../../components/AppBar";
import AddressContext from "../../../context/AddressContext";

const AddressView = () => {
  const navigation = useNavigation();
  const { allAddress, setAddress, getSelectAddress, deleteCustomerAddress, loading, getAddress } = useContext(AddressContext);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchSelection = async () => {
      const sel = await getSelectAddress();
      if (sel) {
        setSelectedAddressId(sel.id);
      }
    };
    fetchSelection();
  }, [allAddress]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (getAddress) await getAddress();
    } catch (e) {}
    setRefreshing(false);
  }, [getAddress]);

  const handleDelete = (id) => {
    if (Platform.OS === 'web') {
      if (window.confirm("Apakah Anda yakin ingin menghapus alamat ini?")) {
        deleteCustomerAddress(id);
      }
    } else {
      Alert.alert(
        "Hapus Alamat",
        "Apakah Anda yakin ingin menghapus alamat ini?",
        [
          { text: "Batal", style: "cancel" },
          { 
            text: "Hapus", 
            style: "destructive", 
            onPress: async () => {
              await deleteCustomerAddress(id);
            }
          }
        ]
      );
    }
  };

  const handleSelect = async (addr) => {
    setSelectedAddressId(addr.id);
    await setAddress(addr);
    // Usually we also update delivery charge, etc. But here we just set it.
  };

  const handleSimpanAlamat = async () => {
    const sel = await getSelectAddress();
    if (!sel || allAddress.length === 0) {
      Alert.alert("Perhatian", "Silakan tambahkan dan pilih alamat pengiriman terlebih dahulu.");
      return;
    }
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-gray-50">
      <AppBar title="Alamat Pengiriman" />

      <ScrollView 
        className="flex-1 px-4 pt-4" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#15803d"]} tintColor="#15803d" />}
      >
        {loading && !refreshing ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#15803d" />
            <Text className="text-gray-500 mt-2">Memuat alamat...</Text>
          </View>
        ) : allAddress && allAddress.length > 0 ? (
          allAddress.map((addr, index) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <TouchableOpacity
                key={addr.id || index}
                onPress={() => handleSelect(addr)}
                activeOpacity={0.8}
                className={`mb-3 p-4 border rounded-xl bg-white ${
                  isSelected ? "border-green-600 bg-emerald-50" : "border-gray-200"
                }`}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-bold text-gray-800 text-sm mb-1">
                      {addr.address_type === "home" ? "Rumah" : "Kantor"} | {addr.contact_person_name}
                    </Text>
                    <Text className="text-gray-500 text-xs mb-1">{addr.contact_person_number}</Text>
                    <Text className="text-gray-600 text-xs" numberOfLines={2}>
                      {addr.address}
                    </Text>
                  </View>
                  <View className="flex-row items-center ml-2 space-x-3">
                    <TouchableOpacity
                      onPress={(e) => { 
                        e.stopPropagation(); 
                        navigation.navigate("/address/edit/:id", { id: addr.id });
                      }}
                      className="p-2 z-10"
                    >
                      <FontAwesome5 name="pen" size={14} color="#15803d" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={(e) => { 
                        e.stopPropagation(); 
                        handleDelete(addr.id); 
                      }}
                      className="p-2 z-10"
                    >
                      <FontAwesome5 name="trash" size={14} color="#ef4444" />
                    </TouchableOpacity>
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ml-2 ${
                      isSelected ? "border-green-700" : "border-gray-300"
                    }`}>
                      {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-green-700" />}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="items-center py-10">
            <FontAwesome5 name="map-marker-alt" size={40} color="#d1d5db" />
            <Text className="text-gray-500 mt-4 text-center">Alamat belum ada, silakan tambahkan alamat baru.</Text>
          </View>
        )}
        <View className="h-24" />
      </ScrollView>

      {/* Bottom Actions */}
      <View
        className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100 flex-row gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
        style={{ paddingBottom: Platform.OS === 'android' ? 40 : 32 }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("/address/add")}
          className="flex-1 py-3.5 rounded-xl border border-green-700 items-center justify-center flex-row"
        >
          <FontAwesome5 name="plus" size={14} color="#15803d" />
          <Text className="text-green-700 font-bold ml-2 text-sm">Tambah Alamat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSimpanAlamat}
          className="flex-1 bg-green-700 py-3.5 rounded-xl items-center justify-center flex-row shadow-sm"
        >
          <FontAwesome5 name="check" size={14} color="#ffffff" />
          <Text className="text-white font-bold ml-2 text-sm">Simpan Alamat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddressView;
