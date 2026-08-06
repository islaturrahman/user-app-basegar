import { base_url } from "../config/enpoints";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Fungsi untuk membuat request API dengan fetch dan error handling
 * @param {string} endpoint - Endpoint API (misalnya '/products')
 * @param {string} method - HTTP Method (GET, POST, PUT, DELETE)
 * @param {Object} [data] - Data yang dikirim dalam body request
 * @returns {Promise<Object>} - Response dari API atau throw error jika gagal
 */
export async function apiRequest(endpoint, method = "GET", data = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Localization": "en",
    },
  };

  // Ambil token dari AsyncStorage (React Native)
  const token = await AsyncStorage.getItem("authToken");

  // Tambahkan token ke header jika ditemukan
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  // Tambahkan body ke request jika data disediakan
  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${base_url}${endpoint}`, options);
    // Jika response tidak OK (400, 401, 403, 404, 500, dll.)
    if (!response.ok) {
      const errorData = await response.json().catch(() => null); // Coba baca JSON error

      // Cek apakah error dalam bentuk array
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const errorMessages = errorData.errors
          .map((err) => err.message)
          .join(", ");
        throw new Error(errorMessages || "Terjadi kesalahan pada server");
      }

      // Jika error memiliki message langsung
      throw new Error(
        errorData?.message || `Request gagal dengan status ${response.status}`
      );
    }

    return response.json(); // Jika sukses, return data JSON
  } catch (error) {
    return {
      status: false,
      message: error.message,
    };
  }
}

/** Shortcut untuk GET request */
export function get(endpoint) {
  return apiRequest(endpoint, "GET");
}

/** Shortcut untuk POST request */
export function post(endpoint, data) {
  return apiRequest(endpoint, "POST", data);
}

/** Shortcut untuk PUT request */
export function put(endpoint, data) {
  return apiRequest(endpoint, "PUT", data);
}

/** Shortcut untuk DELETE request */
export function remove(endpoint) {
  return apiRequest(endpoint, "DELETE");
}
