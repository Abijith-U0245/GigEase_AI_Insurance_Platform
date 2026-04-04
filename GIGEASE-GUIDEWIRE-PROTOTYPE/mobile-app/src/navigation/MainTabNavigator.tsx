import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { COLORS } from '../theme/colors';

const Tab = createBottomTabNavigator();

const HomeScreen = ({ navigation }: any) => (
  <View style={styles.container}>
    <LinearGradient colors={['#1a0505', COLORS.background]} style={StyleSheet.absoluteFillObject} />
    <Animated.View entering={FadeIn.duration(800)} style={styles.card}>
        <Text style={styles.header}>Velachery Zone Status</Text>
        <Text style={styles.statusText}>🚨 WATERLOGGING DISRUPTION</Text>
        
        <TouchableOpacity style={styles.pipelineButton} onPress={() => navigation.navigate('Pipeline')}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.gradientBtn}>
            <Text style={styles.btnText}>Track Claim Pipeline</Text>
          </LinearGradient>
        </TouchableOpacity>
    </Animated.View>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.container}>
    <Text style={styles.header}>Profile</Text>
  </View>
);

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#222',
          height: 80,
          paddingBottom: 20
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
      }}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  card: { backgroundColor: COLORS.card, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: COLORS.primary, shadowOpacity: 0.2, shadowRadius: 15, elevation: 5 },
  statusText: { fontSize: 16, color: COLORS.danger, fontWeight: '800', marginBottom: 30 },
  pipelineButton: { width: '100%', height: 50, borderRadius: 12, overflow: 'hidden' },
  gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 }
});
