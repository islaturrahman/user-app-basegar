// import { Platform } from 'react-native';
// import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications';
// import Constants from 'expo-constants';

// // Konfigurasi default handler saat aplikasi ada di foreground
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

export async function registerForPushNotificationsAsync() {
  let token;
  console.log("Push notifications disabled in Expo Go SDK 53");
  return token;
}
