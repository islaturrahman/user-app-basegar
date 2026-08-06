import React, { useContext, useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { WebView } from "react-native-webview";

import AppBar from "../../../components/AppBar";
import AddressContext from "../../../context/AddressContext";
import { MapsContext } from "../../../provider/MapsProvider";
import { ConfigContext } from "../../../provider/ConfigProvider";
import Snackbar from "../../../components/Snackbar";

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

const PickAddressView = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { setAddress } = useContext(AddressContext);
  const { getLacationBySearch, getAddressByCoords } = useContext(MapsContext);
  const { config } = useContext(ConfigContext) || {};
  
  const webViewRef = useRef(null);
  const mapDebounceTimeout = useRef(null);
  const isProgrammaticMove = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [mapCenter, setMapCenter] = useState({ lat: -6.2088, lng: 106.8456 }); // default Jakarta
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [snackbar, setSnackbar] = useState({ show: false, message: "" });

  const triggerSnackbar = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => {
      setSnackbar({ show: false, message: "" });
    }, 3000);
  };

  // Initial location (GPS)
  useEffect(() => {
    handleGPSClick(true);
  }, []);

  const handleGPSClick = async (isInitial = false) => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      if (!isInitial) Alert.alert('Izin Ditolak', 'Akses lokasi diperlukan.');
      return;
    }
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      flyToMap(lat, lng);
      fetchAddressFromCoords(lat, lng);
    } catch (error) {
      if (!isInitial) Alert.alert('Error', 'Gagal mendapatkan lokasi Anda.');
    }
  };

  const fetchAddressFromCoords = async (lat, lng) => {
    setIsFetchingAddress(true);
    try {
      const result = await getAddressByCoords(lat, lng);
      if (result) {
        setSelectedLocation({
          lat: lat,
          lng: lng,
          name: result.structured_formatting?.main_text || "Lokasi Peta",
          description: result.description || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          placeId: result.place_id
        });
      }
    } catch (e) {
      // fallback
    } finally {
      setIsFetchingAddress(false);
    }
  };

  const flyToMap = (lat, lng) => {
    isProgrammaticMove.current = true;
    setMapCenter({ lat, lng });
    if (webViewRef.current && isMapReady) {
      webViewRef.current.injectJavaScript(`
        if (window.map) {
          window.map.flyTo([${lat}, ${lng}], 16);
        }
        true;
      `);
    }
  };

  // Search logic (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchTerm && searchTerm.trim().length >= 2) {
        setIsLoading(true);
        try {
          const response = await getLacationBySearch(searchTerm);
          setSearchResult(response.predictions || []);
        } catch (error) {
          setSearchResult([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResult([]);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSelectSearchItem = async (item) => {
    setSearchTerm("");
    setSearchResult([]);
    if (!item.place_id) return;
    
    if (item.geometry) {
       const lat = item.geometry.lat;
       const lng = item.geometry.lng;
       flyToMap(lat, lng);
       fetchAddressFromCoords(lat, lng);
    }
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setIsMapReady(true);
        flyToMap(mapCenter.lat, mapCenter.lng);
      } else if (data.type === 'onMoveEnd') {
        if (isProgrammaticMove.current) {
          isProgrammaticMove.current = false;
          return; // Ignore programmatic moves to prevent double-fetching
        }

        if (mapDebounceTimeout.current) {
          clearTimeout(mapDebounceTimeout.current);
        }
        setIsFetchingAddress(true);
        mapDebounceTimeout.current = setTimeout(() => {
          fetchAddressFromCoords(data.lat, data.lng);
        }, 2000);
      }
    } catch (e) {}
  };

  // Cek jangkauan (coverage)
  const storeLat = parseFloat(config?.ecommerce_location_coverage?.latitude || 0);
  const storeLng = parseFloat(config?.ecommerce_location_coverage?.longitude || 0);
  const storeCoverage = parseFloat(config?.ecommerce_location_coverage?.coverage || 0);

  let isOutOfCoverage = false;
  if (selectedLocation && storeLat !== 0 && storeLng !== 0 && storeCoverage > 0) {
    const distance = getDistance(storeLat, storeLng, selectedLocation.lat, selectedLocation.lng);
    if (distance > storeCoverage) {
      isOutOfCoverage = true;
    }
  }

  const handleConfirmLocation = async () => {
    if (!selectedLocation) {
      Alert.alert("Perhatian", "Silakan pilih lokasi terlebih dahulu.");
      return;
    }

    if (isOutOfCoverage) {
      triggerSnackbar("Alamat yang dipilih belum ada layanan (Di luar jangkauan)");
      return;
    }
    navigation.navigate({
      name: "/address/add",
      params: { pickedLocation: selectedLocation },
      merge: true,
    });
  };

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100vh; width: 100vw; }
        .center-marker {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -100%);
          z-index: 1000;
          pointer-events: none;
          filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <!-- Center Pin Icon -->
      <svg class="center-marker" width="40" height="40" viewBox="0 0 24 24" fill="#dc2626" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
      </svg>
      <script>
        window.map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${mapCenter.lat}, ${mapCenter.lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(window.map);

        window.map.on('moveend', function() {
          var center = window.map.getCenter();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'onMoveEnd',
            lat: center.lat,
            lng: center.lng
          }));
        });
        
        setTimeout(() => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
        }, 500);
      </script>
    </body>
    </html>
  `;

  return (
    <View className="flex-1 bg-white relative">
      <AppBar title="Pilih Lokasi Alamat" />

      {/* Map Area */}
      <View className="flex-1 relative">
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          scrollEnabled={false}
          bounces={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: '#e5e7eb' }}
        />
        
        {/* Search Overlay */}
        <View className="absolute top-4 left-4 right-4 z-50">
          <View className="flex-row items-center border border-gray-200 bg-white rounded-2xl shadow-sm px-4">
            <FontAwesome5 name="search" size={14} color="#9ca3af" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Cari area atau jalan..."
              className="flex-1 p-3.5 text-xs font-medium bg-transparent text-gray-800"
            />
            {searchTerm ? (
              <TouchableOpacity onPress={() => { setSearchTerm(""); setSearchResult([]); }} className="p-2">
                <FontAwesome5 name="times" size={14} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>

          {isLoading ? (
            <View className="mt-2 w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-md flex-row items-center justify-center space-x-2">
              <ActivityIndicator size="small" color="#16a34a" />
              <Text className="text-gray-500 text-xs ml-2">Mencari lokasi...</Text>
            </View>
          ) : searchResult.length > 0 ? (
            <View className="mt-2 w-full max-h-60 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
              <ScrollView>
                {searchResult.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelectSearchItem(item)}
                    className="p-3 border-b border-gray-50 flex-row items-start space-x-3"
                  >
                    <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mt-0.5">
                      <FontAwesome5 name="map-marker-alt" size={12} color="#15803d" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-xs font-bold text-gray-800 mb-0.5" numberOfLines={1}>
                        {item.structured_formatting?.main_text || item.description}
                      </Text>
                      <Text className="text-[10px] text-gray-500" numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

        {/* GPS Button Overlay */}
        <TouchableOpacity
          onPress={() => handleGPSClick(false)}
          style={{ bottom: Platform.OS === 'android' ? 46 : 24 }}
          className="absolute right-4 w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg border border-gray-200 z-50"
        >
          <FontAwesome5 name="crosshairs" size={16} color="#15803d" />
        </TouchableOpacity>
      </View>

      {/* Bottom Action Area */}
      <View
        className="bg-white rounded-t-3xl p-5 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] border-t border-gray-100 z-50 min-h-[170px] justify-between"
        style={{ paddingBottom: Platform.OS === 'android' ? 40 : 20 }}
      >
        <View className="flex-1 justify-center">
          {isFetchingAddress ? (
            <View className="flex-row items-center mb-4">
              <ActivityIndicator size="small" color="#16a34a" />
              <Text className="ml-3 text-xs text-gray-500 font-medium">Mendapatkan detail alamat...</Text>
            </View>
          ) : selectedLocation ? (
            <View className="mb-4">
              <View className="flex-row items-center mb-1">
                <FontAwesome5 name="map-marker-alt" size={12} color="#16a34a" />
                <Text className="text-[10px] font-bold text-green-700 uppercase tracking-wider ml-1.5">Lokasi Terpilih</Text>
              </View>
              <Text className="text-sm font-bold text-gray-900 mb-1" numberOfLines={1}>{selectedLocation.name}</Text>
              <Text className="text-xs text-gray-600 leading-relaxed" numberOfLines={2}>{selectedLocation.description}</Text>
            </View>
          ) : (
            <View className="mb-4 flex-row items-center space-x-3">
               <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center">
                  <FontAwesome5 name="hand-pointer" size={12} color="#6b7280" />
               </View>
               <Text className="text-xs text-gray-500 flex-1 leading-relaxed">Geser peta untuk menentukan titik lokasi alamat pengiriman yang tepat.</Text>
            </View>
          )}
        </View>

        <View>
          {isOutOfCoverage && (
            <View className="mb-3 py-2 px-3 bg-red-50 border border-red-200 rounded-lg flex-row items-center justify-center">
              <FontAwesome5 name="exclamation-circle" size={12} color="#dc2626" />
              <Text className="text-red-700 text-xs font-bold ml-2">Belum ada pelayanan di alamat ini</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleConfirmLocation}
            disabled={!selectedLocation || isFetchingAddress || isOutOfCoverage}
            className={`w-full py-3.5 rounded-2xl items-center flex-row justify-center ${(!selectedLocation || isFetchingAddress || isOutOfCoverage) ? 'bg-gray-300' : 'bg-green-700'}`}
          >
            <FontAwesome5 name="check-circle" size={14} color="#fff" />
            <Text className="text-white font-bold ml-2 text-sm">Gunakan Lokasi Ini</Text>
          </TouchableOpacity>
        </View>
      </View>

      {snackbar.show && <Snackbar type="alert" message={snackbar.message} />}
    </View>
  );
};

export default PickAddressView;
