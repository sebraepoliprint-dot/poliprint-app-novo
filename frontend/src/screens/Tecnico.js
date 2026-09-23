import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Card, GradientButton, OutlineButton, WhatsAppButton, RoleHero, SectionTitle, Metric, Badge, Sino, Empty, FadeIn } from '../ui';
import { C, GRAD, ROLE_GRAD } from '../theme';
import { api } from '../api';
import { notify, openURL, todayLabel, mapsLink } from '../utils';

export function MenuTecnico({ user, nav, onLogout, backToGod, openChamado }) {
  const [chamados, setChamados] = useState([]);
  const load = () => api.chamados().then(setChamados).catch(() => {});
  useEffect(() => { load(); }, []);

  const pend = chamados.filter((c) => c.status === 'Pendente');
  const and = chamados.filter((c) => c.status === 'Em Andamento');
  const fin = chamados.filter((c) => c.status === 'Finalizado').length;
  const ativos = [...and, ...pend];

  return (
    <Screen>
      <RoleHero
        dateLabel={todayLabel()} title="Painel Técnico" subtitle={user.name}
        gradient={ROLE_GRAD.tecnico}
        right={<View style={{ flexDirection: 'row', alignItems: 'center' }}><Sino count={pend.length} /><Pressable onPress={backToGod || onLogout} style={s.exit} data-testid="logout-button"><Ionicons name={backToGod ? 'arrow-back' : 'log-out-outline'} size={18} color="#fff" /></Pressable></View>}
      />
      <View style={{ padding: 16 }}>
        <Card style={{ flexDirection: 'row', paddingVertical: 18 }} glow={C.roles.tecnico.glow}>
          <Metric icon="alert-circle" value={pend.length} label="Pendentes" color="#EF4444" testID="metric-pendentes" />
          <View style={s.divider} />
          <Metric icon="construct" value={and.length} label="Em Andamento" color="#F59E0B" testID="metric-andamento" />
          <View style={s.divider} />
          <Metric icon="checkmark-done-circle" value={fin} label="Finalizados" color="#10B981" testID="metric-finalizados" />
        </Card>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
          <View style={{ flex: 1 }}><GradientButton label="Ver Todos" icon="list" onPress={() => nav('tecnico_lista')} testID="btn-ver-todos" /></View>
          <View style={{ flex: 1 }}><OutlineButton label="Bater Ponto" icon="time" onPress={() => nav('ponto')} testID="btn-ponto" /></View>
        </View>

        <SectionTitle style={{ marginTop: 12 }}>Fila de Atendimentos</SectionTitle>
        {ativos.length === 0 ? <Empty icon="checkmark-done-outline" text="Nenhum chamado aberto." /> : ativos.map((c, i) => {
          const isAnd = c.status === 'Em Andamento';
          const col = isAnd ? C.cyan : (i === 0 && !isAnd ? '#EF4444' : '#F59E0B');
          return (
            <FadeIn key={c.id} delay={i * 60}>
              <View style={{ flexDirection: 'row' }}>
                <View style={s.tl}><View style={[s.tlDot, { backgroundColor: col }]} />{i !== ativos.length - 1 ? <View style={s.tlLine} /> : null}</View>
                <Pressable style={{ flex: 1 }} onPress={() => openChamado(c)} data-testid={`fila-chamado-${c.numero}`}>
                  <Card style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[s.tag, { backgroundColor: col + '22' }]}><Text style={[s.tagTxt, { color: col }]}>{isAnd ? '⚙️ Em And.' : `#${i + 1}`}</Text></View>
                        <Text style={s.title}>{c.setor}</Text>
                      </View>
                      <Text style={s.muted}>ID {c.numero}</Text>
                    </View>
                    <Text style={s.defeito} numberOfLines={2}>⚠️ {c.erro}</Text>
                    <Text style={s.muted}>🖨️ {c.impressora}</Text>
                    <View style={s.cardFoot}><Text style={{ color: C.cyan, fontWeight: '700', fontSize: 12 }}>Toque para detalhes</Text><Ionicons name="arrow-forward" size={14} color={C.cyan} style={{ marginLeft: 5 }} /></View>
                  </Card>
                </Pressable>
              </View>
            </FadeIn>
          );
        })}
      </View>
    </Screen>
  );
}

