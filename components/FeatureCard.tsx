import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface FeatureCardProps {
    icon: string;
    title: string;
    color?: string;
    onPress?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, color = '#009688', onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
    <Ionicons name={icon} size={40} color={color} />
    <Text style={styles.cardText}>{title}</Text>
        </TouchableOpacity>
);
};

const styles = StyleSheet.create({
    card: {
        width: '47%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingVertical: 25,
        paddingHorizontal: 10,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 4,
    },
    cardText: {
        marginTop: 12,
        fontSize: 15,
        color: '#009688',
        textAlign: 'center',
        fontWeight: '500',
    },
});

export default FeatureCard;
