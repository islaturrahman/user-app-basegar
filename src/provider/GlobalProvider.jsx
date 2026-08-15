import React from 'react';
import ConfigProvider from './ConfigProvider';
import ProductProvider from './ProductProvider';
import CartProvider from '../features/cart/provider/CartProvider';
import AddressProvider from '../features/address/provider/AddressProvider';
import MapsProvider from './MapsProvider';
import DeliveryProvider from '../features/delivery/provider/DeliveryProvider';
import ChatProvider from './ChatProvider';
import TimeSlotProvider from '../features/checkout/provider/TimeSlotProvider';

export default function GlobalProvider({ children }) {
  return (
    <ConfigProvider>
      <ProductProvider>
          <AddressProvider>
            <MapsProvider>
              <DeliveryProvider>
                <CartProvider>
                  <TimeSlotProvider>
                    <ChatProvider>
                      {children}
                    </ChatProvider>
                  </TimeSlotProvider>
                </CartProvider>
              </DeliveryProvider>
            </MapsProvider>
          </AddressProvider>
      </ProductProvider>
    </ConfigProvider>
  );
}
