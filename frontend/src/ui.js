import React, { useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, SafeAreaView,
  ScrollView, Platform, Animated, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, GRAD } from './theme';

export const Screen = ({ children, scroll = true, contentStyle }) => {
  const inner = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[{ paddingBottom: 48, flexGrow: 1 }, contentStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
  );
  return (
    <LinearGradient colors={GRAD.screen} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>{inner}</SafeAreaView>
    </LinearGradient>
  );
};

export const TopBar = ({ title, onBack, right }) => (
  <View style={s.topbar}>
    {onBack ? (
      <Pressable onPress={onBack} style={s.backBtn} data-testid="back-button">
        <Ionicons name="chevron-back" size={22} color={C.cyan} />
        <Text style={s.backTxt}>Voltar</Text>
      </Pressable>
    ) : <View style={{ width: 80 }} />}
    <Text style={s.topTitle} numberOfLines={1}>{title}</Text>
    <View style={{ width: 80, alignItems: 'flex-end' }}>{right}</View>
  </View>
);

export const Card = ({ children, style, glow, onPress, testID }) => {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp onPress={onPress} style={[s.card, style]} data-testid={testID}>
      {glow ? <View style={[s.glow, { backgroundColor: glow }]} /> : null}
      {children}
    </Comp>
  );
};

export const GradientButton = ({ label, onPress, colors = GRAD.action, icon, style, disabled, loading, testID }) => (
  <Pressable
    onPress={disabled || loading ? null : onPress}
    style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }], opacity: disabled ? 0.5 : 1 }, style]}
    data-testid={testID}
  >
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
      {loading ? <ActivityIndicator color="#fff" /> : (
        <>
          {icon ? <Ionicons name={icon} size={20} color="#fff" style={{ marginRight: 8 }} /> : null}
          <Text style={s.btnTxt}>{label}</Text>
        </>
      )}
    </LinearGradient>
  </Pressable>
);

export const OutlineButton = ({ label, onPress, icon, color = C.cyan, testID, style }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [s.outline, { borderColor: color, opacity: pressed ? 0.7 : 1 }, style]} data-testid={testID}>
    {icon ? <Ionicons name={icon} size={18} color={color} style={{ marginRight: 8 }} /> : null}
    <Text style={[s.outlineTxt, { color }]}>{label}</Text>
  </Pressable>
);

export const WhatsAppButton = ({ label = 'WhatsApp', onPress, testID, small }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]} data-testid={testID}>
    <LinearGradient colors={GRAD.whatsapp} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.waBtn, small && { paddingVertical: 8, paddingHorizontal: 14 }]}>
      <Ionicons name="logo-whatsapp" size={small ? 16 : 20} color="#fff" style={{ marginRight: 6 }} />
      <Text style={[s.btnTxt, small && { fontSize: 13 }]}>{label}</Text>
    </LinearGradient>
  </Pressable>
);

export const Field = ({ label, icon, testID, ...props }) => (
  <View style={{ marginBottom: 14 }}>
    {label ? <Text style={s.label}>{label}</Text> : null}
    <View style={s.inputWrap}>
      {icon ? <Ionicons name={icon} size={18} color={C.textMuted} style={{ marginRight: 8 }} /> : null}
      <TextInput
        style={s.input}
        placeholderTextColor={C.textMuted}
        data-testid={testID}
        {...props}
      />
    </View>
  </View>
);

export const Metric = ({ icon, value, label, color = C.cyan, testID }) => (
  <View style={s.metric} data-testid={testID}>
    <Ionicons name={icon} size={22} color={color} />
    <Text style={s.metricValue}>{value}</Text>
    <Text style={s.metricLabel}>{label}</Text>
  </View>
);

export const Badge = ({ status, testID }) => {
  const color = C.status[status] || C.textMuted;
  return (
    <View style={[s.badge, { backgroundColor: color + '22', borderColor: color + '55' }]} data-testid={testID}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={[s.badgeTxt, { color }]}>{status}</Text>
    </View>
  );
};

export const Sino = ({ count }) => {
  if (!count) return null;
  return (
    <View style={s.sino}>
      <Ionicons name="notifications" size={22} color={C.cyanBright} />
      <View style={s.sinoBadge}><Text style={s.sinoTxt}>{count}</Text></View>
    </View>
  );
};

export const Empty = ({ icon = 'file-tray-outline', text }) => (
  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
    <Ionicons name={icon} size={54} color={C.textMuted} />
    <Text style={{ color: C.textMuted, marginTop: 12, fontSize: 15 }}>{text}</Text>
  </View>
);

export const SectionTitle = ({ children, style }) => (
  <Text style={[s.section, style]}>{children}</Text>
);

export const RoleHero = ({ dateLabel, title, subtitle, gradient, right }) => (
  <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
    <View style={{ flex: 1 }}>
      <Text style={s.heroDate}>{dateLabel}</Text>
      <Text style={s.heroTitle}>{title}</Text>
      {subtitle ? <Text style={s.heroSub}>{subtitle}</Text> : null}
    </View>
    {right}
  </LinearGradient>
);

export const FadeIn = ({ children, delay = 0, style }) => {
  const a = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 420, delay, useNativeDriver: Platform.OS !== 'web' }).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
};

const s = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 80 },
  backTxt: { color: C.cyan, fontWeight: '700', fontSize: 15 },
  topTitle: { flex: 1, textAlign: 'center', color: C.white, fontWeight: '800', fontSize: 17 },
  card: { backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 14, overflow: 'hidden' },
  glow: { position: 'absolute', right: -30, bottom: -30, width: 120, height: 120, borderRadius: 60 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  outline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, backgroundColor: 'rgba(255,255,255,0.03)' },
  outlineTxt: { fontWeight: '700', fontSize: 15 },
  waBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14 },
  label: { color: C.cyan, fontWeight: '700', fontSize: 12, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, minHeight: 52 },
  input: { flex: 1, color: C.white, fontSize: 15, paddingVertical: 14, outlineStyle: 'none' },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { color: C.white, fontWeight: '900', fontSize: 24, marginTop: 4 },
  metricLabel: { color: C.textSec, fontSize: 11, fontWeight: '700', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  badgeTxt: { fontSize: 12, fontWeight: '800' },
  sino: { position: 'relative', marginRight: 12 },
  sinoBadge: { position: 'absolute', top: -6, right: -8, backgroundColor: C.danger, borderRadius: 10, minWidth: 18, height: 18, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  sinoTxt: { color: '#fff', fontSize: 10, fontWeight: '900' },
  section: { color: C.white, fontWeight: '900', fontSize: 18, marginBottom: 14, marginTop: 6 },
  hero: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 4, borderRadius: 24, padding: 22 },
  heroDate: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2, fontWeight: '600' },
});

export { s as uiStyles };
