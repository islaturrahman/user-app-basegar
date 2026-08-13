import React, { useState, useContext, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, User, Phone, Lock, Check } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CustomerProvider } from "../../../provider/CustomerProvider";
import { base_url } from "../../../config/enpoints";

export default function EditProfileView() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    f_name: "",
    l_name: "",
    phone: "",
    password: "",
  });
  
  const [loading, setLoading] = useState(false);

  const getCustomerInfo = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && (parsed.id || parsed.f_name)) {
          setUser(parsed);
        }
      }

      const customerProvider = new CustomerProvider();
      const userModel = await customerProvider.getCustomer();
      if (userModel) {
        const userData = userModel.getUser();
        if (userData && (userData.id || userData.f_name)) {
          setUser(userData);
          await AsyncStorage.setItem("user", JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error("Get customer info error:", error.message);
    }
  };

  useEffect(() => {
    getCustomerInfo();
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        f_name: user.f_name || "",
        l_name: user.l_name || "",
        phone: user.phone || "",
        password: "",
      });
    }
  }, [user]);

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.f_name.trim()) return "Nama depan wajib diisi.";
    if (!form.l_name.trim()) return "Nama belakang wajib diisi.";
    if (!form.phone.trim()) return "Nomor HP wajib diisi.";
    if (form.password && form.password.length < 6) return "Password minimal 6 karakter.";
    return null;
  };

  const handleSave = async () => {
    const errorMsg = validate();
    if (errorMsg) {
      Alert.alert("Gagal", errorMsg);
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      
      const formData = new FormData();
      formData.append("_method", "PUT"); // Laravel workaround untuk form-data di method PUT
      formData.append("f_name", form.f_name);
      formData.append("l_name", form.l_name);
      formData.append("phone", form.phone);
      
      if (form.password) {
        formData.append("password", form.password);
      }
      const response = await fetch(`${base_url}/api/v1/customer/update-profile`, {
        method: "POST", // Diubah menjadi POST karena Laravel tidak dapat membaca multipart/form-data via PUT
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          // Content-Type diatur otomatis oleh fetch saat menggunakan FormData
        },
        body: formData,
      });

      const json = await response.json();
      
      if (response.ok || (json.message && json.message.includes("successfully"))) {
        Alert.alert("Sukses", "Profil berhasil diperbarui!");
        navigation.goBack();
      } else {
        const errorText = json.errors ? json.errors.map(e => e.message).join(", ") : (json.message || "Gagal menyimpan profil.");
        Alert.alert("Gagal", errorText);
      }
    } catch (err) {
      console.log("Error updating profile:", err);
      Alert.alert("Error", "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50" 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View className={`bg-green-700 pb-4 px-4 ${Platform.OS === 'web' ? 'pt-4' : 'pt-12'} rounded-b-3xl shadow-sm flex-row items-center justify-between`}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-white/20 rounded-full">
          <ArrowLeft size={20} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="text-white text-base font-poppins-semibold tracking-wide">
          Ubah Akun
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Profile Picture Placeholder */}
        <View className="items-center mb-8">
          <View className="w-28 h-28 bg-green-100 rounded-full items-center justify-center border-4 border-white shadow-sm">
            <Text className="text-4xl font-poppins-semibold text-green-700">
              {form.f_name ? form.f_name.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
        </View>

        {/* Form Fields */}
        <View className="space-y-4">
          
          <View>
            <Text className="text-xs font-poppins-semibold text-gray-700 mb-1.5 ml-1">Nama Depan</Text>
            <View className="flex-row items-center bg-white rounded-2xl px-4 py-3.5 border border-gray-200">
              <User size={18} color="#9ca3af" className="mr-3" />
              <TextInput
                value={form.f_name}
                onChangeText={(val) => handleChange("f_name", val)}
                placeholder="Masukkan nama depan"
                placeholderTextColor="#9ca3af"
                className="flex-1 text-sm font-poppins-medium text-gray-800 p-0"
              />
            </View>
          </View>

          <View>
            <Text className="text-xs font-poppins-semibold text-gray-700 mb-1.5 ml-1">Nama Belakang</Text>
            <View className="flex-row items-center bg-white rounded-2xl px-4 py-3.5 border border-gray-200">
              <User size={18} color="#9ca3af" className="mr-3" />
              <TextInput
                value={form.l_name}
                onChangeText={(val) => handleChange("l_name", val)}
                placeholder="Masukkan nama belakang"
                placeholderTextColor="#9ca3af"
                className="flex-1 text-sm font-poppins-medium text-gray-800 p-0"
              />
            </View>
          </View>

          <View>
            <Text className="text-xs font-poppins-semibold text-gray-700 mb-1.5 ml-1">Nomor HP</Text>
            <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3.5 border border-gray-200">
              <Phone size={18} color="#9ca3af" className="mr-3" />
              <TextInput
                value={form.phone}
                onChangeText={(val) => handleChange("phone", val)}
                placeholder="0812xxxxxx"
                keyboardType="phone-pad"
                placeholderTextColor="#9ca3af"
                className="flex-1 text-sm font-poppins-medium text-gray-500 p-0"
                editable={false} // Biasanya nomor HP dari API login tidak bisa diubah mudah tanpa verifikasi, ubah jika perlu
              />
            </View>
            <Text className="text-[10px] text-gray-400 mt-1 ml-2">*Nomor HP digunakan untuk login dan pengiriman</Text>
          </View>

          <View>
            <Text className="text-xs font-poppins-semibold text-gray-700 mb-1.5 ml-1">Password Baru (Opsional)</Text>
            <View className="flex-row items-center bg-white rounded-2xl px-4 py-3.5 border border-gray-200">
              <Lock size={18} color="#9ca3af" className="mr-3" />
              <TextInput
                value={form.password}
                onChangeText={(val) => handleChange("password", val)}
                placeholder="Kosongkan jika tidak ingin mengubah"
                secureTextEntry
                placeholderTextColor="#9ca3af"
                className="flex-1 text-sm font-poppins-medium text-gray-800 p-0"
              />
            </View>
          </View>

        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
          className={`mt-10 rounded-2xl py-4 flex-row justify-center items-center ${loading ? 'bg-green-400' : 'bg-green-600'} shadow-md shadow-green-200`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Check size={20} color="#fff" className="mr-2" strokeWidth={2.5} />
              <Text className="text-white text-sm font-poppins-semibold">Simpan Perubahan</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
