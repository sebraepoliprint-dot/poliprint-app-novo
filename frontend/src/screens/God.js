import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Card, RoleHero, SectionTitle, Sino, Empty, FadeIn } from '../ui';
import { C, GRAD, ROLE_GRAD } from '../theme';
import { api } from '../api';
import { openURL } from '../utils';

export function MenuGod({ user, nav, onLogout, goPanel }) {
  const [stats, setStats] = useState(null);
  const [wa, setWa] = useState(null);
  useEffect(() => { api.stats().then(setStats).catch(() => {}); api.waStatus().then(setWa).catch(() => {}); }, []);
  const pend = stats ? stats.chamados_pendentes + stats.chamados_andamento + stats.pedidos_pendentes : 0;

  return (
    <Screen>
      <RoleHero
        dateLabel="ACESSO TOTAL" title={user.name} subtitle="Painel de Controle PoliPrint" gradient={ROLE_GRAD.god}
        right={<View style={{ flexDirection: 'row', alignItems: 'center' }}><Sino count={pend} /><Pressable onPress={onLogout} style={s.exit} data-testid="logout-button"><Ionicons name="log-out-outline" size={18} color="#fff" /></Pressable></View>}
      />
      <View style={{ padding: 16 }}>
        {/* WhatsApp automation status */}
        <Card style={{ flexDirection: 'row', alignItems: 'center' }} glow={'rgba(34,197,94,0.15)'} testID="wa-status-card">
          <LinearGradient colors={GRAD.whatsapp} style={s.iconBox}><Ionicons name="logo-whatsapp" size={24} color="#fff" /></LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Automação WhatsApp</Text>
            <Text style={{ color: wa?.twilio_configured ? '#34D399' : '#FBBF24', fontSize: 12, marginTop: 3, fontWeight: '700' }}>
              {wa == null ? 'Verificando...' : wa.twilio_configured ? '● Envio automático ATIVO (Twilio)' : '● Modo link inteligente (configure Twilio p/ automático)'}
            </Text>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
          <StatCard icon="stats-chart" label="Relatório Geral" onPress={() => nav('god_relatorio')} testID="god-relatorio" />
          <StatCard icon="time" label="Banco de Ponto" onPress={() => nav('god_ponto')} testID="god-ponto-rel" />
        </View>

        {stats ? (
          <Card style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 8 }}>
            <MiniStat value={stats.chamados_total} label="Chamados" />
            <MiniStat value={stats.chamados_finalizados} label="Concluídos" color="#34D399" />
            <MiniStat value={stats.pedidos_total} label="Pedidos" color="#A5B4FC" />
            <MiniStat value={stats.pedidos_pendentes} label="A entregar" color="#FBBF24" />
          </Card>
        ) : null}

        <SectionTitle style={{ marginTop: 12 }}>Acessar painéis</SectionTitle>
        {[
          { r: 'tecnico', icon: 'construct', label: 'Painel Técnico', grad: ROLE_GRAD.tecnico },
          { r: 'estoque', icon: 'cube', label: 'Painel de Estoque', grad: ROLE_GRAD.estoque },
          { r: 'cliente', icon: 'person', label: 'Painel de Cliente', grad: ROLE_GRAD.cliente },
        ].map((p, i) => (
          <FadeIn key={p.r} delay={i * 60}>
            <Pressable onPress={() => goPanel(p.r)} data-testid={`god-panel-${p.r}`}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <LinearGradient colors={p.grad} style={s.iconBox}><Ionicons name={p.icon} size={24} color="#fff" /></LinearGradient>
                <Text style={{ color: C.white, fontWeight: '800', fontSize: 16, flex: 1 }}>{p.label}</Text>
                <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
              </Card>
            </Pressable>
          </FadeIn>
        ))}
        <Pressable onPress={() => nav('ponto')} data-testid="god-ponto-btn">
          <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <Ionicons name="finger-print" size={22} color="#F472B6" /><Text style={{ color: '#F9A8D4', fontWeight: '800', marginLeft: 12 }}>Bater meu ponto</Text>
          </Card>
        </Pressable>
      </View>
    </Screen>
  );
}

