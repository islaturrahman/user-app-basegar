import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Dimensions, TouchableOpacity } from "react-native";
import Skeleton from "../../../components/Skeleton";
import { banners, path_banner_img, base_url } from "../../../config/enpoints";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";

const { width } = Dimensions.get('window');

const BannerWidget = () => {
  const { data: bannerList = [], isLoading: loading } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const response = await fetch(`${base_url}${banners}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const json = await response.json();
      
      if (Array.isArray(json) && json.length > 0) {
        return json;
      } else if (json && json.banners && json.banners.length > 0) {
        return json.banners;
      }
      return [];
    }
  });

  const getParsedImage = (img) => {
    if (!img) return null;
    if (Array.isArray(img)) return img[0];
    if (typeof img === 'string' && img.startsWith('[')) {
      try {
        return JSON.parse(img)[0];
      } catch (e) {
        return img;
      }
    }
    return img;
  };

  const bannerWidth = width - 32;
  const bannerHeight = (bannerWidth * (9 / 16)) - 10;

  if (loading) {
    return (
      <View style={{ height: bannerHeight }} className="rounded-xl mx-4 my-0 overflow-hidden">
        <Skeleton width="100%" height="100%" borderRadius={12} />
      </View>
    );
  }

  if (bannerList.length === 0) {
    return (
      <View style={{ height: bannerHeight }} className="bg-gray-100 rounded-xl items-center justify-center mx-4 my-0">
        <Text className="text-gray-400">Tidak ada banner promo saat ini</Text>
      </View>
    );
  }

  return (
    <View style={{ height: bannerHeight + 16 }}>
      <FlatList 
        horizontal 
        data={bannerList}
        keyExtractor={(item, index) => (item.id || index).toString()}
        showsHorizontalScrollIndicator={false} 
        className="py-2"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        pagingEnabled
        snapToInterval={bannerWidth + 12} // width + margin
        decelerationRate="fast"
        renderItem={({item}) => {
          const parsedImage = getParsedImage(item.image);
          return (
            <TouchableOpacity className="mr-3" activeOpacity={0.9}>
              <Image 
                source={parsedImage ? (parsedImage.startsWith('http') ? parsedImage : `${path_banner_img}/${parsedImage}`) : "https://via.placeholder.com/600x300"}
                style={{ width: bannerWidth, height: bannerHeight }}
                className="rounded-xl bg-gray-200"
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default BannerWidget;
