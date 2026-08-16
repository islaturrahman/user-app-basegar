import React from 'react';
import { render } from '@testing-library/react-native';
import CartListItem from '../CartListItem';
import CartContext from '../../../../context/CartContext';
import ProductsContext from '../../../../context/ProductsContext';
import { TimeSlotContext } from '../../../checkout/provider/TimeSlotProvider';
import { performance } from 'perf_hooks';

describe('CartListItem Timeslot Calculation Performance', () => {
  it('should efficiently compute timeslots for a large cart', () => {
    // Generate a cart with 100 items, each with 10 timeslots
    const mockCart = Array.from({ length: 100 }, (_, i) => ({
      product_id: i,
      name: `Product ${i}`,
      price: 10000,
      quantity: 1,
      is_selected: true,
      time_slot: JSON.stringify(
        Array.from({ length: 10 }, (_, j) => ({
          start_time: `${String(10 + (j % 10)).padStart(2, '0')}:00:00`,
          end_time: `${String(11 + (j % 10)).padStart(2, '0')}:00:00`
        }))
      )
    }));

    const mockCartContext = {
      cart: mockCart,
      removeFromCart: jest.fn(),
      addQuantity: jest.fn(),
      minQuantity: jest.fn(),
      toggleSelectItem: jest.fn(),
      toggleSelectAll: jest.fn(),
      updateItemSelection: jest.fn(),
      clearCart: jest.fn()
    };

    const mockProductsContext = {
      deliveryDate: 'today',
      setDeliveryDate: jest.fn()
    };

    const mockTimeSlotContext = {
      isGlobalExpired: false
    };

    const start = performance.now();

    render(
      <CartContext.Provider value={mockCartContext}>
        <ProductsContext.Provider value={mockProductsContext}>
          <TimeSlotContext.Provider value={mockTimeSlotContext}>
            <CartListItem />
          </TimeSlotContext.Provider>
        </ProductsContext.Provider>
      </CartContext.Provider>
    );

    const end = performance.now();
    const timeTaken = end - start;

    console.log(`CartListItem render with 100 cart items and 10 timeslots each took ${timeTaken.toFixed(2)} ms`);
    
    // Performance expectation: should render under 300ms even with many items
    expect(timeTaken).toBeLessThan(300);
  });
});
