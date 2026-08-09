import { get } from "../data/api.js";
import {
  all_products,
  get_search_products,
  product_details,
} from "../config/enpoints";
import { ProductModel } from "../models/ProductModel";
import ProductsContext from "../context/ProductsContext.jsx";
import { useState, useCallback } from "react";
import { debounceSearch } from "../components/Helper";

const ProductProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState(null); // Initialize with null instead of undefined
  const [categories, setCategories] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState("tomorrow"); // Default to tomorrow like Sayurbox

  const fetchProducts = useCallback(async (params) => {
    let endpoint = params
      ? `${all_products}?offset=${params.page}&limit=${params.limit}`
      : all_products;

    // Append deliveryDate to endpoint
    const sep = endpoint.includes("?") ? "&" : "?";
    endpoint += `${sep}delivery_date=${deliveryDate}`;

    try {
      const response = await get(endpoint);
      const productsModel = new ProductModel();
      if (response && response.products) {
        productsModel.setProducts(response.products);
      } else {
        console.warn("Products API did not return products array:", response);
        productsModel.setProducts([]);
      }
      setProducts(productsModel);
      return productsModel;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error; // Propagate error to handle it in the component
    }
  }, [deliveryDate]);

  const productDetails = useCallback(async (id) => {
    if (!id) throw new Error("Product ID is required");

    try {
      const response = await get(`${product_details}/${id}`);
      const productsModel = new ProductModel();
      productsModel.setProducts(response);
      return productsModel;
    } catch (error) {
      console.error("Error fetching product details:", error);
      throw error;
    }
  }, []);

  const getSearchProducts = async (value) => {
    setLoading(true);
    if (!value) throw new Error("Search value is required");
    try {
      let response = await get(`${get_search_products}?name=${value}`);
      if (response && response.products) {
        setProducts(response.products);
      } else {
        setProducts([]);
      }
      setLoading(false);
      return response;
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  };

  const contextValue = {
    loading,
    products,
    fetchProducts,
    productDetails,
    getSearchProducts,
    deliveryDate,
    setDeliveryDate,
  };

  return (
    <ProductsContext.Provider value={contextValue}>
      {children}
    </ProductsContext.Provider>
  );
};

export default ProductProvider;
