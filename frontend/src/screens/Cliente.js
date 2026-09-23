import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Card, GradientButton, WhatsAppButton, Field, RoleHero, SectionTitle, FadeIn, Sino } from '../ui';
import { C, GRAD, ROLE_GRAD } from '../theme';
import { api } from '../api';
import { notify, getLocation, openURL, todayLabel } from '../utils';

// ---------- MENU ----------
export function MenuCliente({ user, nav, onLogout, backToGod }) {
  const [pend, setPend] = useState(0);
  useEffect(() => { api.chamados().then((c) => setPend(c.filter((x) => x.status !== 'Finalizado').length)).catch(() => {}); }, []);

  const items = [
    { key: 'cliente_chamado', icon: 'construct', title: 'Solicitar Reparo', sub: 'Abrir chamado técnico', grad: ['#00D4FF', '#2563EB'] },
    { key: 'cliente_suprimentos', icon: 'cube', title: 'Pedir Suprimentos', sub: 'Toner, papel, peças', grad: ['#818CF8', '#6366F1'] },
    { key: 'cliente_meus_chamados', icon: 'list', title: 'Meus Chamados', sub: 'Acompanhar status', grad: ['#F59E0B', '#D97706'] },
    { key: 'ponto', icon: 'time', title: 'Ponto Eletrônico', sub: 'Bater ponto com GPS', grad: ['#10B981', '#059669'] },
  ];

  return (
    <Screen>
      <RoleHero
        dateLabel={todayLabel()}
        title={`Olá, ${user.name.split(' ')[0]}`}
        subtitle="Serviços PoliPrint"
        gradient={ROLE_GRAD.cliente}
        right={(
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Sino count={pend} />
            <Pressable onPress={backToGod || onLogout} style={s.exit} data-testid="logout-button">
              <Ionicons name={backToGod ? 'arrow-back' : 'log-out-outline'} size={18} color="#fff" />
            </Pressable>
          </View>
        )}
      />
      <View style={{ padding: 16 }}>
        {items.map((it, i) => (
          <FadeIn key={it.key} delay={i * 70}>
            <Pressable onPress={() => nav(it.key)} data-testid={`menu-${it.key}`}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }} glow={C.roles.cliente.glow}>
                <LinearGradient colors={it.grad} style={s.iconBox}><Ionicons name={it.icon} size={26} color="#fff" /></LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{it.title}</Text>
                  <Text style={s.cardSub}>{it.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={C.textMuted} />
              </Card>
            </Pressable>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}

// ---------- ABRIR CHAMADO ----------
export function AbrirChamado({ user, nav, back }) {
  const [f, setF] = useState({ setor: user.name, endereco: '', impressora: '', numSerie: '', erro: '', whatsapp: user.whatsapp || '' });
  const [gps, setGps] = useState(null);
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const capturarGPS = async () => { const l = await getLocation(); setGps(l); notify('🎯 GPS Sincronizado', `Lat ${l.lat.toFixed(4)}, Lng ${l.lng.toFixed(4)}`); };
  const anexar = () => { setFoto('https://images.pexels.com/photos/12437643/pexels-photo-12437643.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'); notify('📷 Foto anexada'); };

  const enviar = async () => {
    if (!f.setor || !f.endereco || !f.impressora || !f.erro || !f.whatsapp) return notify('Atenção', 'Preencha todos os campos obrigatórios.');
    setLoading(true);
    try {
      const res = await api.createChamado({ ...f, foto, localizacaoGPS: gps });
      notify('✅ Chamado enviado!', 'A equipe PoliPrint foi notificada por WhatsApp.');
      if (res.wa_link) openURL(res.wa_link);
      back();
    } catch (e) { notify('Erro', e.message); } finally { setLoading(false); }
  };

  return (
    <Screen>
      <TopBar title="Novo Chamado" onBack={back} />
      <View style={{ padding: 16 }}>
        <Card>
          <Field label="Nome / Setor" icon="business-outline" value={f.setor} onChangeText={set('setor')} placeholder="Ex: João - RH" testID="ch-setor" />
          <Field label="Endereço completo" icon="location-outline" value={f.endereco} onChangeText={set('endereco')} placeholder="Av. Paulista, 1000" testID="ch-endereco" />
          <Pressable onPress={capturarGPS} data-testid="ch-gps">
            <LinearGradient colors={gps ? GRAD.success : ['#0E1533', '#0E1533']} style={[s.gpsBtn, { borderColor: gps ? 'transparent' : C.borderActive }]}>
              <Ionicons name={gps ? 'checkmark-circle' : 'navigate'} size={18} color={gps ? '#fff' : C.cyan} />
              <Text style={[s.gpsTxt, { color: gps ? '#fff' : C.cyan }]}>{gps ? 'GPS Sincronizado' : 'Obter localização exata (GPS)'}</Text>
            </LinearGradient>
          </Pressable>
          <View style={{ height: 14 }} />
          <Field label="Modelo da impressora" icon="print-outline" value={f.impressora} onChangeText={set('impressora')} placeholder="Ex: HP LaserJet" testID="ch-impressora" />
          <Field label="Nº de série / patrimônio" icon="barcode-outline" value={f.numSerie} onChangeText={set('numSerie')} placeholder="Ex: BR12345678" testID="ch-serie" />
          <Field label="WhatsApp de contato" icon="logo-whatsapp" value={f.whatsapp} onChangeText={set('whatsapp')} keyboardType="phone-pad" placeholder="(92) 99999-9999" testID="ch-whatsapp" />
          <Text style={s.flabel}>Descrição do problema</Text>
          <View style={[s.inputWrap, { alignItems: 'flex-start', minHeight: 90 }]}>
            <TextInput style={[s.rawInput, { height: 80 }]} multiline value={f.erro} onChangeText={set('erro')} placeholder="Explique o defeito..." placeholderTextColor={C.textMuted} data-testid="ch-erro" />
          </View>
          <Pressable onPress={anexar} style={s.upload} data-testid="ch-foto">
            <Ionicons name={foto ? 'checkmark-circle' : 'camera'} size={20} color={C.cyan} />
            <Text style={s.uploadTxt}>{foto ? 'Foto anexada' : 'Anexar foto do defeito'}</Text>
          </Pressable>
          {foto ? <Image source={{ uri: foto }} style={s.preview} /> : null}
        </Card>
        <GradientButton label="ENVIAR CHAMADO" icon="send" onPress={enviar} loading={loading} testID="ch-enviar" />
      </View>
    </Screen>
  );
}

// ---------- MEUS CHAMADOS ----------
export function MeusChamados({ back }) {
  const [list, setList] = useState(null);
  useEffect(() => { api.chamados().then(setList).catch(() => setList([])); }, []);
  return (
    <Screen>
      <TopBar title="Meus Chamados" onBack={back} />
      <View style={{ padding: 16 }}>
        {(list || []).map((c) => (
          <Card key={c.id} testID={`chamado-${c.numero}`}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.cardTitle}>#{c.numero}</Text>
              <StatusPill status={c.status} />
            </View>
            <Text style={s.cardSub}>🖨️ {c.impressora}</Text>
            <Text style={[s.cardSub, { color: '#FCA5A5' }]}>⚠️ {c.erro}</Text>
          </Card>
        ))}
        {list && list.length === 0 ? <Text style={{ color: C.textMuted, textAlign: 'center', marginTop: 20 }}>Nenhum chamado ainda.</Text> : null}
      </View>
    </Screen>
  );
}

function StatusPill({ status }) {
  const color = C.status[status] || C.textMuted;
  return <View style={[s.pill, { backgroundColor: color + '22', borderColor: color + '55' }]}><Text style={{ color, fontWeight: '800', fontSize: 12 }}>{status}</Text></View>;
}

// ---------- PEDIR SUPRIMENTOS ----------
export function PedirSuprimentos({ user, back }) {
  const [catalogo, setCatalogo] = useState([]);
  const [cart, setCart] = useState({});
  const [setor, setSetor] = useState(user.name);
  const [loading, setLoading] = useState(false);
  const [dropdown, setDropdown] = useState(null);

  const load = () => api.catalogo().then(setCatalogo).catch(() => {});
  useEffect(() => { load(); }, []);

  const totalItens = Object.values(cart).reduce((a, i) => a + i.qtd, 0);

  const enviar = async () => {
    if (totalItens === 0) return notify('Atenção', 'Adicione ao menos 1 item.');
    if (!setor) return notify('Atenção', 'Informe seu setor.');
    const itens = [];
    const baixas = [];
    for (const catId in cart) {
      const it = cart[catId];
      if (it.qtd > 0 && it.modId) {
        const cat = catalogo.find((c) => c.id === catId);
        const mod = cat.modelos.find((m) => m.id === it.modId);
        itens.push({ nome: cat.nome, qtd: it.qtd, modelo: mod.nome });
        baixas.push({ catId, modId: it.modId, qtd: it.qtd });
      }
    }
    if (!itens.length) return notify('Atenção', 'Selecione os modelos.');
    setLoading(true);
    try {
      await api.createPedido({ setor, itens });
      await api.baixaEstoque(baixas);
      notify('✅ Pedido enviado!', 'Estoque atualizado e equipe notificada.');
      back();
    } catch (e) { notify('Erro', e.message); } finally { setLoading(false); }
  };

  const disponiveis = catalogo.filter((c) => c.modelos.some((m) => m.estoque > 0));

  return (
    <Screen>
      <TopBar title="Pedir Suprimentos" onBack={back} />
      <View style={{ padding: 16 }}>
        <Card><Field label="Seu setor / empresa" icon="business-outline" value={setor} onChangeText={setSetor} placeholder="Ex: Financeiro" testID="sup-setor" /></Card>
        <SectionTitle>Peças disponíveis</SectionTitle>
        {disponiveis.length === 0 ? <Text style={{ color: C.textMuted, textAlign: 'center' }}>Estoque zerado no momento.</Text> : null}
        {disponiveis.map((cat) => {
          const modelos = cat.modelos.filter((m) => m.estoque > 0);
          const st = cart[cat.id] || { modId: null, qtd: 0 };
          const mod = modelos.find((m) => m.id === st.modId);
          const max = mod ? mod.estoque : 0;
          const setQtd = (q) => setCart({ ...cart, [cat.id]: { ...st, qtd: Math.max(0, Math.min(q, max)) } });
          return (
            <Card key={cat.id} testID={`sup-cat-${cat.id}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 26, marginRight: 12 }}>{cat.icone}</Text>
                <Text style={s.cardTitle}>{cat.nome}</Text>
              </View>
              <Pressable onPress={() => setDropdown({ cat, modelos })} style={s.dd} data-testid={`sup-dd-${cat.id}`}>
                <Text style={{ color: mod ? C.white : C.textMuted, fontWeight: mod ? '700' : '400' }}>{mod ? mod.nome : 'Escolher modelo...'}</Text>
                <Ionicons name="chevron-down" size={18} color={C.textMuted} />
              </Pressable>
              {st.modId ? (
                <View style={s.qtyRow}>
                  <Text style={{ color: C.textSec, fontWeight: '700' }}>Qtd (máx {max}):</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable onPress={() => setQtd(st.qtd - 1)} style={[s.qBtn, { backgroundColor: '#3A1420' }]} data-testid={`sup-minus-${cat.id}`}><Ionicons name="remove" size={18} color="#FCA5A5" /></Pressable>
                    <Text style={s.qNum}>{st.qtd}</Text>
                    <Pressable onPress={() => setQtd(st.qtd + 1)} style={[s.qBtn, { backgroundColor: '#0E2A44' }]} data-testid={`sup-plus-${cat.id}`}><Ionicons name="add" size={18} color={C.cyan} /></Pressable>
                  </View>
                </View>
              ) : null}
            </Card>
          );
        })}
        <GradientButton label={`ENVIAR PEDIDO (${totalItens})`} icon="cart" onPress={enviar} loading={loading} testID="sup-enviar" />
      </View>

      <Modal visible={!!dropdown} transparent animationType="slide" onRequestClose={() => setDropdown(null)}>
        <Pressable style={s.modalBg} onPress={() => setDropdown(null)}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Modelos disponíveis</Text>
            <ScrollView>
              {dropdown?.modelos.map((m) => (
                <Pressable key={m.id} style={s.modalItem} onPress={() => { setCart({ ...cart, [dropdown.cat.id]: { modId: m.id, qtd: 1 } }); setDropdown(null); }} data-testid={`sup-model-${m.id}`}>
                  <View><Text style={{ color: C.white, fontWeight: '700' }}>{m.nome}</Text><Text style={{ color: C.cyan, fontSize: 12, marginTop: 2 }}>{m.estoque} em estoque</Text></View>
                  <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  exit: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardTitle: { color: C.white, fontSize: 17, fontWeight: '800' },
  cardSub: { color: C.textSec, fontSize: 13, marginTop: 3 },
  flabel: { color: C.cyan, fontWeight: '700', fontSize: 12, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  inputWrap: { flexDirection: 'row', backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14 },
  rawInput: { flex: 1, color: C.white, fontSize: 15, paddingVertical: 12, outlineStyle: 'none', textAlignVertical: 'top' },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 14, borderWidth: 1 },
  gpsTxt: { fontWeight: '700', marginLeft: 8 },
  upload: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: C.borderActive, borderStyle: 'dashed', marginTop: 8 },
  uploadTxt: { color: C.cyan, fontWeight: '700', marginLeft: 8 },
  preview: { width: '100%', height: 160, borderRadius: 14, marginTop: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  dd: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginTop: 12 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  qBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  qNum: { color: C.white, fontSize: 18, fontWeight: '900', marginHorizontal: 16, minWidth: 22, textAlign: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,5,20,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, maxHeight: '60%', borderWidth: 1, borderColor: C.borderActive },
  modalTitle: { color: C.white, fontSize: 18, fontWeight: '900', marginBottom: 14 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
});
