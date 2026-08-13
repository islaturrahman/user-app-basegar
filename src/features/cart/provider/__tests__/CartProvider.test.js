import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import CartProvider from '../CartProvider';
import CartContext from '../../../../context/CartContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('CartProvider', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  const setup = () => {
    const contextRef = { current: {} };
    const TestComponent = () => {
      contextRef.current = React.useContext(CartContext);
      return null;
    };
    
    const testQueryClient = createTestQueryClient();
    
    let root;
    TestRenderer.act(() => {
      root = TestRenderer.create(
        <QueryClientProvider client={testQueryClient}>
          <CartProvider>
            <TestComponent />
          </CartProvider>
        </QueryClientProvider>
      );
    });
    
    return { contextRef, root };
  };

  it('should initialize with an empty cart', async () => {
    let { contextRef } = setup();
    
    expect(contextRef.current.loading).toBe(true);
    expect(contextRef.current.cart).toEqual([]);
  });

  it('should add item to cart and calculate correct total price', async () => {
    await AsyncStorage.setItem('authToken', 'dummy_token');

    let { contextRef } = setup();

    await act(async () => {
      await contextRef.current.addToCart(
        1, 'Pisang', 10000, 1, null, null, 0, 'pisang.jpg', null
      );
    });

    // Wait for React Query to trigger a re-render and update the internal 'cart' state
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const cart = contextRef.current.getCart();
    expect(cart.length).toBe(1);
    expect(cart[0].product_id).toBe(1);
    expect(cart[0].name).toBe('Pisang');
    
    expect(cart[0].stock_schedule.tomorrow).toBe(false);
    expect(cart[0].stock_schedule.status).toBe(true);

    const total = contextRef.current.getTotalPrice();
    expect(total).toBe(10000);
  });

  it('should increment quantity if the same item is added again', async () => {
    await AsyncStorage.setItem('authToken', 'dummy_token');
    let { contextRef } = setup();

    await act(async () => {
      await contextRef.current.addToCart(1, 'Apel', 5000, 1, null, null, 0, 'apel.jpg', null);
    });

    await act(async () => {
      await contextRef.current.addToCart(1, 'Apel', 5000, 1, null, null, 0, 'apel.jpg', null);
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const cart = contextRef.current.getCart();
    expect(cart.length).toBe(1);
    expect(cart[0].quantity).toBe(2);

    const total = contextRef.current.getTotalPrice();
    expect(total).toBe(10000);
  });
});
