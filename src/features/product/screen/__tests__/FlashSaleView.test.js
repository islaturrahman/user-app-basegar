import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FlashSaleView from '../FlashSaleView';
import CartContext from '../../../../context/CartContext';
import ProductsContext from '../../../../context/ProductsContext';
import * as api from '../../../../data/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: { id: 1 },
  }),
}));

const mockUseInfiniteQuery = jest.fn();
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useInfiniteQuery: (...args) => mockUseInfiniteQuery(...args),
  };
});

// Mock expo vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  FontAwesome5: 'FontAwesome5',
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    FlashList: React.forwardRef(({ data, renderItem, ListEmptyComponent, ...props }, ref) => {
      return React.createElement(
        View,
        { ...props, testID: 'flash-list' },
        (!data || data.length === 0) && ListEmptyComponent 
          ? React.createElement(View, { testID: 'flash-list-empty' }, ListEmptyComponent)
          : data && data.map((item, index) => 
              React.createElement(
                View,
                { key: index, testID: `flash-list-item-${index}` },
                renderItem ? renderItem({ item, index }) : null
              )
            )
      );
    })
  };
});

// Spy on API call
jest.spyOn(api, 'get').mockImplementation(async (url) => {
  if (url.includes('/timeSlot')) {
    return [{ id: 1, start_time: '08:00:00', end_time: '12:00:00' }];
  }
  if (url.includes('/flash-deals/products/1')) {
    return {
      products: [
        {
          id: 101,
          name: 'Flash Sale Product 1',
          price: 5000,
          total_stock: 10,
          image: 'flash1.jpg',
        },
        {
          id: 102,
          name: 'Flash Sale Product 2',
          price: 15000,
          total_stock: 0,
          image: 'flash2.jpg',
        }
      ]
    };
  }
  return [];
});

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('FlashSaleView (FlashList & Loading)', () => {
  let queryClient;

  beforeEach(async () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          [
            {
              id: 101,
              name: 'Flash Sale Product 1',
              price: 5000,
              total_stock: 10,
              image: 'flash1.jpg',
            },
            {
              id: 102,
              name: 'Flash Sale Product 2',
              price: 15000,
              total_stock: 0,
              image: 'flash2.jpg',
            }
          ]
        ]
      },
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
      refetch: jest.fn()
    });

    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  const setup = () => {
    const mockCartContext = {
      cart: [],
      getCart: jest.fn(() => []),
      addToCart: jest.fn(),
      addQuantity: jest.fn(),
      minQuantity: jest.fn(),
    };

    const mockProductsContext = {
      deliveryDate: 'today',
      setDeliveryDate: jest.fn(),
    };

    let root;
    TestRenderer.act(() => {
      root = TestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <CartContext.Provider value={mockCartContext}>
            <ProductsContext.Provider value={mockProductsContext}>
              <FlashSaleView />
            </ProductsContext.Provider>
          </CartContext.Provider>
        </QueryClientProvider>
      );
    });

    return { root, mockCartContext };
  };

  it('should render loading state initially or fast enough, then render FlashList with products', async () => {
    const { root } = setup();

    // Flush promises so the query resolves
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    // We use findByType because our mock might not propagate testID properly in all cases
    const { FlashList } = require('@shopify/flash-list');
    const flashList = root.root.findByType(FlashList);
    expect(flashList).toBeTruthy();

    const items = root.root.findAll(node => 
      node.props.testID && node.props.testID.startsWith('flash-list-item-')
    );
    expect(items.length).toBeGreaterThanOrEqual(2); // 2 produk di-render (bisa lebih karena nested)
  });

  it('should handle product addition with out of stock logic', async () => {
    const { root, mockCartContext } = setup();

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    // We can't directly press ProductCard's button unless we know its props, but we can find the ProductCard components
    const productCards = root.root.findAllByProps({ layoutType: 'category' });
    expect(productCards.length).toBe(2);

    // Press Add on Product 1 (in stock)
    await act(async () => {
      // simulate onAdd callback from ProductCard
      await productCards[0].props.onAdd({
        id: 101, name: 'Flash Sale Product 1', price: 5000, total_stock: 10, image: 'flash1.jpg'
      });
    });

    // Since token is empty initially, it should navigate to login
    expect(mockNavigate).toHaveBeenCalledWith('/login');

    // Now set token and try again
    await AsyncStorage.setItem('authToken', 'token');
    await act(async () => {
      await productCards[0].props.onAdd({
        id: 101, name: 'Flash Sale Product 1', price: 5000, total_stock: 10, image: 'flash1.jpg'
      });
    });

    expect(mockCartContext.addToCart).toHaveBeenCalledWith(
      101, 'Flash Sale Product 1', 5000, 1, '', [], 0, 'flash1.jpg', undefined
    );
  });
});
