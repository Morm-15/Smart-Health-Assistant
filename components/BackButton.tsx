// components/BackButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function BackButton() {
    const navigation = useNavigation();

    return (
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={32} color="#333" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
        backgroundColor: '#fff',
        padding: 6,
        borderRadius: 50,
        elevation: 3, // ظل للأندرويد
        shadowColor: '#000', // ظل للـ iOS
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
});
