import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { TimeSlotContext } from "../provider/TimeSlotProvider";
import ProductsContext from "../../../context/ProductsContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TimeSlotWidget = () => {
  const {
    timeslot,
    dateslot,
    getTimeSlotByIndex,
    selectedTimeSlot,
    clearTimeSlotId,
  } = useContext(TimeSlotContext);
  
  const { deliveryDate } = useContext(ProductsContext) || {};

  const [selectedTimeIndex, setSelectedTimeIndex] = useState(null);
  const [savedTimeId, setSavedTimeId] = useState(null);
  
  const loadedData = React.useRef(false);
  const lastFetchedDateIndex = React.useRef(null);

  useEffect(() => {
    const fetchTimeSlotByDeliveryDate = async () => {
      // Tunggu sampai dateslot di-load oleh provider
      const targetDateIndex = deliveryDate || "today";
      
      if (dateslot && dateslot.length > 0) {
        // Jangan fetch ulang jika kombinasi dateslot (sudah diload) dan deliveryDate belum berubah
        if (!loadedData.current || lastFetchedDateIndex.current !== targetDateIndex) {
            loadedData.current = true;
            lastFetchedDateIndex.current = targetDateIndex;
            
            const foundIndex = dateslot.findIndex(d => d.index === targetDateIndex);
            
            if (foundIndex !== -1) {
              const selectedDate = dateslot[foundIndex];
              if (!selectedDate.isAvailable) {
                 if (clearTimeSlotId) await clearTimeSlotId();
                 setSavedTimeId(null);
              } else {
                 // Dapatkan ID timeslot yang tersimpan sebelumnya (kalau ada)
                 const savedTimeIdStr = await AsyncStorage.getItem("timeslotId");
                 if (savedTimeIdStr) setSavedTimeId(parseInt(savedTimeIdStr, 10));
                 
                 // Panggil API untuk mendapatkan jam pengiriman hari tersebut
                 if (getTimeSlotByIndex) await getTimeSlotByIndex(targetDateIndex);
              }
            }
        }
      }
    };
    
    fetchTimeSlotByDeliveryDate();
  }, [dateslot, deliveryDate]);

  const handleSelectTime = async (index, slot) => {
    setSelectedTimeIndex(index);
    setSavedTimeId(slot.id);
    if (selectedTimeSlot) await selectedTimeSlot(slot);
  };

  const renderDeliveryDateLabel = () => {
      if (!deliveryDate || deliveryDate === "today") return "Hari ini";
      if (deliveryDate === "1") return "Besok";
      return "Tanggal Terpilih";
  };

  return (
    <View className="bg-white p-4">
      <View className="flex-row items-center mb-3">
        <Text className="font-bold text-gray-800 text-[15px]">Jadwal Pengantaran</Text>
        <View className="bg-green-100 ml-3 px-2 py-1 rounded">
          <Text className="text-green-700 text-xs font-bold">{renderDeliveryDateLabel()}</Text>
        </View>
      </View>
      
      {/* Time Slots (Horizontal Scroll) */}
      {(() => {
        const targetDateIndex = deliveryDate || "today";
        const selectedDate = dateslot?.find(d => d.index === targetDateIndex);
        
        if (timeslot && timeslot.length > 0) {
          return (
            <View className="mt-1">
              <Text className="text-xs font-medium text-gray-500 mb-2">
                Pilih Jam Pengiriman:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {timeslot.map((slot, index) => {
                  const isSelected = selectedTimeIndex === index || savedTimeId === slot.id;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      onPress={() => handleSelectTime(index, slot)}
                      className={`px-4 py-2 mr-2 rounded-full border ${
                        isSelected
                          ? "bg-emerald-50 border-green-500"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          isSelected ? "text-green-800 font-bold" : "text-gray-600"
                        }`}
                      >
                        {slot.start_time} - {slot.end_time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          );
        } else if (selectedDate && !selectedDate.isAvailable) {
          return (
            <View className="mt-1">
              <Text className="text-xs font-medium text-gray-500 mb-2">
                Pilih Jam Pengiriman:
              </Text>
              <Text className="text-xs text-red-500 italic font-medium p-2 bg-red-50 rounded border border-red-100">
                Maaf, tidak ada jam pengantaran yang tersedia untuk {targetDateIndex === "today" ? "hari ini" : "besok"}. Waktu pemesanan mungkin sudah lewat.
              </Text>
            </View>
          );
        } else {
          return (
            <View className="mt-1">
              <Text className="text-xs text-green-600 italic mb-2 font-medium">Menyesuaikan slot waktu, mohon tunggu...</Text>
              <View className="flex-row mt-2">
                {[1, 2, 3].map((n) => (
                  <View key={n} className="h-8 w-24 bg-gray-200 rounded-full mr-2 animate-pulse" />
                ))}
              </View>
            </View>
          );
        }
      })()}
    </View>
  );
};

export default TimeSlotWidget;
