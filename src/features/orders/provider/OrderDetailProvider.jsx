import React, { useState, useEffect, createContext, useContext } from "react";
import { post } from "../../../data/api";
import { orderDetail } from "../../../config/enpoints";
import { OrderContext } from "./OrderProvider";

export const OrderDetailContext = createContext({
  orderDetails: [],
  orderInfo: null,
  loading: false,
  refreshing: false,
  error: null,
  fetchDetails: async () => {},
});

const OrderDetailProvider = ({ orderId, children }) => {
  const { orders } = useContext(OrderContext);
  const [orderDetails, setOrderDetails] = useState([]);
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Sync from orders list if available
  useEffect(() => {
    if (orderId && orders && orders.length > 0) {
      const found = orders.find((o) => o.id === parseInt(orderId));
      if (found) setOrderInfo(found);
    }
  }, [orderId, orders]);

  const fetchDetails = async (isRefresh = false) => {
    if (!orderId) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    try {
      const data = await post(orderDetail, { order_id: parseInt(orderId) });
      console.log("ORDER_DETAILS_RESPONSE", JSON.stringify(data));
      
      // Handle various response formats
      let detailArray = [];
      if (Array.isArray(data)) {
        detailArray = data;
      } else if (data && Array.isArray(data.data)) {
        detailArray = data.data;
      } else if (data && Array.isArray(data.details)) {
        detailArray = data.details;
      }

      if (detailArray.length > 0) {
        setOrderDetails(detailArray);
        if (detailArray[0].order) {
          setOrderInfo(detailArray[0].order);
        } else if (data.order) {
          setOrderInfo(data.order);
        }
      } else {
        setOrderDetails([]);
        if (data?.message) setError(data.message);
      }
    } catch (err) {
      console.log("Error fetching order details:", err);
      setError("Gagal memuat detail pesanan");
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Fetch full details from API on mount
  useEffect(() => {
    fetchDetails(false);
  }, [orderId]);

  const value = { orderDetails, orderInfo, loading, refreshing, error, fetchDetails };

  return (
    <OrderDetailContext.Provider value={value}>
      {children}
    </OrderDetailContext.Provider>
  );
};

export default OrderDetailProvider;
