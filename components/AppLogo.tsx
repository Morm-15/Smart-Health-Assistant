// components/AppLogo.tsx
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const AppLogo = () => {
    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/logo.png')} // تأكد من وجود صورة الشعار في هذا المسار
                style={styles.logo}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 40,
    },
    logo: {
        width: 150,
        height: 150,
    },
});

export default AppLogo;