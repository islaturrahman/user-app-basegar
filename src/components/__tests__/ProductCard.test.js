import React from 'react';
import renderer from 'react-test-renderer';
import ProductCard from '../ProductCard';
import { performance } from 'perf_hooks';

describe('ProductCard Timeslot Calculation Performance', () => {
  it('should render ProductCard efficiently with complex timeslots', () => {
    // Generate complex timeslots to stress-test the parsing and sorting logic
    const complexSlots = JSON.stringify(
      Array.from({ length: 100 }, (_, i) => ({
        start_time: `${String(10 + (i % 10)).padStart(2, '0')}:00:00`,
        end_time: `${String(11 + (i % 10)).padStart(2, '0')}:00:00`
      }))
    );
    
    const product = {
      id: 1,
      name: 'Performance Test Product',
      time_slot: complexSlots,
      price: 25000,
      image: '[]',
      total_stock: 10
    };

    const start = performance.now();
    
    renderer.create(
      <ProductCard 
        product={product} 
        cartQuantity={0} 
        onPress={jest.fn()} 
        onAdd={jest.fn()} 
        onIncrease={jest.fn()} 
        onDecrease={jest.fn()} 
      />
    );

    const end = performance.now();
    const timeTaken = end - start;

    console.log(`ProductCard render with 100 timeslots took ${timeTaken.toFixed(2)} ms`);
    
    // Performance expectation: should render under 100ms
    expect(timeTaken).toBeLessThan(100);
  });
});
