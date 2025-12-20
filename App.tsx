import React, { useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator';
import { ThemeProvider } from './contexts/ThemeContext';
import { registerForPushNotificationsAsync } from './services/notificationService';
import './i18n';

export default function App() {
  useEffect(() => {
    // طلب أذونات الإشعارات عند بدء التطبيق
    registerForPushNotificationsAsync();
  }, []);

  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
