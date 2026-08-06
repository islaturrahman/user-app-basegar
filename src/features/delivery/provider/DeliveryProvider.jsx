import React, { createContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDistance } from "../../../components/Helper";

export const DeliveryContext = createContext();

export const DeliveryProvider = ({ children }) => {
  const [deliverCharge, setDeliverCharge] = useState(0);

  const setDeliveryChargeBySelectionAddress = useCallback(async (address) => {
    if (!address) return;
    try {
      const configStr = await AsyncStorage.getItem("config");
      const config = configStr ? JSON.parse(configStr) : null;
      if (!config) return;

      const distance = await getDistance(address);
      let originalCharge = 0;
      let shippingPerKm = parseFloat(config?.delivery_management?.shipping_per_km || 0);
      let minShipping = parseFloat(config?.delivery_management?.min_shipping_charge || 0);
      let baseCharge = parseFloat(config?.delivery_charge || 0);

      if (isNaN(shippingPerKm)) shippingPerKm = 0;
      if (isNaN(minShipping)) minShipping = 0;
      if (isNaN(baseCharge)) baseCharge = 0;

      let deliveryChargeByKm = distance * shippingPerKm;
      
      if (distance === 0) {
         originalCharge = minShipping > 0 ? minShipping : baseCharge;
      } else if (deliveryChargeByKm < minShipping) {
        originalCharge = minShipping;
      } else {
        originalCharge = deliveryChargeByKm;
      }
      
      originalCharge = Math.round(originalCharge);

      setDeliverCharge(originalCharge);
      await AsyncStorage.setItem("delivery_charge", JSON.stringify(originalCharge));
    } catch (error) {
      console.error("Failed to set delivery charge", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const savedAddressStr = await AsyncStorage.getItem("selectAddress");
        if (savedAddressStr) {
          const savedAddress = JSON.parse(savedAddressStr);
          await setDeliveryChargeBySelectionAddress(savedAddress);
        } else {
          const savedCharge = await AsyncStorage.getItem("delivery_charge");
          if (savedCharge) {
            setDeliverCharge(JSON.parse(savedCharge));
          }
        }
      } catch (e) {
        console.error("Error init delivery provider", e);
      }
    };
    init();
  }, [setDeliveryChargeBySelectionAddress]);

  const value = {
    deliverCharge,
    setDeliverCharge,
    setDeliveryChargeBySelectionAddress,
  };

  return (
    <DeliveryContext.Provider value={value}>
      {children}
    </DeliveryContext.Provider>
  );
};

export default DeliveryProvider;
