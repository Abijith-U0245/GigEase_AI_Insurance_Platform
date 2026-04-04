import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, Easing, withRepeat, FadeInRight, FadeInDown } from 'react-native-reanimated';
import { COLORS } from '../theme/colors';

const PIPELINE_STEPS = [
  { id: 1, title: 'Event Detected', desc: 'Heavy Rainfall in Velachery via IMD' },
  { id: 2, title: 'Smart Contract Trigger', desc: 'SLA threshold breached > 50mm/hr' },
  { id: 3, title: 'Worker Proximity Check', desc: 'Verifying GPS bounds' },
  { id: 4, title: 'AI Fraud Check', desc: 'Score: 94/100 (Safe)' },
  { id: 5, title: 'Calculating Payout', desc: 'Computing lost hours estimate' },
  { id: 6, title: 'Payout Dispatched', desc: '₹1240 sent via Razorpay' },
];

const PipelineScreen = ({ navigation }: any) => {
  const activeStep = useSharedValue(0);
  const bikePosition = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Pulse the main stroke
    glowOpacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);

    // Animate the pipeline step by step
    const animatePipeline = async () => {
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        activeStep.value = i;
        bikePosition.value = withTiming(i * 100, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        await new Promise(r => setTimeout(r, 1200));
      }
      activeStep.value = PIPELINE_STEPS.length;
    };
    
    animatePipeline();
  }, []);

  const bikeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bikePosition.value }]
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return { opacity: glowOpacity.value };
  });

  return (
    <LinearGradient colors={[COLORS.background, '#1a0505', '#2a0000']} style={styles.container}>
      
      <Animated.View entering={FadeInDown} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Automated Claim</Text>
        <Text style={styles.subtitle}>GE-CLM-001</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.timelineWrapper}>
          
          {/* Vertical Track */}
          <View style={styles.trackBackground} />
          
          <Animated.View style={[styles.trackActive, glowStyle, { height: '100%' }]} />

          {/* Animated Delivery Bike */}
          <Animated.View style={[styles.bikeContainer, bikeStyle]}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.bikeBlob}>
              <Text style={styles.bikeIcon}>🚴</Text>
            </LinearGradient>
          </Animated.View>

          {/* Timeline Nodes */}
          <View style={styles.nodesContainer}>
            {PIPELINE_STEPS.map((step, index) => {
              const isActive = useAnimatedStyle(() => {
                const scaled = activeStep.value >= index ? 1 : 0;
                return { opacity: withTiming(scaled ? 1 : 0.3) };
              });
              
              const isCurrent = useAnimatedStyle(() => {
                const isPulse = activeStep.value === index;
                return { 
                    transform: [{ scale: withTiming(isPulse ? 1.05 : 1) }],
                    borderColor: withTiming(isPulse ? COLORS.primary : COLORS.border)
                };
              });

              return (
                <Animated.View key={step.id} style={[styles.nodeRow, isActive]}>
                  <View style={styles.dotContainer}>
                    <Animated.View style={[styles.dot, isCurrent]} />
                  </View>
                  <Animated.View entering={FadeInRight.delay(index * 200)} style={styles.card}>
                    <Text style={styles.cardTitle}>{step.title}</Text>
                    <Text style={styles.cardDesc}>{step.desc}</Text>
                  </Animated.View>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(1000)} style={styles.bottomCard}>
            <Text style={styles.bottomTitle}>Smart Contract Status</Text>
            <View style={styles.progressRow}>
                 <ActivityIndicator color={COLORS.primary} size="small" />
                 <Text style={styles.progressText}>Monitoring Oracle Feeds</Text>
            </View>
        </Animated.View>

      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20 },
  backBtn: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700', letterSpacing: 2 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 60, paddingTop: 20 },
  timelineWrapper: { flexDirection: 'row', minHeight: 600 },
  trackBackground: { position: 'absolute', left: 24, top: 20, bottom: 0, width: 4, backgroundColor: COLORS.border, borderRadius: 2 },
  trackActive: { position: 'absolute', left: 24, top: 20, width: 4, backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
  bikeContainer: { position: 'absolute', left: 6, top: 10, zIndex: 10 },
  bikeBlob: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF5722', shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
  bikeIcon: { fontSize: 20 },
  nodesContainer: { flex: 1, paddingTop: 10 },
  nodeRow: { flexDirection: 'row', alignItems: 'center', height: 100 },
  dotContainer: { width: 50, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.card, borderWidth: 3, borderColor: COLORS.primary },
  card: { flex: 1, backgroundColor: 'rgba(20, 20, 20, 0.8)', borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
  bottomCard: { marginTop: 40, backgroundColor: COLORS.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.primaryDark },
  bottomTitle: { color: COLORS.text, fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressText: { color: COLORS.primary, fontWeight: '600' }
});

export default PipelineScreen;
