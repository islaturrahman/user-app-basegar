import React from 'react';
import renderer from 'react-test-renderer';
import CartListItem from '../CartListItem';
import CartContext from '../../../../context/CartContext';
import ProductsContext from '../../../../context/ProductsContext';
import { TimeSlotContext } from '../../../checkout/provider/TimeSlotProvider';
import { performance } from 'perf_hooks';

describe('CartListItem Performance Tests', () => {
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

  it('should efficiently compute timeslots for a large cart on initial render', () => {
    const start = performance.now();
    renderer.create(
      <CartContext.Provider value={mockCartContext}>
        <ProductsContext.Provider value={mockProductsContext}>
          <TimeSlotContext.Provider value={mockTimeSlotContext}>
            <CartListItem />
          </TimeSlotContext.Provider>
        </ProductsContext.Provider>
      </CartContext.Provider>
    );
    const end = performance.now();
    expect(end - start).toBeLessThan(300);
  });

  it('should efficiently handle unchecking and checking items (re-render)', () => {
    // Initial render
    const root = renderer.create(
      <CartContext.Provider value={mockCartContext}>
        <ProductsContext.Provider value={mockProductsContext}>
          <TimeSlotContext.Provider value={mockTimeSlotContext}>
            <CartListItem />
          </TimeSlotContext.Provider>
        </ProductsContext.Provider>
      </CartContext.Provider>
    );

    // Simulate modifying one item's is_selected to false
    const modifiedCart = [...mockCart];
    modifiedCart[0] = { ...modifiedCart[0], is_selected: false };

    const modifiedContext = { ...mockCartContext, cart: modifiedCart };

    const start = performance.now();
    // Trigger re-render with new context
    root.update(
      <CartContext.Provider value={modifiedContext}>
        <ProductsContext.Provider value={mockProductsContext}>
          <TimeSlotContext.Provider value={mockTimeSlotContext}>
            <CartListItem />
          </TimeSlotContext.Provider>
        </ProductsContext.Provider>
      </CartContext.Provider>
    );
    const end = performance.now();
    const timeTaken = end - start;
    
    console.log(`CartListItem re-render with uncheck took ${timeTaken.toFixed(2)} ms`);
    // Re-render should be much faster due to useMemo caching
    expect(timeTaken).toBeLessThan(50); 
  });
});
