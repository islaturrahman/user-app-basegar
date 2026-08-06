import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  add_address,
  addressList,
  last_ordered_address,
  address as addressEndpoint,
} from "../../../config/enpoints";
import { useNavigation } from "@react-navigation/native";
import AddressContext from "../../../context/AddressContext";
import { get, post, apiRequest } from "../../../data/api";
import AddressModel from "../../../models/AddressModel";

export const AddressProvider = ({ children }) => {
  const [allAddress, setAllAddress] = useState([]);
  const [lastAddress, setLastAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const getAddress = async () => {
    try {
      const response = await get(addressList);
      if (response && !response.status) {
        // If it's an error object like {status: false}, return empty array
        if (response.status === false) {
           setAllAddress([]);
           return [];
        }
      }
      const addressModel = new AddressModel();
      addressModel.setAddress(response);
      const addresses = addressModel.getAddress();
      setAllAddress(addresses || []);
      return addresses || [];
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      return null;
    }
  };

  const getLastAddress = async () => {
    try {
      const resp = await get(last_ordered_address);
      if (resp && resp.status === false) {
        setLastAddress(null);
        return null;
      }
      const addressModel = new AddressModel();
      addressModel.setLastAddress(resp);
      const lastAddressData = addressModel.getLastAddress();
      setLastAddress(lastAddressData);
      return lastAddressData;
    } catch (error) {
      console.error("Failed to fetch last address:", error);
      setLastAddress(null);
      return null;
    }
  };

  // set and selected address
  const setAddress = async (address) => {
    try {
      await AsyncStorage.setItem("selectAddress", JSON.stringify(address));
    } catch (error) {
      console.error("Failed to save address to AsyncStorage:", error);
    }
  };

  const getSelectAddress = async () => {
    try {
      // 1. Fetch alamat terbaru langsung tanpa memicu state update (hindari infinite loop re-render)
      let freshAddresses = null;
      try {
        const response = await get(addressList);
        if (response && response.status === false) {
          // Server returned false status, usually means empty list
          freshAddresses = [];
        } else if (response) {
          const addressModel = new AddressModel();
          addressModel.setAddress(response);
          freshAddresses = addressModel.getAddress() || [];
        }
      } catch (err) {
        console.error("Failed silently to fetch fresh addresses for verification", err);
      }

      const selectAddressStr = await AsyncStorage.getItem("selectAddress");
      let cachedAddress = selectAddressStr ? JSON.parse(selectAddressStr) : null;
      
      // 2. Jika berhasil fetch, kita verifikasi alamat yang ada di cache atau lastAddress
      if (Array.isArray(freshAddresses)) {
        // Cek cachedAddress
        if (cachedAddress) {
           const exists = freshAddresses.find(a => String(a.id) === String(cachedAddress.id));
           if (!exists) {
             cachedAddress = null; // invalid
           } else {
             cachedAddress = exists; // update dengan data terbaru
           }
        }
        
        // Cek fallback lastAddress jika cache kosong
        let fallbackAddr = lastAddress;
        if (fallbackAddr) {
           const fallbackExists = freshAddresses.find(a => String(a.id) === String(fallbackAddr.id));
           if (!fallbackExists) {
             fallbackAddr = null;
           }
        }
        
        // Tentukan alamat akhir
        let finalAddr = cachedAddress;
        if (!finalAddr) {
           finalAddr = fallbackAddr;
        }
        if (!finalAddr && freshAddresses.length > 0) {
           finalAddr = freshAddresses[0];
        }
        
        if (finalAddr) {
           await AsyncStorage.setItem("selectAddress", JSON.stringify(finalAddr));
           return finalAddr;
        } else {
           await AsyncStorage.removeItem("selectAddress");
           return {};
        }
      }
      
      // Jika server error (freshAddresses null), gunakan cache sebisa mungkin
      if (cachedAddress) return cachedAddress;
      if (lastAddress) return lastAddress;
      return {};

    } catch (error) {
      console.error("Failed to get address from AsyncStorage:", error);
      return {};
    }
  };

  const addCustomerAddress = async (data) => {
    try {
      const resp = await post(add_address, data);
      const updatedList = await getAddress(); // refresh list
      
      // Auto-select the newly added address (usually the one with highest ID)
      if (updatedList && updatedList.length > 0) {
        const latestAddress = updatedList.reduce((prev, current) => (prev.id > current.id) ? prev : current, updatedList[0]);
        await setAddress(latestAddress);
      }
      
      return resp;
    } catch (error) {
      console.error("Add customer address error:", error);
      throw error;
    }
  };

  const updateCustomerAddress = async (addressId, data) => {
    try {
      // In Grofresh / 6valley, update address is usually PUT /update/{id}
      const dataWithMethod = { ...data, _method: "PUT" }; // fallback for laravel
      const resp = await apiRequest(`${addressEndpoint}/update/${addressId}`, "PUT", data);
      
      console.log("UPDATE_ADDRESS_RESP", resp);
      
      if (resp && resp.status === false) {
         console.log("Trying alternative update endpoint (1)...");
         const altResp = await post(`${addressEndpoint}/update?address_id=${addressId}`, dataWithMethod);
         console.log("ALT_UPDATE_ADDRESS_RESP", altResp);
         
         if (altResp && altResp.status === false) {
           console.log("Trying web app's method (add_address with ID)...");
           const finalResp = await post(add_address, data);
           console.log("WEBAPP_UPDATE_ADDRESS_RESP", finalResp);
           await getAddress();
           return finalResp;
         }
         
         await getAddress();
         return altResp;
      }
      
      await getAddress(); // refresh list
      return resp;
    } catch (error) {
      console.error("Update customer address error:", error);
      throw error;
    }
  };

  const deleteCustomerAddress = async (addressId) => {
    try {
      const resp = await apiRequest(`${addressEndpoint}/delete?address_id=${addressId}`, "DELETE");
      const updatedList = await getAddress();
      
      // Cek apakah alamat yang dihapus adalah alamat yang sedang dipilih
      const selectAddressStr = await AsyncStorage.getItem("selectAddress");
      if (selectAddressStr) {
        const currentSelected = JSON.parse(selectAddressStr);
        if (currentSelected && String(currentSelected.id) === String(addressId)) {
          // Jika iya, ganti dengan alamat lain (jika ada), atau hapus seleksi jika sudah kosong
          if (updatedList && updatedList.length > 0) {
            await AsyncStorage.setItem("selectAddress", JSON.stringify(updatedList[0]));
          } else {
            await AsyncStorage.removeItem("selectAddress");
          }
        }
      }
      
      return resp;
    } catch (error) {
      console.error("Failed to delete address:", error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    // Check if token exists before fetching to avoid 401 errors
    const initFetch = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        await Promise.all([getAddress(), getLastAddress()]);
      }
      if (mounted) setLoading(false);
    };
    
    initFetch();
    
    return () => { mounted = false; };
  }, []);

  const value = {
    loading,
    allAddress,
    lastAddress,
    getSelectAddress,
    setAddress,
    addCustomerAddress,
    updateCustomerAddress,
    deleteCustomerAddress,
    getAddress // Expose this so screens can trigger refresh
  };

  return (
    <AddressContext.Provider value={value}>{children}</AddressContext.Provider>
  );
};

export default AddressProvider;
