import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS, SPACING, RADIUS, FONT_SIZES } from '../theme/colors';

export const Card = ({ children, style, onPress }) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.card, style]} onPress={onPress} activeOpacity={0.85}>
      {children}
    </Wrapper>
  );
};

export const GradientCard = ({ children, style }) => (
  <View style={[styles.gradientCard, style]}>
    {children}
  </View>
);

export const Badge = ({ label, type = 'default' }) => {
  const badgeColors = {
    success: { bg: COLORS.successLight, text: COLORS.success },
    warning: { bg: COLORS.warningLight, text: COLORS.warning },
    danger: { bg: COLORS.dangerLight, text: COLORS.danger },
    info: { bg: COLORS.infoLight, text: COLORS.info },
    default: { bg: COLORS.primaryFaded, text: COLORS.primary },
    active: { bg: COLORS.successLight, text: COLORS.success },
    pending: { bg: COLORS.warningLight, text: '#B45309' },
    approved: { bg: COLORS.successLight, text: COLORS.success },
    rejected: { bg: COLORS.dangerLight, text: COLORS.danger },
    low: { bg: COLORS.successLight, text: COLORS.success },
    medium: { bg: COLORS.warningLight, text: '#B45309' },
    high: { bg: COLORS.dangerLight, text: COLORS.danger },
  };

  const colors = badgeColors[type.toLowerCase()] || badgeColors.default;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

export const PrimaryButton = ({ title, onPress, style, disabled }) => (
  <TouchableOpacity
    style={[styles.primaryButton, disabled && styles.disabledButton, style]}
    onPress={onPress}
    activeOpacity={0.8}
    disabled={disabled}
  >
    <Text style={styles.primaryButtonText}>{title}</Text>
  </TouchableOpacity>
);

export const OutlineButton = ({ title, onPress, style }) => (
  <TouchableOpacity
    style={[styles.outlineButton, style]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.outlineButtonText}>{title}</Text>
  </TouchableOpacity>
);

export const SectionHeader = ({ title, actionText, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {actionText && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const StatItem = ({ label, value, color, sub }) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    {sub && <Text style={styles.statSub}>{sub}</Text>}
  </View>
);

export const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  gradientCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    ...SHADOWS.large,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  disabledButton: {
    backgroundColor: COLORS.textMuted,
  },
  primaryButtonText: {
    color: COLORS.textWhite,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionAction: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
});
