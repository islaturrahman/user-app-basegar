import React, { useState, useEffect, createContext, useRef } from "react";
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

// Antrean global untuk mencegah rate limit (429)
let imageFetchQueue = Promise.resolve();

const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // products_image_by_order_id cache map: { "123": ["img1.png", "img2.png"] }
  const [orderImages, setOrderImages] = useState({});
  const fetchingIds = useRef(new Set());

  const fetchOrders = async (pageNumber = 1, isRefresh = false) => {
    if (isRefresh) {
      setLoading(true);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const data = await get(`${orderList}?limit=10&offset=${pageNumber}`);
      let newOrders = [];
      if (Array.isArray(data)) {
        newOrders = data;
      } else if (data && Array.isArray(data.orders)) {
        newOrders = data.orders;
      } else if (data && Array.isArray(data.data)) {
        newOrders = data.data;
      } else if (data && Array.isArray(data.details)) {
        newOrders = data.details;
      } else {
        if (data?.message) setError(data.message);
      }

      if (isRefresh || pageNumber === 1) {
        setOrders(newOrders);
      } else {
        setOrders(prev => {
          // Menghindari duplikasi saat append
          const existingIds = new Set(prev.map(o => o.id));
          const uniqueNewOrders = newOrders.filter(o => !existingIds.has(o.id));
          return [...prev, ...uniqueNewOrders];
        });
      }
      
      // Jika hasil kembalian kosong atau kurang dari 10 (limit), tidak ada data lagi
      if (newOrders.length < 10) {
        setHasMore(false);
      }
      setPage(pageNumber);

    } catch (err) {
      console.log("Error fetching orders:", err);
      setError("Gagal memuat daftar pesanan");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreOrders = () => {
    if (hasMore && !loading && !loadingMore) {
      fetchOrders(page + 1, false);
    }
  };

  useEffect(() => {
    fetchOrders(1, true);
  }, []);

  const fetchOrderImages = (orderId) => {
    // Jika sudah ada di cache atau sedang di-fetch, lewati
    if (orderImages[orderId] || fetchingIds.current.has(orderId)) return;
    
    fetchingIds.current.add(orderId);

    // Masukkan ke dalam antrean promise untuk menghindari error 429 (Too Many Requests)
    imageFetchQueue = imageFetchQueue.then(async () => {
      // Jeda 250ms per request agar ramah terhadap limit server
      await new Promise(r => setTimeout(r, 250));

      try {
        let data = await get(`${orderDetail}?order_id=${parseInt(orderId)}`);
        if (!data || data.status === false || (Array.isArray(data) && data.length === 0)) {
          data = await post(orderDetail, { order_id: parseInt(orderId) });
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
      fetchingIds.current.delete(orderId); // Beri kesempatan mencoba lagi nanti jika gagal
    }
  });
};

  const value = { orders, loading, loadingMore, hasMore, error, orderImages, fetchOrders, loadMoreOrders, fetchOrderImages };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};

export default OrderProvider;
