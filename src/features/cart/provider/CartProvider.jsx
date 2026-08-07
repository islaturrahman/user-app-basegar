import React from "react";
import CartContext from "../../../context/CartContext";
import { Cart } from "../../../models/OrderModel";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CartProvider = ({ children }) => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: cart = [], isLoading: loading, error } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      try {
        const savedCart = await AsyncStorage.getItem("cart");
        return savedCart ? JSON.parse(savedCart) : [];
      } catch (err) {
        console.log("Failed to load cart from storage", err);
        return [];
      }
    }
  });

  const updateCartMutation = useMutation({
    mutationFn: async (updatedCart) => {
      await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
      return updatedCart;
    },
    onSuccess: (updatedCart) => {
      console.log("Cart updated successfully, items:", updatedCart?.length);
      queryClient.setQueryData(["cart"], updatedCart);
    },
    onError: (error) => {
      console.error("Cart mutation error:", error);
    }
  });

  const getCart = () => {
    return cart || [];
  };

  const scheduleStockValidation = () => {
    let status = true;
    return {
      date: "3923",
      status: status,
      tomorrow: false,
    };
  };

  const addToCart = async (
    product_id,
    name,
    price,
    quantity,
    variant,
    variation,
    tax_total,
    image,
    time_slot
  ) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        navigation.navigate("/login");
        return;
      }
    } catch (e) {
      console.log("Error checking auth in addToCart", e);
      return;
    }

    const existingProductIndex = cart.findIndex(
      (item) => item.product_id === product_id
    );

    let updatedCart;
    if (existingProductIndex !== -1) {
      updatedCart = [...cart];
      updatedCart[existingProductIndex] = {
        ...updatedCart[existingProductIndex],
        quantity: updatedCart[existingProductIndex].quantity + 1
      };
    } else {
      const cartItem = new Cart();
      cartItem.product_id = product_id;
      cartItem.name = name;
      cartItem.quantity = quantity;
      cartItem.price = price;
      cartItem.variant = variant;
      cartItem.variation = variation;
      cartItem.tax_total = tax_total;
      cartItem.image = image;
      
      let validation = scheduleStockValidation();
      cartItem.stock_schedule = {
        date: validation.date,
        status: validation.status,
        tomorrow: validation.tomorrow,
      };
      cartItem.time_slot = time_slot || null;

      const data = cartItem.getCart();
      data.is_selected = true; // Default selected
      updatedCart = [...cart, data];
    }
    
    updateCartMutation.mutate(updatedCart);
  };

  const addQuantity = (productId) => {
    const updatedCart = cart.map((item) => {
      if (item.product_id === productId) {
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    });
    updateCartMutation.mutate(updatedCart);
  };

  const minQuantity = (productId) => {
    const targetItem = cart.find((item) => item.product_id === productId);
    if (targetItem && targetItem.quantity <= 1) {
      const updatedCart = cart.filter(
        (item) => item.product_id !== productId
      );
      updateCartMutation.mutate(updatedCart);
      return;
    }

    const updatedCart = cart.map((item) => {
      if (item.product_id === productId) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    });
    updateCartMutation.mutate(updatedCart);
  };

  const getTotalPrice = () => {
    if (cart.length === 0 || cart == null) {
      return 0;
    }
    return cart.reduce((total, item) => {
      if (item.is_selected === false) return total;
      return total + item.price * item.quantity;
    }, 0);
  };

  const toggleSelectItem = (productId) => {
    const updatedCart = cart.map((item) => {
      if (item.product_id === productId) {
        return { ...item, is_selected: item.is_selected === false ? true : false };
      }
      return item;
    });
    updateCartMutation.mutate(updatedCart);
  };

  const updateItemSelection = (productIds, isSelected) => {
    const updatedCart = cart.map((item) => {
      if (productIds.includes(item.product_id)) {
        return { ...item, is_selected: isSelected };
      }
      return item;
    });
    updateCartMutation.mutate(updatedCart);
  };

  const toggleSelectAll = (isAllSelected) => {
    const updatedCart = cart.map(item => ({
      ...item,
      is_selected: !isAllSelected
    }));
    updateCartMutation.mutate(updatedCart);
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(
      (item) => item.product_id !== productId
    );
    updateCartMutation.mutate(updatedCart);
  };

  const clearCart = () => {
    const unselectedItems = cart.filter(item => item.is_selected === false);
    updateCartMutation.mutate(unselectedItems);
  };

  const value = {
    cart,
    loading,
    error,
    getCart,
    getTotalPrice,
    addToCart,
    removeFromCart,
    clearCart,
    addQuantity,
    minQuantity,
    toggleSelectItem,
    toggleSelectAll,
    updateItemSelection,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
