import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, RADIUS, FONT_SIZES } from '../theme/colors';
import {
  Card, GradientCard, Badge, SectionHeader, StatItem, Divider,
} from '../components/UIComponents';
import {
  USER_PROFILE, WEEKLY_EARNINGS, ACTIVE_POLICY, RISK_LEVEL, DISRUPTION_ALERTS,
} from '../data/mockData';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const riskColor = {
    Low: COLORS.riskLow,
    Medium: COLORS.riskMedium,
    High: COLORS.riskHigh,
  };

  const earningsPct = Math.round(
    ((WEEKLY_EARNINGS.currentWeek - WEEKLY_EARNINGS.previousWeek) / WEEKLY_EARNINGS.previousWeek) * 100
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good afternoon,</Text>
            <Text style={styles.userName}>{USER_PROFILE.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications" size={22} color={COLORS.white} />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings Summary Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsTop}>
            <View>
              <Text style={styles.earningsLabel}>This Week's Earnings</Text>
              <Text style={styles.earningsValue}>
                {WEEKLY_EARNINGS.currency}{WEEKLY_EARNINGS.currentWeek.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.earningsChange, earningsPct >= 0 ? styles.earningsUp : styles.earningsDown]}>
              <Ionicons
                name={earningsPct >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={earningsPct >= 0 ? COLORS.success : COLORS.danger}
              />
              <Text style={[styles.earningsChangeTxt, { color: earningsPct >= 0 ? COLORS.success : COLORS.danger }]}>
                {Math.abs(earningsPct)}%
              </Text>
            </View>
          </View>
          <Divider />
          <View style={styles.statsRow}>
            <StatItem label="Deliveries" value={WEEKLY_EARNINGS.totalDeliveries} />
            <StatItem label="Hours" value={`${WEEKLY_EARNINGS.hoursWorked}h`} />
            <StatItem label="Protected" value={`₹${ACTIVE_POLICY.protectedIncome.toLocaleString()}`} color={COLORS.success} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Risk Level */}
        <SectionHeader title="Risk Level" />
        <Card>
          <View style={styles.riskRow}>
            <View style={[styles.riskIndicator, { backgroundColor: riskColor[RISK_LEVEL.current] }]}>
              <Ionicons name="shield" size={24} color={COLORS.white} />
            </View>
            <View style={styles.riskInfo}>
              <Text style={styles.riskTitle}>Current Risk: {RISK_LEVEL.current}</Text>
              <Text style={styles.riskSubtext}>Based on weather, traffic & air quality</Text>
            </View>
            <Badge label={RISK_LEVEL.current} type={RISK_LEVEL.current} />
          </View>
          <Divider />
          {RISK_LEVEL.factors.map((f, i) => (
            <View key={i} style={styles.factorRow}>
              <Text style={styles.factorLabel}>{f.label}</Text>
              <Text style={styles.factorDetail}>{f.detail}</Text>
              <Badge label={f.level} type={f.level} />
            </View>
          ))}
        </Card>

        {/* Active Policy */}
        <SectionHeader title="Active Policy" actionText="View Details" onAction={() => navigation.navigate('Policy')} />
        <Card onPress={() => navigation.navigate('Policy')} style={styles.policyCard}>
          <View style={styles.policyRow}>
            <View style={styles.policyIconBg}>
              <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.policyId}>{ACTIVE_POLICY.id}</Text>
              <Text style={styles.policyMeta}>Coverage up to ₹{ACTIVE_POLICY.coverageLimit.toLocaleString()}</Text>
            </View>
            <Badge label={ACTIVE_POLICY.status} type="active" />
          </View>
          <Divider />
          <View style={styles.policyStatsRow}>
            <View style={styles.policyStat}>
              <Text style={styles.policyStatLabel}>Premium</Text>
              <Text style={styles.policyStatValue}>₹{ACTIVE_POLICY.weeklyPremium}/wk</Text>
            </View>
            <View style={styles.policyDivider} />
            <View style={styles.policyStat}>
              <Text style={styles.policyStatLabel}>Renewal</Text>
              <Text style={styles.policyStatValue}>{ACTIVE_POLICY.renewalDate}</Text>
            </View>
          </View>
        </Card>

        {/* Disruption Alerts */}
        <SectionHeader title="Disruption Alerts" />
        {DISRUPTION_ALERTS.map((alert) => (
          <Card key={alert.id} style={styles.alertCard}>
            <View style={styles.alertRow}>
              <View style={[styles.alertIconBg, {
                backgroundColor: alert.severity === 'High' ? COLORS.dangerLight : COLORS.warningLight
              }]}>
                <Ionicons
                  name={
                    alert.type === 'Weather' ? 'rainy' :
                    alert.type === 'Traffic' ? 'car' : 'thermometer'
                  }
                  size={20}
                  color={alert.severity === 'High' ? COLORS.danger : COLORS.warning}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.alertTitleRow}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Badge label={alert.severity} type={alert.severity} />
                </View>
                <Text style={styles.alertDesc}>{alert.description}</Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Policy')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: COLORS.primaryFaded }]}>
              <Ionicons name="document-text" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>View Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Claims')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: COLORS.successFaded }]}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.actionLabel}>View Claims</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Analytics')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: COLORS.infoLight }]}>
              <Ionicons name="bar-chart" size={22} color={COLORS.info} />
            </View>
            <Text style={styles.actionLabel}>Analytics</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 50,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  userName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  earningsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.large,
  },
  earningsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  earningsValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  earningsChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  earningsUp: {
    backgroundColor: COLORS.successFaded,
  },
  earningsDown: {
    backgroundColor: COLORS.dangerLight,
  },
  earningsChangeTxt: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  riskIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskInfo: {
    flex: 1,
  },
  riskTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  riskSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  factorLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    width: 80,
  },
  factorDetail: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.sm,
  },
  policyCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  policyIconBg: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyId: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  policyMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  policyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  policyStat: {
    flex: 1,
    alignItems: 'center',
  },
  policyDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  policyStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  policyStatValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  alertCard: {
    marginBottom: SPACING.sm,
  },
  alertRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  alertIconBg: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  alertTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  alertDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  alertTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
