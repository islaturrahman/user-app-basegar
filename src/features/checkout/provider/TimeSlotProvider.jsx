import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { time_slot } from "../../../config/enpoints";
import { get } from "../../../data/api";

export const TimeSlotContext = createContext({
  timeslot: [],
  dateslot: [],
  getTimeSlot: async () => {},
  getTimeSlotByIndex: async () => {},
  selectedTimeSlot: async () => {},
  clearTimeSlotId: async () => {},
});

const TimeSlotProvider = ({ children }) => {
  const [timeslot, setTimeSlot] = useState([]);
  const [dateslot, setDateSlot] = useState([]);

  const fetchTimeSlot = async () => {
    try {
      const resp = await get(time_slot);
      if (resp && resp != null && resp != undefined) {
        await AsyncStorage.setItem("timeslot", JSON.stringify(resp));
        await updateDateSlotsWithTime(resp);
      }
    } catch (error) {
      console.error("Error fetching timeslots:", error);
    }
  };

  const getTimeSlot = async () => {
    await fetchTimeSlot();
  };

  const selecteDateSlot = async (dateslotIndex) => {
    try {
      await AsyncStorage.setItem("dateslotId", String(dateslotIndex));

      if (dateslotIndex === "today") {
        let today = new Date().toISOString().split("T")[0];
        await AsyncStorage.setItem("dateslot", today);
      } else if (dateslotIndex === "tomorrow") {
        let tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await AsyncStorage.setItem("dateslot", tomorrow.toISOString().split("T")[0]);
      } else {
        let afterTomorrow = new Date();
        afterTomorrow.setDate(afterTomorrow.getDate() + 2);
        await AsyncStorage.setItem(
          "dateslot",
          afterTomorrow.toISOString().split("T")[0]
        );
      }
    } catch (e) {
      console.error("Error saving dateslot", e);
    }
  };

  const getTimeSlotByIndex = async (dateIndex) => {
    await selecteDateSlot(dateIndex);
    try {
      const selectedDate = dateslot.find((slot) => slot.index === dateIndex);
      if (selectedDate) {
        let filteredTimeSlots = [...selectedDate.timeslot];
        
        // Cari maxFreshStartTime dari keranjang
        const cartStr = await AsyncStorage.getItem("cart");
        const cartData = cartStr ? JSON.parse(cartStr) : [];
        let maxFreshStartTime = null;

        const parseTimeSlots = (time_slot) => {
          let slots = [];
          if (typeof time_slot === 'string') {
            try {
              const parsed = JSON.parse(time_slot);
              slots = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
            } catch (e) {
              slots = [];
            }
          } else if (Array.isArray(time_slot)) {
            slots = time_slot;
          } else if (time_slot) {
            slots = [time_slot];
          }
          return slots;
        };

        if (cartData.length > 0) {
          const now = new Date();
          const currentHours = now.getHours().toString().padStart(2, "0");
          const currentMinutes = now.getMinutes().toString().padStart(2, "0");
          const currentTime = `${currentHours}:${currentMinutes}:00`;

          cartData.forEach((item) => {
            if (item.is_selected !== false) {
               const slots = parseTimeSlots(item.time_slot);
               let earliestProductStart = null;
               slots.forEach(slot => {
                  if (slot && slot.end_time && currentTime <= slot.end_time) {
                     if (slot.start_time) {
                        if (!earliestProductStart || slot.start_time < earliestProductStart) {
                           earliestProductStart = slot.start_time;
                        }
                     }
                  }
               });
               if (earliestProductStart) {
                  if (!maxFreshStartTime || earliestProductStart > maxFreshStartTime) {
                     maxFreshStartTime = earliestProductStart;
                  }
               }
            }
          });
        }

        if (dateIndex === "today") {
          if (maxFreshStartTime) {
            filteredTimeSlots = filteredTimeSlots.filter(
              (slot) => slot.start_time >= maxFreshStartTime
            );
          }

          const configStr = await AsyncStorage.getItem("config");
          const config = configStr ? JSON.parse(configStr) : {};
          const prepTimeMinutes = config.time_slot_preparation_time || 60;
          
          const now = new Date();
          now.setMinutes(now.getMinutes() + prepTimeMinutes);
          const bufferedTime = now.toLocaleTimeString("en-GB", { hour12: false });
          filteredTimeSlots = filteredTimeSlots.filter(
            (slot) => slot.end_time > bufferedTime
          );
        }
        setTimeSlot(filteredTimeSlots);
        updateDateSlotAvailability(dateIndex, filteredTimeSlots.length > 0);
      }
    } catch (error) {
      console.error("Error processing timeslots:", error);
    }
  };

  const updateDateSlotAvailability = (dateIndex, isAvailable) => {
    setDateSlot((prevDateSlots) =>
      prevDateSlots.map((slot) =>
        slot.index === dateIndex ? { ...slot, isAvailable } : slot
      )
    );
  };

  const clearTimeSlotId = async () => {
    await AsyncStorage.removeItem("timeslotId");
  };

  const updateDateSlotsWithTime = async (timeSlots) => {
    const today = new Date();
    let newDateSlots = [];

    const cartStr = await AsyncStorage.getItem("cart");
    const cartData = cartStr ? JSON.parse(cartStr) : [];
    let hasExpiredFreshProduct = false;
    let maxFreshStartTime = null;
    
    const parseTimeSlots = (time_slot) => {
      let slots = [];
      if (typeof time_slot === 'string') {
        try {
          const parsed = JSON.parse(time_slot);
          slots = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
        } catch (e) {
          slots = [];
        }
      } else if (Array.isArray(time_slot)) {
        slots = time_slot;
      } else if (time_slot) {
        slots = [time_slot];
      }
      return slots;
    };

    if (cartData.length > 0) {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, "0");
      const currentMinutes = now.getMinutes().toString().padStart(2, "0");
      const currentTime = `${currentHours}:${currentMinutes}:00`;

      cartData.forEach((item) => {
        if (item.is_selected !== false) {
           const slots = parseTimeSlots(item.time_slot);
           if (slots.length > 0) {
             let allExpired = true;
             let earliestProductStart = null;

             slots.forEach(slot => {
               if (slot && slot.end_time && currentTime <= slot.end_time) {
                 allExpired = false;
                 if (slot.start_time) {
                    if (!earliestProductStart || slot.start_time < earliestProductStart) {
                       earliestProductStart = slot.start_time;
                    }
                 }
               }
             });

             if (allExpired) {
               hasExpiredFreshProduct = true;
             } else if (earliestProductStart) {
               if (!maxFreshStartTime || earliestProductStart > maxFreshStartTime) {
                  maxFreshStartTime = earliestProductStart;
               }
             }
           }
        }
      });
    }

    const configStr = await AsyncStorage.getItem("config");
    const config = configStr ? JSON.parse(configStr) : {};

    for (let i = 0; i < 2; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      let slotTimeSlots = [...timeSlots];
      
      let isAvailable = true;

      if (i === 0) {
        if (maxFreshStartTime) {
          slotTimeSlots = slotTimeSlots.filter((slot) => slot.start_time >= maxFreshStartTime);
        }

        if (hasExpiredFreshProduct) {
          slotTimeSlots = [];
          isAvailable = false;
        } else {
          const prepTimeMinutes = config.time_slot_preparation_time || 60;

          const now = new Date();
          now.setMinutes(now.getMinutes() + prepTimeMinutes);
          const bufferedTime = now.toLocaleTimeString("en-GB", { hour12: false });
          
          slotTimeSlots = slotTimeSlots.filter((slot) => slot.end_time > bufferedTime);
          isAvailable = slotTimeSlots.length > 0;
          
          if (slotTimeSlots.length > 0) {
            await AsyncStorage.setItem(
              "lastEndTimeFetchToday",
              JSON.stringify(slotTimeSlots)
            );
          }
        }
      } else {
        isAvailable = slotTimeSlots.length > 0;
      }

      newDateSlots.push({
        index: i === 0 ? "today" : "tomorrow",
        date: date.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
        isAvailable: isAvailable,
        timeslot: slotTimeSlots,
      });
    }

    setDateSlot(newDateSlots);
    setTimeSlot([]);
  };

  const selectedTimeSlot = async (timeslotObj) => {
    await AsyncStorage.setItem("timeslotId", String(timeslotObj.id));
  };

  const selectedDateSlot = async (dateslotIndex) => {
    await AsyncStorage.setItem("dateslotIndex", String(dateslotIndex));
  };

  useEffect(() => {
    getTimeSlot();
  }, []);

  const value = {
    timeslot,
    dateslot,
    getTimeSlot,
    getTimeSlotByIndex,
    selectedTimeSlot,
    clearTimeSlotId,
  };

  return (
    <TimeSlotContext.Provider value={value}>
      {children}
    </TimeSlotContext.Provider>
  );
};

export default TimeSlotProvider;
