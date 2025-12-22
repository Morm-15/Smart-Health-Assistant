import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { ThemeProvider } from './contexts/ThemeContext';
import './i18n';

export default function App() {

  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
