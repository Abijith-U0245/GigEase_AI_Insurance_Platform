import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../theme/colors';
import { Card, Badge } from '../components/UIComponents';
import { NOTIFICATIONS } from '../data/mockData';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const typeIcon = { weather: 'rainy', claim: 'checkmark-circle', policy: 'shield' };
  const typeColor = { weather: COLORS.info, claim: COLORS.success, policy: COLORS.primary };
  const typeBg = { weather: COLORS.infoLight, claim: COLORS.successFaded, policy: COLORS.primaryFaded };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>{unreadCount} unread</Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {notifications.map((notif) => (
          <Card key={notif.id} style={[styles.notifCard, !notif.read && styles.unreadCard]}>
            <View style={styles.notifRow}>
              <View style={[styles.notifIconBg, { backgroundColor: typeBg[notif.type] }]}>
                <Ionicons name={typeIcon[notif.type]} size={20} color={typeColor[notif.type]} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.notifTitleRow}>
                  <Text style={[styles.notifTitle, !notif.read && { fontWeight: '800' }]}>{notif.title}</Text>
                  {!notif.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifBody}>{notif.body}</Text>
                <Text style={styles.notifTime}>{notif.time}</Text>
              </View>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -1 },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  markReadBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryFaded },
  markReadText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.primary },
  notifCard: { marginBottom: SPACING.sm },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: COLORS.primary, backgroundColor: COLORS.primaryUltraLight },
  notifRow: { flexDirection: 'row', gap: SPACING.md },
  notifIconBg: { width: 40, height: 40, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  notifTitle: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  notifBody: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20, marginTop: SPACING.xs },
  notifTime: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: SPACING.sm },
});
