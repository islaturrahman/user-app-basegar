import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const PaymentContext = createContext({
  payment: "",
  setPayment: () => {},
  getPayment: async () => {},
});

const PaymentProvider = ({ children }) => {
  const [payment, setPayment] = useState("");

  const savePayment = async (method) => {
    try {
      await AsyncStorage.setItem("payment_method", method);
    } catch (e) {
      console.error("Failed to save payment method", e);
    }
  };

  const getPayment = async () => {
    try {
      let method = await AsyncStorage.getItem("payment_method");
      return method;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (payment) {
      savePayment(payment);
    }
  }, [payment]);

  const value = {
    payment,
    setPayment,
    getPayment,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export default PaymentProvider;
