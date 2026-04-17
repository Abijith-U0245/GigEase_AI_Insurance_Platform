import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { COLORS } from '../theme/colors';

const LoginScreen = ({ navigation }: any) => {
  const [platform, setPlatform] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGetOTP = async () => {
    setErrorMsg('');
    if (!platform) {
        setErrorMsg("Please click on Zomato or Swiggy before getting the OTP!");
        return;
    }
    setLoading(true);
    // Auto-detect the right URL based on whether they use web or the physical phone
    const backendUrl = Platform.OS === 'web' 
        ? 'http://localhost:8000/send_otp_telegram'
        : 'http://192.168.0.101:8000/send_otp_telegram'; // Extracted directly from your Expo logs!

    // Call our backend Telegram OTP endpoint
    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // No phone number required anymore
      });
      const data = await response.json();
      setLoading(false);

      if (data.status === 'success') {
          setErrorMsg('');
          navigation.navigate('OTP', { platform });
      } else {
          setErrorMsg(data.message || "Unknown error");
      }
      
    } catch (e: any) {
      setLoading(false);
      setErrorMsg("Network Error: Could not reach the backend server.");
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, '#2a0a0a']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        <Animated.View entering={BounceIn.delay(200)} style={styles.logoContainer}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.logo}>
            <Text style={styles.logoText}>G</Text>
          </LinearGradient>
          <Text style={styles.title}>GigEase</Text>
          <Text style={styles.subtitle}>Parametric Income Protection</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.label}>SELECT PLATFORM</Text>
          <View style={styles.row}>
            {['Zomato', 'Swiggy'].map((p) => (
              <TouchableOpacity 
                key={p} 
                style={[styles.platformCard, platform === p && styles.platformCardActive]}
                onPress={() => setPlatform(p)}
              >
                <Text style={[
                  styles.platformText, 
                  { color: p === 'Zomato' ? '#E23744' : '#FC8019' },
                  platform === p && styles.platformTextActive
                ]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800)} style={{ width: '100%', marginTop: 20 }}>
          <TouchableOpacity 
            style={styles.button} 
            disabled={loading}
            onPress={handleGetOTP}
          >
            <LinearGradient 
              colors={(!platform) ? ['#333', '#222'] : [COLORS.primary, COLORS.primaryDark]} 
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Get Telegram OTP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {errorMsg ? (
          <Animated.View entering={FadeInUp} style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </Animated.View>
        ) : null}

      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  logo: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: COLORS.primary, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  logoText: { color: COLORS.text, fontSize: 40, fontWeight: '900' },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  section: { width: '100%', marginBottom: 24 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  platformCard: { flex: 1, backgroundColor: COLORS.card, padding: 16, borderRadius: 16, marginHorizontal: 6, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  platformCardActive: { borderColor: COLORS.primary, backgroundColor: '#2a110a' },
  platformText: { fontSize: 16, fontWeight: '800' },
  platformTextActive: { textShadowColor: 'rgba(255,87,34,0.5)', textShadowRadius: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16 },
  prefix: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '700', marginRight: 12 },
  input: { flex: 1, color: COLORS.text, fontSize: 18, fontWeight: '600', height: 60 },
  button: { width: '100%', height: 60, borderRadius: 16, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.5 },
  gradientButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  errorContainer: { marginTop: 20, padding: 12, backgroundColor: '#3a0000', borderRadius: 8, borderWidth: 1, borderColor: '#ff0000' },
  errorText: { color: COLORS.danger, fontSize: 13, fontWeight: '600', textAlign: 'center' }
});

export default LoginScreen;