export function ListaChamados({ back, openChamado, filtro }) {
  const [list, setList] = useState([]);
  useEffect(() => { api.chamados().then(setList).catch(() => {}); }, []);
  const shown = (!filtro || filtro === 'Todos') ? list : list.filter((c) => c.status === filtro);
  return (
    <Screen>
      <TopBar title="Histórico de Chamados" onBack={back} />
      <View style={{ padding: 16 }}>
        {shown.length === 0 ? <Empty text="Nenhum chamado encontrado." /> : shown.map((c) => (
          <Pressable key={c.id} onPress={() => openChamado(c)} data-testid={`lista-chamado-${c.numero}`}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.title}>#{c.numero}</Text><Badge status={c.status} />
              </View>
              <Text style={s.muted}>📍 {c.setor}  •  🖨️ {c.impressora}</Text>
              {c.status === 'Finalizado' && c.tecnicoFinalizador ? <Text style={{ color: '#34D399', fontSize: 12, marginTop: 6, fontWeight: '700' }}>✅ Finalizado por {c.tecnicoFinalizador}</Text> : null}
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

export function AtenderChamado({ user, chamado, back, isGod, onChanged }) {
  const [c, setC] = useState(chamado);
  const isMine = c.tecnicoAtribuido === user.name;
  const isAnd = c.status === 'Em Andamento';
  const podeFinalizar = isAnd && (isMine || isGod);
  const bloqueado = c.tecnicoAtribuido && !isMine && !isGod;

  const waCliente = () => {
    if (!c.whatsapp) return notify('Aviso', 'WhatsApp não informado.');
    openURL(`https://wa.me/55${c.whatsapp}?text=${encodeURIComponent(`Olá! Sou técnico da PoliPrint sobre o chamado #${c.numero}.`)}`);
  };

  const assumir = async () => {
    const upd = await api.updateChamado(c.id, { status: 'Em Andamento', tecnicoAtribuido: user.name });
    setC(upd); onChanged && onChanged(); notify('✅ Chamado assumido', 'Cliente notificado por WhatsApp.'); back();
  };
  const finalizar = async () => {
    const upd = await api.updateChamado(c.id, { status: 'Finalizado', tecnicoFinalizador: user.name, dataFinalizacao: new Date().toLocaleString('pt-BR') });
    setC(upd); onChanged && onChanged(); notify('✔️ Chamado finalizado', 'Cliente notificado por WhatsApp.'); back();
  };

  return (
    <Screen>
      <TopBar title={`Chamado #${c.numero}`} onBack={back} />
      <View style={{ padding: 16 }}>
        {c.status === 'Finalizado' ? (
          <View style={[s.banner, { backgroundColor: '#052E1B', borderColor: '#10B981' }]}>
            <Text style={{ color: '#34D399', fontWeight: '800' }}>✅ Chamado Finalizado</Text>
            <Text style={{ color: '#A7F3D0', marginTop: 4 }}>👨‍🔧 {c.tecnicoFinalizador} • {c.dataFinalizacao}</Text>
          </View>
        ) : null}
        {bloqueado ? <View style={[s.banner, { backgroundColor: '#3A1420', borderColor: '#EF4444' }]}><Text style={{ color: '#FCA5A5', fontWeight: '900' }}>🔒 Em atendimento por {c.tecnicoAtribuido}</Text></View> : null}

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <LinearGradient colors={GRAD.hero} style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="clipboard" size={20} color={C.cyanBright} style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>Detalhes do Relato</Text>
          </LinearGradient>
          <View style={{ padding: 18 }}>
            <Detail label="Setor / Cliente" value={c.setor} />
            <Detail label="Endereço" value={c.endereco} />
            <Detail label="Equipamento" value={`${c.impressora} (S/N: ${c.numSerie || 'N/A'})`} />
            <Text style={s.dLabel}>Contato WhatsApp</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={[s.dValue, { flex: 1 }]}>{c.whatsapp || 'Não informado'}</Text>
              {c.whatsapp ? <WhatsAppButton label="Chamar" small onPress={waCliente} testID="wa-cliente" /> : null}
            </View>
            <Text style={s.dLabel}>Relato do Defeito</Text>
            <View style={s.defeitoBox}><Text style={{ color: '#FCA5A5', fontWeight: '700' }}>{c.erro}</Text></View>
            {c.foto ? <Image source={{ uri: c.foto }} style={{ width: '100%', height: 180, borderRadius: 14, marginTop: 14 }} /> : null}
            <GradientButton label="Navegar até o cliente (GPS)" icon="navigate" colors={['#10B981', '#059669']} onPress={() => openURL(mapsLink(c.localizacaoGPS, c.endereco))} style={{ marginTop: 16 }} testID="btn-maps" />
          </View>
        </Card>

        {!c.tecnicoAtribuido && c.status === 'Pendente' ? <GradientButton label="🙋 ASSUMIR CHAMADO" onPress={assumir} testID="btn-assumir" /> : null}
        {podeFinalizar ? <GradientButton label="✔️ FINALIZAR CHAMADO" colors={GRAD.success} onPress={finalizar} testID="btn-finalizar" /> : null}
      </View>
    </Screen>
  );
}

function Detail({ label, value }) {
  return (<><Text style={s.dLabel}>{label}</Text><Text style={s.dValue}>{value}</Text></>);
}

const s = StyleSheet.create({
  exit: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  divider: { width: 1, backgroundColor: C.border, marginVertical: 4 },
  title: { color: C.white, fontWeight: '900', fontSize: 15 },
  muted: { color: C.textSec, fontSize: 12, marginTop: 4 },
  defeito: { color: C.textSec, fontSize: 13, marginTop: 4 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 },
  tagTxt: { fontWeight: '900', fontSize: 12 },
  tl: { width: 24, alignItems: 'center', marginRight: 8 },
  tlDot: { width: 12, height: 12, borderRadius: 6, marginTop: 22, zIndex: 2 },
  tlLine: { width: 2, backgroundColor: C.border, flex: 1, position: 'absolute', top: 30, bottom: 0 },
  banner: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  dLabel: { color: C.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 14, letterSpacing: 0.5 },
  dValue: { color: C.white, fontSize: 15, fontWeight: '600', marginTop: 3 },
  defeitoBox: { backgroundColor: '#3A1420', padding: 12, borderRadius: 10, marginTop: 6 },
});
