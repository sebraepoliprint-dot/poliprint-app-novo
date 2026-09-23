import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, GradientButton, Field } from '../ui';
import { C, ROLE_GRAD } from '../theme';
import { api, setToken } from '../api';
import { notify } from '../utils';

const ROLES = [
  { id: 'cliente', label: 'Cliente', icon: 'person' },
  { id: 'tecnico', label: 'Técnico', icon: 'construct' },
  { id: 'estoque', label: 'Estoque', icon: 'cube' },
];

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [role, setRole] = useState('cliente');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !senha) return notify('Atenção', 'Preencha e-mail e senha.');
    if (mode === 'register' && !name) return notify('Atenção', 'Informe seu nome.');
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await api.login({ email, password: senha })
        : await api.register({ name, email, password: senha, role, whatsapp });
      await setToken(data.token);
      onAuth(data.user);
    } catch (e) {
      notify('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={{ justifyContent: 'center', padding: 22 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.logoArea}>
          <LinearGradient colors={['#00D4FF', '#12BAFF', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.logoBadge}>
            <Ionicons name="print" size={34} color="#001" />
          </LinearGradient>
          <Text style={s.logo}>PoliPrint</Text>
          <View style={s.line}>
            <View style={s.dash} /><Text style={s.subtitle}>Impressoras & Copiadoras</Text><View style={s.dash} />
          </View>
        </View>

        <Card style={{ padding: 24 }}>
          <Text style={s.title}>{mode === 'login' ? 'Bem-vindo de volta!' : 'Criar conta'}</Text>
          <Text style={s.desc}>{mode === 'login' ? 'Acesse seu painel PoliPrint' : 'Cadastre-se para começar'}</Text>

          {mode === 'register' && (
            <>
              <View style={s.roleRow}>
                {ROLES.map((r) => {
                  const active = role === r.id;
                  return (
                    <Pressable key={r.id} onPress={() => setRole(r.id)} style={{ flex: 1 }} data-testid={`role-${r.id}`}>
                      <LinearGradient
                        colors={active ? ROLE_GRAD[r.id] : ['#0E1533', '#0E1533']}
                        style={[s.roleChip, { borderColor: active ? 'transparent' : C.border }]}
                      >
                        <Ionicons name={r.icon} size={18} color={active ? '#fff' : C.textSec} />
                        <Text style={[s.roleTxt, { color: active ? '#fff' : C.textSec }]}>{r.label}</Text>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>
              <Field label="Nome completo" icon="person-outline" placeholder="Ex: João Silva" value={name} onChangeText={setName} testID="input-name" />
            </>
          )}

          <Field label="E-mail" icon="mail-outline" placeholder="voce@empresa.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} testID="input-email" />

          <View style={{ marginBottom: 14 }}>
            <Text style={s.flabel}>Senha</Text>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={{ marginRight: 8 }} />
              <TextInput style={s.rawInput} placeholderTextColor={C.textMuted} value={senha} onChangeText={setSenha} placeholder="••••••" secureTextEntry={!showPass} data-testid="input-password" />
              <Pressable onPress={() => setShowPass(!showPass)} data-testid="toggle-password">
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={20} color={C.textMuted} />
              </Pressable>
            </View>
          </View>

          {mode === 'register' && (
            <Field label="WhatsApp (com DDD)" icon="logo-whatsapp" placeholder="Ex: 92 99999-9999" keyboardType="phone-pad" value={whatsapp} onChangeText={setWhatsapp} testID="input-whatsapp" />
          )}

          <GradientButton
            label={mode === 'login' ? 'Entrar' : 'Cadastrar'}
            icon={mode === 'login' ? 'arrow-forward' : 'checkmark'}
            onPress={submit}
            loading={loading}
            style={{ marginTop: 6 }}
            testID="submit-auth"
          />

          <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ marginTop: 18 }} data-testid="toggle-mode">
            <Text style={s.switch}>
              {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
              <Text style={{ color: C.cyan, fontWeight: '800' }}>{mode === 'login' ? 'Cadastre-se' : 'Entrar'}</Text>
            </Text>
          </Pressable>
        </Card>

        <Text style={s.hint}>Diretoria: god@poliprint.com / poliprint777</Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  logoArea: { alignItems: 'center', marginBottom: 26 },
  logoBadge: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logo: { fontSize: 46, fontWeight: '900', fontStyle: 'italic', color: C.cyanBright, letterSpacing: -1 },
  line: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dash: { height: 2, width: 30, backgroundColor: C.cyan, marginHorizontal: 8 },
  subtitle: { color: C.cyan, fontSize: 13, fontWeight: '700' },
  title: { color: C.white, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  desc: { color: C.textSec, fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleChip: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  roleTxt: { fontSize: 12, fontWeight: '800', marginTop: 5 },
  flabel: { color: C.cyan, fontWeight: '700', fontSize: 12, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, minHeight: 52 },
  rawInput: { flex: 1, color: C.white, fontSize: 15, paddingVertical: 14, outlineStyle: 'none' },
  switch: { color: C.textSec, textAlign: 'center', fontSize: 14 },
  hint: { color: C.textMuted, textAlign: 'center', marginTop: 18, fontSize: 12 },
});
