import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { TimeSlotContext } from "../provider/TimeSlotProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TimeSlotWidget = () => {
  const {
    timeslot,
    dateslot,
    getTimeSlotByIndex,
    selectedTimeSlot,
    clearTimeSlotId,
  } = useContext(TimeSlotContext);

  const [selectedDateIndex, setSelectedDateIndex] = useState(null);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(null);
  const [savedTimeId, setSavedTimeId] = useState(null);

  const loadedData = React.useRef(false);

  useEffect(() => {
    const fetchSavedData = async () => {
      // Hanya jalankan jika dateslot sudah terisi dan belum pernah load sukses
      if (dateslot && dateslot.length > 0 && !loadedData.current) {
        loadedData.current = true;
        const savedDateIndexStr = await AsyncStorage.getItem("dateslotIndex");
        const savedTimeIdStr = await AsyncStorage.getItem("timeslotId");
        
        if (savedDateIndexStr) {
          const foundIndex = dateslot.findIndex(d => d.index === savedDateIndexStr);
          if (foundIndex !== -1) {
             if (!dateslot[foundIndex].isAvailable) {
               await AsyncStorage.multiRemove(["dateslotIndex", "dateslot", "timeslotId"]);
               setSelectedDateIndex(null);
               setSavedTimeId(null);
               if (clearTimeSlotId) await clearTimeSlotId();
             } else {
               setSelectedDateIndex(foundIndex);
               // Jangan panggil getTimeSlotByIndex di sini, biar triggerDateFetch yang memanggil
               if (savedTimeIdStr) setSavedTimeId(parseInt(savedTimeIdStr, 10));
             }
          }
        } else if (savedTimeIdStr) {
           setSavedTimeId(parseInt(savedTimeIdStr, 10));
        }
      }
    };
    fetchSavedData();
  }, [dateslot]);

  const handleSelectDate = async (index) => {
    setSelectedDateIndex(index);
    setSelectedTimeIndex(null);
    setSavedTimeId(null);
    const selectedDate = dateslot?.[index];
    if (selectedDate) {
      if (clearTimeSlotId) await clearTimeSlotId();
      if (getTimeSlotByIndex) await getTimeSlotByIndex(selectedDate.index);
    }
  };

  const handleSelectTime = async (index, slot) => {
    setSelectedTimeIndex(index);
    setSavedTimeId(slot.id);
    if (selectedTimeSlot) await selectedTimeSlot(slot);
  };

  useEffect(() => {
    const triggerDateFetch = async () => {
      if (selectedDateIndex !== null) {
        const selectedDate = dateslot?.[selectedDateIndex];
        if (selectedDate && getTimeSlotByIndex) {
          await getTimeSlotByIndex(selectedDate.index);
        }
      }
    };
    triggerDateFetch();
  }, [selectedDateIndex]);

  return (
    <View className="bg-white p-4">
      <Text className="font-bold text-gray-800 mb-3 text-sm">Jadwal Pengantaran</Text>
      
      {/* Date Slots (Horizontal Scroll) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        {dateslot && dateslot.length !== 0 ? (
          dateslot.map((element, index) => {
            const isSelected = selectedDateIndex === index;
            const isAvailable = element.isAvailable;
            
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                disabled={!isAvailable}
                onPress={() => handleSelectDate(index)}
                className={`w-20 h-20 mr-3 p-2 rounded-xl justify-center items-center border ${
                  !isAvailable
                    ? "border-gray-200 bg-gray-50"
                    : isSelected
                    ? "border-green-600 bg-emerald-50 shadow-sm"
                    : "border-gray-300 bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    !isAvailable
                      ? "text-gray-400"
                      : isSelected
                      ? "text-green-800"
                      : "text-gray-700"
                  }`}
                >
                  {element.label || (element.index === "today" ? "Hari ini" : (element.index === "1" ? "Besok" : "Lusa"))}
                </Text>
                <Text
                  className={`text-[9px] mt-1 text-center ${
                    !isAvailable
                      ? "text-gray-400"
                      : isSelected
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {element.date}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="flex-row space-x-3">
            {[1, 2, 3].map((n) => (
              <View key={n} className="w-20 h-20 bg-gray-200 rounded-xl mr-3 animate-pulse" />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Time Slots (Horizontal Scroll) */}
      {(timeslot && timeslot.length > 0) || (dateslot && dateslot.length > 0) ? (
        <View className="mt-3">
          <Text className="text-xs font-medium text-gray-500 mb-2">
            {selectedDateIndex != null ? "Waktu pengiriman" : ""}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {timeslot && timeslot.length > 0 ? (
              timeslot.map((slot, index) => {
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
              })
            ) : selectedDateIndex !== null ? (
               <Text className="text-xs text-red-500 italic">Tidak ada slot waktu tersedia</Text>
            ) : null}
          </ScrollView>
        </View>
      ) : (
        <View className="flex-row mt-4">
          {[1, 2, 3].map((n) => (
            <View key={n} className="h-8 w-24 bg-gray-200 rounded-full mr-2 animate-pulse" />
          ))}
        </View>
      )}
    </View>
  );
};

export default TimeSlotWidget;
