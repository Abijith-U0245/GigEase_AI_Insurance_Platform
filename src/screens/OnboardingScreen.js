import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, RADIUS, FONT_SIZES } from '../theme/colors';
import { Card, PrimaryButton, Badge } from '../components/UIComponents';
import { CITIES, PLATFORMS } from '../data/mockData';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [platform, setPlatform] = useState('');

  const estimatedEarnings = {
    Swiggy: '₹7,500 – ₹9,500',
    Zomato: '₹7,000 – ₹9,000',
  };

  const handleGetStarted = () => {
    navigation.replace('MainTabs');
  };

  const renderStep0 = () => (
    <View style={styles.heroContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="shield-checkmark" size={56} color={COLORS.white} />
      </View>
      <Text style={styles.heroTitle}>GigEase</Text>
      <Text style={styles.heroSubtitle}>
        Protect your delivery income from disruptions
      </Text>
      <View style={styles.featureList}>
        {[
          { icon: 'rainy', text: 'Rain & weather protection' },
          { icon: 'flash', text: 'Instant claim payouts' },
          { icon: 'wallet', text: 'Low weekly premiums' },
        ].map((item, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={item.icon} size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
        ))}
      </View>
      <PrimaryButton title="Get Started" onPress={() => setStep(1)} style={styles.cta} />
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Your Details</Text>
      <Text style={styles.stepSubtitle}>Tell us about yourself to get personalized coverage</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={COLORS.textMuted}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+91 XXXXX XXXXX"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>City</Text>
        <View style={styles.chipContainer}>
          {CITIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, city === c && styles.chipActive]}
              onPress={() => setCity(c)}
            >
              <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <PrimaryButton
        title="Next"
        onPress={() => setStep(2)}
        disabled={!name || !phone || !city}
        style={styles.cta}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Select Your Platform</Text>
      <Text style={styles.stepSubtitle}>Which food delivery platform do you work with?</Text>

      <View style={styles.platformContainer}>
        {PLATFORMS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.platformCard, platform === p && styles.platformCardActive]}
            onPress={() => setPlatform(p)}
          >
            <View style={[styles.platformIconWrap, platform === p && styles.platformIconWrapActive]}>
              <Ionicons
                name={p === 'Swiggy' ? 'bicycle' : 'fast-food'}
                size={32}
                color={platform === p ? COLORS.white : COLORS.primary}
              />
            </View>
            <Text style={[styles.platformName, platform === p && styles.platformNameActive]}>{p}</Text>
            {platform === p && <Badge label="Selected" type="success" />}
          </TouchableOpacity>
        ))}
      </View>

      {platform ? (
        <Card style={styles.estimateCard}>
          <View style={styles.estimateRow}>
            <Ionicons name="trending-up" size={20} color={COLORS.success} />
            <Text style={styles.estimateLabel}>Estimated Weekly Earnings</Text>
          </View>
          <Text style={styles.estimateValue}>{estimatedEarnings[platform]}</Text>
          <Text style={styles.estimateNote}>Based on average {platform} partners in your city</Text>
        </Card>
      ) : null}

      <PrimaryButton
        title="Start Protection"
        onPress={handleGetStarted}
        disabled={!platform}
        style={styles.cta}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {step > 0 && (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 2) * 100}%` }]} />
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl + 30,
    gap: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  heroContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    ...SHADOWS.large,
  },
  heroTitle: {
    fontSize: FONT_SIZES.display,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginBottom: SPACING.sm,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  featureList: {
    width: '100%',
    marginBottom: SPACING.xxxl,
    gap: SPACING.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    ...SHADOWS.small,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cta: {
    width: '100%',
    marginTop: SPACING.lg,
  },
  formContainer: {
    paddingTop: SPACING.lg,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  stepSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.primaryFaded,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  platformContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  platformCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOWS.small,
  },
  platformCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryUltraLight,
  },
  platformIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformIconWrapActive: {
    backgroundColor: COLORS.primary,
  },
  platformName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  platformNameActive: {
    color: COLORS.primary,
  },
  estimateCard: {
    backgroundColor: COLORS.successFaded,
    borderWidth: 1,
    borderColor: COLORS.successLight,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  estimateLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  estimateValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  estimateNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});