function StatCard({ icon, label, onPress, testID }) {
  return (
    <Pressable style={{ flex: 1 }} onPress={onPress} data-testid={testID}>
      <LinearGradient colors={['#1A1030', '#241145']} style={s.statCard}>
        <Ionicons name={icon} size={26} color="#F472B6" />
        <Text style={{ color: '#F9A8D4', fontWeight: '800', marginTop: 8, textAlign: 'center', fontSize: 13 }}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function MiniStat({ value, label, color = C.white }) {
  return <View style={{ width: '50%', paddingVertical: 12, alignItems: 'center' }}><Text style={{ color, fontSize: 26, fontWeight: '900' }}>{value}</Text><Text style={{ color: C.textSec, fontSize: 12, fontWeight: '700' }}>{label}</Text></View>;
}

export function RelatorioGeral({ back, nav }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.stats().then(setStats).catch(() => {}); }, []);
  return (
    <Screen>
      <TopBar title="Relatório Geral" onBack={back} />
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => nav('god_lista_chamados')} data-testid="rel-chamados">
          <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}><Text style={{ color: C.cyanBright, fontWeight: '900', fontSize: 18 }}>🔧 Chamados</Text><Text style={{ color: C.textSec, marginTop: 4 }}>{stats ? `${stats.chamados_total} registrados • ${stats.chamados_finalizados} concluídos` : '...'}</Text></View>
            <Ionicons name="arrow-forward-circle" size={28} color="#F472B6" />
          </Card>
        </Pressable>
        <Pressable onPress={() => nav('god_lista_pedidos')} data-testid="rel-pedidos">
          <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}><Text style={{ color: '#A5B4FC', fontWeight: '900', fontSize: 18 }}>📦 Pedidos</Text><Text style={{ color: C.textSec, marginTop: 4 }}>{stats ? `${stats.pedidos_total} registrados • ${stats.pedidos_entregues} entregues` : '...'}</Text></View>
            <Ionicons name="arrow-forward-circle" size={28} color="#F472B6" />
          </Card>
        </Pressable>
      </View>
    </Screen>
  );
}

export function RelatorioPonto({ back, openTecnico }) {
  const [pontos, setPontos] = useState([]);
  useEffect(() => { api.pontos(false).then(setPontos).catch(() => {}); }, []);
  const tecnicos = [...new Set(pontos.map((p) => p.tecnico))];
  return (
    <Screen>
      <TopBar title="Banco de Ponto" onBack={back} />
      <View style={{ padding: 16 }}>
        {tecnicos.length === 0 ? <Empty icon="time-outline" text="Nenhum registro de ponto." /> : tecnicos.map((t) => {
          const qtd = pontos.filter((p) => p.tecnico === t).length;
          return (
            <Pressable key={t} onPress={() => openTecnico(t)} data-testid={`ponto-tec-${t}`}>
              <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={s.avatar}><Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>{t.charAt(0)}</Text></View>
                <View style={{ flex: 1 }}><Text style={{ color: C.white, fontWeight: '800', fontSize: 16 }}>👨‍🔧 {t}</Text><Text style={{ color: C.cyan, fontSize: 13, marginTop: 3 }}>📋 {qtd} marcações</Text></View>
                <Ionicons name="arrow-forward-circle" size={28} color="#F472B6" />
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

export function DetalhePonto({ tecnico, back }) {
  const [pontos, setPontos] = useState([]);
  useEffect(() => { api.pontos(false).then((all) => setPontos(all.filter((p) => p.tecnico === tecnico))).catch(() => {}); }, []);
  return (
    <Screen>
      <TopBar title={tecnico} onBack={back} />
      <View style={{ padding: 16 }}>
        {pontos.map((it) => (
          <Card key={it.id} style={{ flexDirection: 'row', alignItems: 'center' }} testID={`ponto-det-${it.id}`}>
            <Image source={{ uri: it.foto }} style={{ width: 64, height: 64, borderRadius: 12, marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.cyan, fontWeight: '800' }}>📌 {it.tipo}</Text>
              <Text style={{ color: C.textSec, fontSize: 12, marginTop: 3 }}>📅 {it.data} às {it.horario}</Text>
              <Pressable onPress={() => openURL(`https://www.google.com/maps/search/?api=1&query=${(it.coords || '').replace(' ', '')}`)} style={s.mapBtn} data-testid={`ponto-map-${it.id}`}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>📍 Abrir no Mapa</Text></Pressable>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  exit: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardTitle: { color: C.white, fontSize: 16, fontWeight: '800' },
  statCard: { borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(236,72,153,0.3)', marginBottom: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  mapBtn: { backgroundColor: '#059669', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
});
