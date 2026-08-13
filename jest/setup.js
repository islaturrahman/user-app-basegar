import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

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
