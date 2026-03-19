import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../theme/colors';
import { Card, Badge, SectionHeader, Divider } from '../components/UIComponents';
import { ACTIVE_POLICY } from '../data/mockData';

export default function PolicyScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Your Policy</Text>
          <Text style={styles.subtitle}>Parametric income protection for food delivery</Text>
        </View>

        <Card style={styles.mainCard}>
          <View style={styles.policyHeader}>
            <View style={styles.policyIconBg}>
              <Ionicons name="shield-checkmark" size={28} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.policyId}>{ACTIVE_POLICY.id}</Text>
              <Text style={styles.policyDate}>Since {ACTIVE_POLICY.startDate}</Text>
            </View>
            <Badge label={ACTIVE_POLICY.status} type="active" />
          </View>
          <Divider />
          <View style={styles.detailGrid}>
            {[
              { icon: 'wallet-outline', label: 'Weekly Premium', value: `₹${ACTIVE_POLICY.weeklyPremium}`, color: COLORS.primary },
              { icon: 'umbrella-outline', label: 'Coverage Limit', value: `₹${ACTIVE_POLICY.coverageLimit.toLocaleString()}`, color: COLORS.success },
              { icon: 'calendar-outline', label: 'Renewal Date', value: ACTIVE_POLICY.renewalDate, color: COLORS.warning },
              { icon: 'sync-outline', label: 'Auto-Deduction', value: ACTIVE_POLICY.autoDeduction ? 'Enabled' : 'Disabled', color: COLORS.info },
            ].map((item, i) => (
              <View key={i} style={styles.detailItem}>
                <Ionicons name={item.icon} size={20} color={item.color} />
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        <SectionHeader title="Covered Events" />
        <Card>
          {ACTIVE_POLICY.coveredEvents.map((event, i) => (
            <View key={i}>
              <View style={styles.eventRow}>
                <View style={styles.eventIcon}>
                  <Ionicons name={event.includes('Rain') ? 'rainy' : event.includes('Heat') ? 'thermometer' : event.includes('Pollution') ? 'cloud' : event.includes('Traffic') ? 'car' : 'lock-closed'} size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.eventText}>{event}</Text>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>
              {i < ACTIVE_POLICY.coveredEvents.length - 1 && <Divider />}
            </View>
          ))}
        </Card>

        <SectionHeader title="How It Works" />
        <Card style={styles.howCard}>
          {[
            { title: 'Disruption Detected', desc: 'We monitor weather, traffic & air quality in real-time.' },
            { title: 'Loss Estimated', desc: 'AI estimates your potential income loss from the event.' },
            { title: 'Auto Payout', desc: 'Approved claims are paid within 24 hours to your account.' },
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </Card>

        <SectionHeader title="Premium Breakdown" />
        <Card>
          {[{ l: 'Base Premium', v: '₹99' }, { l: 'City Risk Surcharge', v: '₹30' }, { l: 'Extended Coverage', v: '₹20' }].map((r, i) => (
            <View key={i} style={styles.premiumRow}>
              <Text style={styles.premiumLabel}>{r.l}</Text>
              <Text style={styles.premiumValue}>{r.v}</Text>
            </View>
          ))}
          <Divider />
          <View style={styles.premiumRow}>
            <Text style={[styles.premiumLabel, { fontWeight: '800', color: COLORS.textPrimary }]}>Total Weekly</Text>
            <Text style={[styles.premiumValue, { fontWeight: '800', color: COLORS.primary, fontSize: FONT_SIZES.xl }]}>₹{ACTIVE_POLICY.weeklyPremium}</Text>
          </View>
        </Card>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl, paddingTop: 50 },
  headerSection: { marginBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -1 },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  mainCard: { borderTopWidth: 4, borderTopColor: COLORS.primary, marginBottom: SPACING.xxl },
  policyHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  policyIconBg: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryFaded, justifyContent: 'center', alignItems: 'center' },
  policyId: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  policyDate: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  detailItem: { width: '47%', backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.lg, gap: SPACING.xs },
  detailLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  eventIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.primaryFaded, justifyContent: 'center', alignItems: 'center' },
  eventText: { flex: 1, fontSize: FONT_SIZES.md, fontWeight: '500', color: COLORS.textPrimary },
  howCard: { gap: SPACING.lg },
  stepRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { color: COLORS.white, fontWeight: '800', fontSize: FONT_SIZES.sm },
  stepTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  stepDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  premiumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
  premiumLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  premiumValue: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
});
