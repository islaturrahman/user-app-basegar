import React, { useRef, useState, useContext } from "react";
import { View, Text, TouchableOpacity, FlatList, Platform, Dimensions } from "react-native";
import ImageWithSkeleton from "../../../components/ImageWithSkeleton";
import { useNavigation } from "@react-navigation/native";
import { path_category_img, base_url, category } from "../../../config/enpoints";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";

export default function CategoryWidget() {
  const windowWidth = Dimensions.get('window').width;
  const screenWidth = Platform.OS === 'web' ? Math.min(windowWidth, 600) : windowWidth;
  const layoutWidth = screenWidth - 32; // Assuming parent has px-4

  const navigation = useNavigation();
  const [activePage, setActivePage] = useState(0);
  const { data: catData = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch(`${base_url}${category}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    }
  });

  const backendCategories = Array.isArray(catData) && catData.length > 0 ? catData : [];

  // Helper to format category image URLs
  const getCategoryImageUrl = (img) => {
    if (!img || img === "def.png") return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=150";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return `${path_category_img}/${img}`;
  };

  const categoriesList = backendCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    image: getCategoryImageUrl(cat.image)
  }));

  const handleClickCategory = (cat) => {
    if (cat.id) {
      navigation.navigate("/categories/:category_id", { category_id: cat.id });
    }
  };

  if (isLoading) {
    return (
      <View className="w-full bg-white flex-row justify-between pt-2 pb-4">
        {[1, 2, 3, 4, 5].map((key) => (
          <View key={key} className="flex-col items-center">
            <View className="w-14 h-14 rounded-full bg-gray-200 mb-2" />
            <View className="w-12 h-2.5 bg-gray-200 rounded-full" />
          </View>
        ))}
      </View>
    );
  }

  // Group items into pairs (rows of 2) for the vertical stack within the horizontal scroll
  const chunkedCategories = [];
  for (let i = 0; i < categoriesList.length; i += 2) {
    chunkedCategories.push(categoriesList.slice(i, i + 2));
  }

  const columnsPerPage = 5;
  const columnWidth = layoutWidth / columnsPerPage;
  const totalPages = Math.ceil(chunkedCategories.length / columnsPerPage) || 1;

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const maxScroll = event.nativeEvent.contentSize.width - event.nativeEvent.layoutMeasurement.width;
    
    if (maxScroll <= 0) {
      setActivePage(0);
      return;
    }
    
    // Calculate progress from 0.0 to 1.0
    const progress = Math.max(0, Math.min(1, scrollPosition / maxScroll));
    const page = Math.round(progress * (totalPages - 1));
    setActivePage(page);
  };

  return (
    <View className="w-full bg-white">
      <FlatList
        horizontal
        data={chunkedCategories}
        keyExtractor={(_, index) => `col-${index}`}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={layoutWidth}
        decelerationRate="fast"
        renderItem={({ item: column, index: colIndex }) => (
          <View style={{ width: columnWidth }} className="flex-col">
            {column.map((cat, index) => (
              <TouchableOpacity
                key={cat.id || index}
                className="flex-col items-center justify-center mb-3"
                activeOpacity={0.7}
                onPress={() => handleClickCategory(cat)}
              >
                <View className="w-14 h-14 rounded-full overflow-hidden border border-gray-100 bg-green-50 flex items-center justify-center">
                  <Image 
                    source={{ uri: cat.image }}
                    className="w-full h-full"
                    contentFit="cover"
                    transition={200}
                  />
                </View>
                <Text 
                  className="text-[10px] text-gray-700 text-center mt-1.5 leading-tight" 
                  numberOfLines={2}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {/* Swipe Dots Indicator */}
      {totalPages > 1 && (
        <View className="flex-row justify-center space-x-1.5 mt-3.5">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <View
              key={idx}
              className={`h-1.5 rounded-full ${
                activePage === idx ? "w-4 bg-green-600" : "w-1.5 bg-gray-200"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
