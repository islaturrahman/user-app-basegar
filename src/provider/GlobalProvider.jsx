import React from 'react';
import ConfigProvider from './ConfigProvider';
import ProductProvider from './ProductProvider';
import CartProvider from '../features/cart/provider/CartProvider';
import AddressProvider from '../features/address/provider/AddressProvider';
import MapsProvider from './MapsProvider';
import DeliveryProvider from '../features/delivery/provider/DeliveryProvider';
import ChatProvider from './ChatProvider';

export default function GlobalProvider({ children }) {
  return (
    <ConfigProvider>
      <ProductProvider>
          <AddressProvider>
            <MapsProvider>
              <DeliveryProvider>
                <CartProvider>
                  <ChatProvider>
                    {children}
                  </ChatProvider>
                </CartProvider>
              </DeliveryProvider>
            </MapsProvider>
          </AddressProvider>
      </ProductProvider>
    </ConfigProvider>
  );
}
