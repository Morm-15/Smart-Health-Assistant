// screens/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>مرحباً بك في الصفحة الرئيسية!</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        padding: width * 0.05,
    },
    text: {
        fontSize: width * 0.06,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default HomeScreen;
