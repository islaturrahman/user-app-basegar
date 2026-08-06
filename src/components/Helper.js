import AsyncStorage from '@react-native-async-storage/async-storage';

export const isNumberOrEmail = (value) => {
  return value.match(/^\d+$/) ? "phone" : "email";
};

export const clearLocalStorage = async () => {
  try {
    await AsyncStorage.multiRemove([
      "cart",
      "selectAddress",
      "dateslot",
      "timeslotId",
      "order_amount",
      "distance",
      "payment_method",
      "dateslotId",
    ]);
  } catch (e) {
    console.error("Error clearing storage:", e);
  }
};

export const toRupiah = (number) => {
  const num = Number(number);
  const safeNumber = isNaN(num) || number === null || number === undefined ? 0 : num;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(safeNumber);
};

export const extractStreetAndDistrict = (address) => {
  if (!address) return "";
  const parts = address.split(",");
  const relevantParts = parts.slice(1, 4);
  return relevantParts.join(",").trim();
};

export const getDistance = async (data) => {
  try {
    let configStr = await AsyncStorage.getItem("config");
    let config = configStr ? JSON.parse(configStr) : null;
    
    if (!config) {
      await AsyncStorage.setItem("distance", "0");
      return 0;
    }

    let branch = (config.branches && config.branches.length > 0) 
      ? config.branches[0] 
      : config.ecommerce_location_coverage;

    const bLat = branch?.latitude || branch?.lat;
    const bLng = branch?.longitude || branch?.lng;

    if (!branch || !bLat || !bLng || bLat === "" || bLng === "") {
      console.warn("Lokasi toko/cabang belum diatur di admin panel. Mengembalikan jarak 0.");
      await AsyncStorage.setItem("distance", "0");
      return 0;
    }

    let branchLat = parseFloat(bLat);
    let branchLng = parseFloat(bLng);

    let userLat = parseFloat(data?.latitude || data?.lat);
    let userLng = parseFloat(data?.longitude || data?.lng);

    if (isNaN(branchLat) || isNaN(branchLng) || isNaN(userLat) || isNaN(userLng)) {
      await AsyncStorage.setItem("distance", "0");
      return 0;
    }

    if ((branchLat === 0 && branchLng === 0) || (userLat === 0 && userLng === 0)) {
      console.warn("Koordinat toko atau user (0,0). Mengembalikan jarak 0 untuk menghindari perhitungan tidak masuk akal.");
      await AsyncStorage.setItem("distance", "0");
      return 0;
    }

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const toRadians = (degree) => degree * (Math.PI / 180);
      const R = 6371; 
      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; 
    };

    let distance = calculateDistance(branchLat, branchLng, userLat, userLng);
    await AsyncStorage.setItem("distance", distance.toString());
    return distance;
  } catch (e) {
    console.error("Error calculating distance", e);
    return 0;
  }
};

export const formatNumberPhone = (phoneNumber) => {
  if (!phoneNumber) return "";
  let formattedPhone = phoneNumber.trim();
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "+62" + formattedPhone.slice(1);
  } else if (!formattedPhone.startsWith("+62")) {
    formattedPhone = "+62" + formattedPhone;
  }
  return formattedPhone;
};

export const debounceSearch = (func, delay) => {
  let timeoutId;
  return function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};
