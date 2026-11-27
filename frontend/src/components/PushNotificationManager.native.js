import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../config/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function PushNotificationManager({
  onNotificationReceived,
  onNotificationResponse,
}) {
  const { user, isLoading } = useAuth();
  const handledResponseIdentifier = useRef(null);

  useEffect(() => {
    if (isLoading || !user || Constants.executionEnvironment === 'storeClient') {
      return undefined;
    }
    let active = true;

    const registerForPushNotifications = async () => {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId
        || Constants.easConfig?.projectId;
      if (!projectId) {
        throw new Error('EAS project ID is missing. Run `eas init` before registering push notifications.');
      }

      if (Platform.OS === 'android') {
        if (!Constants.expoConfig?.extra?.fixbeeAndroidFirebaseConfigured) {
          throw new Error(
            'Android push notifications require Firebase configuration. Add google-services.json to frontend or set GOOGLE_SERVICES_FILE, then rebuild the native app.'
          );
        }

        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFB800',
        });
      }

      const currentPermission = await Notifications.getPermissionsAsync();
      let permissionStatus = currentPermission.status;
      if (permissionStatus !== 'granted') {
        const requestedPermission = await Notifications.requestPermissionsAsync();
        permissionStatus = requestedPermission.status;
      }
      if (permissionStatus !== 'granted') return;

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      if (!active) return;

      const response = await apiService.post('/notifications/push-token', { token });
      if (!response?.success) {
        throw new Error(response?.message || 'The server rejected the device push token.');
      }

      await AsyncStorage.setItem('@fixbee_push_token', token);
    };

    registerForPushNotifications().catch((error) => {
      console.error('Failed to register this device for push notifications.', error);
    });

    return () => {
      active = false;
    };
  }, [isLoading, user?.id]);

  useEffect(() => {
    const handleResponse = (response) => {
      const identifier = response.notification.request.identifier;
      if (identifier && identifier === handledResponseIdentifier.current) return;
      handledResponseIdentifier.current = identifier;
      onNotificationResponse?.(
        response.notification.request.content.data
      );
      Notifications.clearLastNotificationResponse();
    };

    const responseListener = Notifications.addNotificationResponseReceivedListener(handleResponse);
    const receivedListener = Notifications.addNotificationReceivedListener(() => {
      onNotificationReceived?.();
    });
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleResponse(response);
      })
      .catch((error) => {
        console.error('Failed to read the notification that launched the app.', error);
      });

    return () => {
      responseListener.remove();
      receivedListener.remove();
    };
  }, [onNotificationReceived, onNotificationResponse]);

  return null;
}
