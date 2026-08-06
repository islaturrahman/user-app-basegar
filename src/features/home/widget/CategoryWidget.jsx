import React, { useRef, useState, useContext } from "react";
import { View, Text, TouchableOpacity, Dimensions, FlatList } from "react-native";
import ImageWithSkeleton from "../../../components/ImageWithSkeleton";
import { useNavigation } from "@react-navigation/native";
import { path_category_img, base_url, category } from "../../../config/enpoints";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";

export default function CategoryWidget() {
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

  // Fallback static categories list if DB is empty
  const fallbackCategories = [
    { id: 10, name: "Sembako", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=150" },
    { id: 12, name: "Buah", image: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&q=80&w=150" },
    { id: 1, name: "Sayuran", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=150" },
    { id: 8, name: "Daging", image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=150" },
    { id: 3, name: "Seafood", image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&q=80&w=150" },
  ];

  const categoriesList = backendCategories.length > 0
    ? backendCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        image: getCategoryImageUrl(cat.image)
      }))
    : fallbackCategories;

  const handleClickCategory = (cat) => {
    if (cat.id) {
      navigation.navigate("/categories/:category_id", { category_id: cat.id });
    } else {
      navigation.navigate("/categories/:category_id", { category_id: 10 });
    }
  };

  // Group items into pairs (rows of 2) for the vertical stack within the horizontal scroll
  const chunkedCategories = [];
  for (let i = 0; i < categoriesList.length; i += 2) {
    chunkedCategories.push(categoriesList.slice(i, i + 2));
  }

  const screenWidth = Dimensions.get('window').width;
  const layoutWidth = screenWidth - 32; // Assuming parent has px-4
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
                    source={cat.image}
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
