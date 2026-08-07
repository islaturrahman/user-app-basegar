import React, { useContext } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import AppBar from "../../../components/AppBar";
import { ConfigContext } from "../../../provider/ConfigProvider";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StaticPage() {
  const route = useRoute();
  const { config } = useContext(ConfigContext);
  const { type, title } = route.params || {};

  // Retrieve the appropriate HTML content from the config object
  let htmlContent = "";
  if (config) {
    if (type === "privacy_policy") htmlContent = config.privacy_policy;
    else if (type === "terms_and_conditions") htmlContent = config.terms_and_conditions;
    else if (type === "about_us") htmlContent = config.about_us;
  }

  // Wrap the HTML with basic styling for mobile readability
  const wrappedHtml = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            padding: 16px;
            color: #374151;
            line-height: 1.6;
            font-size: 15px;
          }
          h1, h2, h3 { color: #111827; }
          a { color: #15803d; text-decoration: none; }
        </style>
      </head>
      <body>
        ${htmlContent || "<p>Data tidak ditemukan. Pastikan halaman sudah diatur di Admin Panel.</p>"}
      </body>
    </html>
  `;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <AppBar title={title || "Informasi"} />
      <View className="flex-1">
        {config ? (
          Platform.OS === 'web' ? (
            <iframe srcDoc={wrappedHtml} style={{ width: '100%', height: '100%', border: 'none' }} />
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: wrappedHtml }}
              startInLoadingState={true}
              renderLoading={() => (
                <View className="absolute inset-0 items-center justify-center bg-white">
                  <ActivityIndicator size="large" color="#15803d" />
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          )
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#15803d" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
