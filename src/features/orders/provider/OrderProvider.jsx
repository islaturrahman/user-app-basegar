import React, { useState, useEffect, createContext } from "react";
import { get } from "../../../data/api";
import { orderList } from "../../../config/enpoints";

export const OrderContext = createContext({
  orders: [],
  loading: false,
  error: null,
  fetchOrders: () => {},
});

const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get(orderList);
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
        if (data?.message) setError(data.message);
      }
    } catch (err) {
      console.log("Error fetching orders:", err);
      setError("Gagal memuat daftar pesanan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const value = { orders, loading, error, fetchOrders };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};

export default OrderProvider;
