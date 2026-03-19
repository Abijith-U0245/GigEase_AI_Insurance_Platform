import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../theme/colors';
import { Card, Badge, SectionHeader, Divider } from '../components/UIComponents';
import { CLAIMS } from '../data/mockData';

export default function ClaimsScreen() {
  const statusIcon = { Approved: 'checkmark-circle', Pending: 'time', Rejected: 'close-circle' };
  const typeIcon = { Weather: 'rainy', Traffic: 'car', Heat: 'thermometer' };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Claims</Text>
          <Text style={styles.subtitle}>Auto-detected disruptions and payouts</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Total Claims', value: CLAIMS.length, icon: 'document-text', bg: COLORS.primaryFaded, color: COLORS.primary },
            { label: 'Approved', value: CLAIMS.filter(c => c.status === 'Approved').length, icon: 'checkmark-circle', bg: COLORS.successFaded, color: COLORS.success },
            { label: 'Pending', value: CLAIMS.filter(c => c.status === 'Pending').length, icon: 'time', bg: COLORS.warningLight, color: COLORS.warning },
          ].map((s, i) => (
            <Card key={i} style={styles.summaryCard}>
              <View style={[styles.summaryIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={styles.summaryValue}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>

        <SectionHeader title="All Claims" />
        {CLAIMS.map((claim) => (
          <Card key={claim.id} style={[styles.claimCard, {
            borderLeftColor: claim.status === 'Approved' ? COLORS.success : claim.status === 'Pending' ? COLORS.warning : COLORS.danger,
          }]}>
            <View style={styles.claimHeader}>
              <View style={[styles.claimTypeIcon, {
                backgroundColor: claim.type === 'Weather' ? COLORS.infoLight : claim.type === 'Traffic' ? COLORS.warningLight : COLORS.dangerLight,
              }]}>
                <Ionicons name={typeIcon[claim.type] || 'alert'} size={20} color={claim.type === 'Weather' ? COLORS.info : claim.type === 'Traffic' ? COLORS.warning : COLORS.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.claimEvent}>{claim.event}</Text>
                <Text style={styles.claimDate}>{claim.date}</Text>
              </View>
              <Badge label={claim.status} type={claim.status} />
            </View>
            <Divider />
            <View style={styles.claimDetails}>
              <View style={styles.claimDetail}>
                <Text style={styles.claimDetailLabel}>Estimated Loss</Text>
                <Text style={styles.claimDetailValue}>₹{claim.estimatedLoss.toLocaleString()}</Text>
              </View>
              <View style={styles.claimDetailDivider} />
              <View style={styles.claimDetail}>
                <Text style={styles.claimDetailLabel}>Payout</Text>
                <Text style={[styles.claimDetailValue, {
                  color: claim.status === 'Approved' ? COLORS.success : claim.status === 'Rejected' ? COLORS.danger : COLORS.textMuted,
                }]}>
                  {claim.status === 'Approved' ? `₹${claim.payoutAmount.toLocaleString()}` : claim.status === 'Pending' ? 'Processing...' : '₹0'}
                </Text>
              </View>
            </View>
            <View style={styles.claimFooter}>
              <Ionicons name={statusIcon[claim.status]} size={16} color={claim.status === 'Approved' ? COLORS.success : claim.status === 'Pending' ? COLORS.warning : COLORS.danger} />
              <Text style={[styles.claimFooterText, {
                color: claim.status === 'Approved' ? COLORS.success : claim.status === 'Pending' ? COLORS.warning : COLORS.danger,
              }]}>
                {claim.status === 'Approved' ? 'Credited to your account' : claim.status === 'Pending' ? 'Under review – typically 24h' : 'Does not meet coverage criteria'}
              </Text>
            </View>
          </Card>
        ))}
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
  summaryRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xxl },
  summaryCard: { flex: 1, alignItems: 'center', padding: SPACING.lg },
  summaryIcon: { width: 40, height: 40, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  summaryValue: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.textPrimary },
  summaryLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  claimCard: { borderLeftWidth: 4, marginBottom: SPACING.md },
  claimHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  claimTypeIcon: { width: 40, height: 40, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  claimEvent: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  claimDate: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  claimDetails: { flexDirection: 'row', alignItems: 'center' },
  claimDetail: { flex: 1, alignItems: 'center' },
  claimDetailDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  claimDetailLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginBottom: 2 },
  claimDetailValue: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  claimFooter: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md, backgroundColor: COLORS.background, padding: SPACING.md, borderRadius: RADIUS.sm },
  claimFooterText: { fontSize: FONT_SIZES.xs, fontWeight: '500' },
});
