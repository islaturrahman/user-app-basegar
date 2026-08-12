import React, { useState, useEffect, createContext } from "react";
import { get, post } from "../../../data/api";
import { orderList, orderDetail } from "../../../config/enpoints";

export const OrderContext = createContext({
  orders: [],
  loading: false,
  error: null,
  orderImages: {},
  fetchOrders: () => {},
  fetchOrderImages: async (orderId) => {},
});

const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // products_image_by_order_id cache map: { "123": ["img1.png", "img2.png"] }
  const [orderImages, setOrderImages] = useState({});

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

  const fetchOrderImages = async (orderId) => {
    // Jika sudah ada di cache, lewati
    if (orderImages[orderId]) return;

    try {
      let data = await post(orderDetail, { order_id: parseInt(orderId) });
      if (!data || data.status === false || (Array.isArray(data) && data.length === 0)) {
        data = await get(`${orderDetail}?order_id=${parseInt(orderId)}`);
      }
      
      let detailArray = [];
      if (Array.isArray(data)) {
        detailArray = data;
      } else if (data && Array.isArray(data.data)) {
        detailArray = data.data;
      } else if (data && Array.isArray(data.details)) {
        detailArray = data.details;
      }

      let extractedImages = [];
      detailArray.forEach(item => {
        let pDetails = item?.product_details;
        if (typeof pDetails === 'string') {
          try { pDetails = JSON.parse(pDetails); } catch(e) {}
        }
        
        let imgData = item?.image || pDetails?.image || item?.thumbnail || pDetails?.thumbnail;
        let imgStr = "";
        
        if (Array.isArray(imgData)) {
          imgStr = imgData[0];
        } else if (typeof imgData === 'string') {
          if (imgData.startsWith('[')) {
            try {
              const arr = JSON.parse(imgData);
              imgStr = Array.isArray(arr) ? arr[0] : imgData;
            } catch(e) {
              imgStr = imgData;
            }
          } else {
            imgStr = imgData;
          }
        }
        
        if (imgStr) {
          extractedImages.push(imgStr);
        }
      });
      
      setOrderImages(prev => ({
        ...prev,
        [orderId]: extractedImages
      }));

    } catch (err) {
      console.log("Error fetching order images:", err);
    }
  };

  const value = { orders, loading, error, orderImages, fetchOrders, fetchOrderImages };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};

export default OrderProvider;
