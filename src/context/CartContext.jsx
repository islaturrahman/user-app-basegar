import React from "react";

const CartContext = React.createContext({
    cart: [],
    loading: false,
    error: null,
    getCart: () => {},
    addToCart: () => {},
    toggleSelectItem: () => {},
    toggleSelectAll: () => {},
});

export default CartContext;