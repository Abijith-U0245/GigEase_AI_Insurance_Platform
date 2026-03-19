import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../theme/colors';
import { Card, SectionHeader, Divider } from '../components/UIComponents';
import { EARNINGS_HISTORY, DELIVERY_TRENDS, WEEKLY_EARNINGS } from '../data/mockData';

const screenWidth = Dimensions.get('window').width - 80;

export default function AnalyticsScreen() {
  const chartData = {
    labels: EARNINGS_HISTORY.map(e => e.week),
    datasets: [{ data: EARNINGS_HISTORY.map(e => e.earnings), strokeWidth: 3 }],
  };
  const chartConfig = {
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(26, 86, 219, ${opacity})`,
    labelColor: () => COLORS.textMuted,
    propsForDots: { r: '5', strokeWidth: '2', stroke: COLORS.primary },
    propsForBackgroundLines: { stroke: COLORS.borderLight },
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Your delivery performance insights</Text>
        </View>

        {/* Earnings Graph */}
        <SectionHeader title="Weekly Earnings" />
        <Card>
          <LineChart
            data={chartData}
            width={screenWidth}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={false}
            withOuterLines={false}
            yAxisLabel="₹"
            fromZero
          />
        </Card>

        {/* Key Metrics */}
        <SectionHeader title="Key Metrics" />
        <View style={styles.metricsRow}>
          {[
            { label: 'Avg Weekly', value: `₹${WEEKLY_EARNINGS.averageWeekly.toLocaleString()}`, icon: 'trending-up', bg: COLORS.primaryFaded, color: COLORS.primary },
            { label: 'Total Deliveries', value: WEEKLY_EARNINGS.totalDeliveries, icon: 'bicycle', bg: COLORS.successFaded, color: COLORS.success },
            { label: 'Hours Worked', value: `${WEEKLY_EARNINGS.hoursWorked}h`, icon: 'time', bg: COLORS.warningLight, color: COLORS.warning },
          ].map((m, i) => (
            <Card key={i} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: m.bg }]}>
                <Ionicons name={m.icon} size={20} color={m.color} />
              </View>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </Card>
          ))}
        </View>

        {/* Delivery Trends */}
        <SectionHeader title="Delivery Trends" />
        <Card>
          {[
            { icon: 'time-outline', label: 'Peak Hours', value: DELIVERY_TRENDS.peakHours },
            { icon: 'calendar-outline', label: 'Busiest Day', value: DELIVERY_TRENDS.busiestDay },
            { icon: 'bicycle-outline', label: 'Avg Deliveries/Day', value: DELIVERY_TRENDS.avgDeliveriesPerDay },
            { icon: 'cash-outline', label: 'Avg per Delivery', value: `₹${DELIVERY_TRENDS.avgEarningsPerDelivery}` },
          ].map((t, i) => (
            <View key={i}>
              <View style={styles.trendRow}>
                <View style={styles.trendIcon}>
                  <Ionicons name={t.icon} size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trendLabel}>{t.label}</Text>
                  <Text style={styles.trendValue}>{t.value}</Text>
                </View>
              </View>
              {i < 3 && <Divider />}
            </View>
          ))}
        </Card>

        {/* Risk Exposure */}
        <SectionHeader title="Risk Exposure" />
        <Card>
          {[
            { label: 'Weather Events', count: 4, pct: 60, color: COLORS.info },
            { label: 'Traffic Disruptions', count: 2, pct: 35, color: COLORS.warning },
            { label: 'Air Quality', count: 1, pct: 15, color: COLORS.danger },
          ].map((r, i) => (
            <View key={i} style={styles.riskItem}>
              <View style={styles.riskLabelRow}>
                <Text style={styles.riskLabel}>{r.label}</Text>
                <Text style={styles.riskCount}>{r.count} events</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${r.pct}%`, backgroundColor: r.color }]} />
              </View>
            </View>
          ))}
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
  chart: { borderRadius: RADIUS.md, marginVertical: SPACING.sm },
  metricsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  metricCard: { flex: 1, alignItems: 'center', padding: SPACING.lg },
  metricIcon: { width: 40, height: 40, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  metricValue: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  metricLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  trendIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: COLORS.primaryFaded, justifyContent: 'center', alignItems: 'center' },
  trendLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
  trendValue: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  riskItem: { marginBottom: SPACING.md },
  riskLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  riskLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
  riskCount: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
  progressBg: { height: 8, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: RADIUS.full },
});
