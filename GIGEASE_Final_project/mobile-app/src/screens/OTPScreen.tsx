import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInLeft, FadeInRight, BounceIn } from 'react-native-reanimated';
import { COLORS } from '../theme/colors';

const OTPScreen = ({ navigation }: any) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<any[]>([]);

  const handleDigit = (index: number, value: string) => {
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (newDigits.every(d => d.length > 0)) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        navigation.navigate('MainTabs');
      }, 1500);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, '#2a0a0a']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        <Animated.View entering={BounceIn} style={styles.header}>
          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>Enter the 6-digit OTP sent via Telegram</Text>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(200)} style={styles.otpContainer}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={el => { inputs.current[index] = el; }}
              style={[styles.otpInput, digit.length > 0 && styles.otpInputFilled]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(v) => handleDigit(index, v)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              selectTextOnFocus
            />
          ))}
        </Animated.View>

        {loading && (
          <Animated.View entering={FadeInLeft} style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Verifying Secure Match...</Text>
          </Animated.View>
        )}

      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  phoneHighlight: { fontSize: 18, color: COLORS.primary, fontWeight: 'bold', marginTop: 4 },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, width: '100%', marginBottom: 40 },
  otpInput: { width: 50, height: 60, backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.border, borderRadius: 12, color: COLORS.text, fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  otpInputFilled: { borderColor: COLORS.primary, backgroundColor: '#2a110a', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  loadingContainer: { alignItems: 'center', marginTop: 20 },
  loadingText: { color: COLORS.primary, marginTop: 12, fontWeight: 'bold' }
});

export default OTPScreen;
