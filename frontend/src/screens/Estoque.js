import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Card, GradientButton, OutlineButton, RoleHero, SectionTitle, Metric, Badge, Sino, Empty, FadeIn } from '../ui';
import { C, GRAD, ROLE_GRAD } from '../theme';
import { api } from '../api';
import { notify, confirmAction } from '../utils';

export function MenuEstoque({ user, nav, onLogout, backToGod, openPedido }) {
  const [pedidos, setPedidos] = useState([]);
  useEffect(() => { api.pedidos().then(setPedidos).catch(() => {}); }, []);
  const pend = pedidos.filter((p) => p.status !== 'Entregue');
  const entregues = pedidos.filter((p) => p.status === 'Entregue').length;

  return (
    <Screen>
      <RoleHero
        dateLabel={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
        title="Logística & Estoque" subtitle={user.name} gradient={ROLE_GRAD.estoque}
        right={<View style={{ flexDirection: 'row', alignItems: 'center' }}><Sino count={pend.length} /><Pressable onPress={backToGod || onLogout} style={s.exit} data-testid="logout-button"><Ionicons name={backToGod ? 'arrow-back' : 'log-out-outline'} size={18} color="#fff" /></Pressable></View>}
      />
      <View style={{ padding: 16 }}>
        <Card style={{ flexDirection: 'row', paddingVertical: 18 }} glow={C.roles.estoque.glow}>
          <Metric icon="cube" value={pend.length} label="Pendentes" color="#F59E0B" testID="metric-pend" />
          <View style={s.divider} />
          <Metric icon="checkmark-done-circle" value={entregues} label="Entregues" color="#10B981" testID="metric-entregues" />
        </Card>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
          <View style={{ flex: 1 }}><GradientButton label="Ver Pedidos" icon="list" colors={['#818CF8', '#6366F1']} onPress={() => nav('estoque_pedidos')} testID="btn-pedidos" /></View>
          <View style={{ flex: 1 }}><OutlineButton label="Bater Ponto" icon="time" color="#818CF8" onPress={() => nav('ponto')} testID="btn-ponto" /></View>
        </View>
        <Pressable onPress={() => nav('estoque_catalogo')} data-testid="btn-catalogo">
          <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <Ionicons name="pricetags" size={24} color="#818CF8" />
            <Text style={{ color: '#A5B4FC', fontWeight: '800', marginLeft: 12, flex: 1 }}>Gerenciar Catálogo & Estoque</Text>
            <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
          </Card>
        </Pressable>

        <SectionTitle style={{ marginTop: 12 }}>Fila de Separação (FIFO)</SectionTitle>
        {pend.length === 0 ? <Empty text="Nenhum pedido aguardando." /> : pend.map((p, i) => (
          <FadeIn key={p.id} delay={i * 60}>
            <View style={{ flexDirection: 'row' }}>
              <View style={s.tl}><View style={[s.tlDot, { backgroundColor: i === 0 ? '#EF4444' : '#F59E0B' }]} />{i !== pend.length - 1 ? <View style={s.tlLine} /> : null}</View>
              <Pressable style={{ flex: 1 }} onPress={() => openPedido(p)} data-testid={`fila-pedido-${p.numero}`}>
                <Card style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={s.tag}><Text style={s.tagTxt}>#{i + 1}</Text></View><Text style={s.title}>{p.setor}</Text></View>
                    <Text style={s.muted}>ID {p.numero}</Text>
                  </View>
                  {p.itens.map((it, k) => <Text key={k} style={s.muted}>• {it.qtd}x {it.nome} ({it.modelo})</Text>)}
                  <View style={s.cardFoot}><Text style={{ color: '#A5B4FC', fontWeight: '700', fontSize: 12 }}>Toque para gerenciar</Text><Ionicons name="arrow-forward" size={14} color="#A5B4FC" style={{ marginLeft: 5 }} /></View>
                </Card>
              </Pressable>
            </View>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}

export function ListaPedidos({ back, openPedido }) {
  const [list, setList] = useState([]);
  useEffect(() => { api.pedidos().then(setList).catch(() => {}); }, []);
  return (
    <Screen>
      <TopBar title="Pedidos" onBack={back} />
      <View style={{ padding: 16 }}>
        {list.length === 0 ? <Empty text="Nenhum pedido." /> : list.map((p) => (
          <Pressable key={p.id} onPress={() => openPedido(p)} data-testid={`lista-pedido-${p.numero}`}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={s.title}>Pedido #{p.numero}</Text><Badge status={p.status} /></View>
              <Text style={s.muted}>📍 {p.setor}</Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

export function DetalhePedido({ pedido, back, openComprovante, onChanged }) {
  const [p, setP] = useState(pedido);
  const entregar = async () => { const upd = await api.updatePedido(p.id, { status: 'Entregue' }); setP(upd); onChanged && onChanged(); notify('✅ Pedido entregue'); back(); };
  return (
    <Screen>
      <TopBar title={`Pedido #${p.numero}`} onBack={back} />
      <View style={{ padding: 16 }}>
        <Card>
          <Text style={{ color: C.white, fontWeight: '900', fontSize: 16 }}>📍 Destino: {p.setor}</Text>
          <View style={{ height: 1, backgroundColor: C.border, marginVertical: 12 }} />
          {p.itens.map((it, k) => (
            <View key={k} style={s.reciboLine}><Text style={{ color: C.white, fontWeight: '700' }}>• {it.qtd}x {it.nome}</Text><Text style={{ color: C.cyan, fontSize: 13, marginTop: 2 }}>Modelo: {it.modelo}</Text></View>
          ))}
        </Card>
        <GradientButton label="🖨️ Imprimir Recibo (A4)" colors={['#818CF8', '#6366F1']} onPress={() => openComprovante(p)} testID="btn-comprovante" />
        {p.status !== 'Entregue' ? <GradientButton label="✔️ ENTREGAR PEDIDO" colors={GRAD.success} onPress={entregar} testID="btn-entregar" /> : null}
      </View>
    </Screen>
  );
}

export function Comprovante({ pedido, back }) {
  return (
    <Screen>
      <TopBar title="Comprovante Oficial" onBack={back} />
      <View style={{ padding: 16 }}>
        <View style={s.a4}>
          <Text style={{ fontSize: 24, fontWeight: '900', fontStyle: 'italic', color: '#0072ff' }}>PoliPrint</Text>
          <Text style={{ color: '#333', fontWeight: '800', marginTop: 10 }}>Recibo Oficial #{pedido.numero}</Text>
          <Text style={{ color: '#555', marginTop: 4 }}>Setor: {pedido.setor}</Text>
          <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 12 }} />
          {pedido.itens.map((it, k) => <Text key={k} style={{ color: '#333', marginBottom: 6 }}>{it.qtd}x {it.nome} (Mod: {it.modelo})</Text>)}
          <View style={{ marginTop: 50, borderTopWidth: 1, borderTopColor: '#999', alignSelf: 'center', width: '80%', alignItems: 'center', paddingTop: 6 }}><Text style={{ color: '#555' }}>Assinatura do Recebedor</Text></View>
        </View>
      </View>
    </Screen>
  );
}

export function GerenciarCatalogo({ back }) {
  const [cat, setCat] = useState([]);
  const [modal, setModal] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoIcone, setNovoIcone] = useState('📦');
  const [addMod, setAddMod] = useState(null);
  const [modText, setModText] = useState('');

  const load = () => api.catalogo().then(setCat).catch(() => {});
  useEffect(() => { load(); }, []);

  const criarCat = async () => { if (!novoNome) return notify('Atenção', 'Digite o nome.'); await api.addCategoria({ nome: novoNome, icone: novoIcone || '📦' }); setNovoNome(''); setNovoIcone('📦'); setModal(false); load(); };
  const rmCat = (c) => confirmAction('Apagar categoria?', `Excluir "${c.nome}"?`, async () => { await api.delCategoria(c.id); load(); });
  const salvarMod = async (catId) => { if (!modText) { setAddMod(null); return; } await api.addModelo(catId, { nome: modText, estoque: 0 }); setModText(''); setAddMod(null); load(); };
  const rmMod = async (catId, modId) => { await api.delModelo(catId, modId); load(); };
  const delta = async (catId, modId, d) => { await api.estoqueDelta(catId, modId, d); load(); };

  return (
    <Screen>
      <TopBar title="Catálogo & Estoque" onBack={back} right={<Pressable onPress={() => setModal(true)} data-testid="btn-add-cat"><Ionicons name="add-circle" size={30} color={C.cyan} /></Pressable>} />
      <View style={{ padding: 16 }}>
        {cat.length === 0 ? <Empty text="Catálogo vazio." /> : cat.map((c) => (
          <Card key={c.id} testID={`cat-${c.id}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 12, marginBottom: 12 }}>
              <View style={s.iconMini}><Text style={{ fontSize: 20 }}>{c.icone}</Text></View>
              <Text style={{ color: C.white, fontWeight: '800', fontSize: 17, flex: 1 }}>{c.nome}</Text>
              <Pressable onPress={() => rmCat(c)} style={s.trash} data-testid={`del-cat-${c.id}`}><Ionicons name="trash-outline" size={18} color="#FCA5A5" /></Pressable>
            </View>
            {c.modelos.length === 0 ? <Text style={{ color: C.textMuted, fontStyle: 'italic', marginBottom: 10 }}>Nenhum modelo.</Text> : c.modelos.map((m) => (
              <View key={m.id} style={s.modRow}>
                <Text style={{ color: C.white, fontWeight: '700', flex: 1 }}>{m.nome}</Text>
                <View style={s.chip}>
                  <Pressable onPress={() => delta(c.id, m.id, -1)} style={s.chipBtn} data-testid={`stock-minus-${m.id}`}><Ionicons name="remove" size={15} color={C.cyan} /></Pressable>
                  <Text style={{ color: C.cyan, fontWeight: '900', marginHorizontal: 10 }}>{m.estoque}</Text>
                  <Pressable onPress={() => delta(c.id, m.id, 1)} style={s.chipBtn} data-testid={`stock-plus-${m.id}`}><Ionicons name="add" size={15} color={C.cyan} /></Pressable>
                </View>
                <Pressable onPress={() => rmMod(c.id, m.id)} style={{ marginLeft: 8 }} data-testid={`del-mod-${m.id}`}><Ionicons name="close" size={16} color="#FCA5A5" /></Pressable>
              </View>
            ))}
            {addMod === c.id ? (
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                <TextInput style={s.inlineInput} placeholder="Nome da peça..." placeholderTextColor={C.textMuted} autoFocus value={modText} onChangeText={setModText} onSubmitEditing={() => salvarMod(c.id)} data-testid={`input-mod-${c.id}`} />
                <Pressable style={s.inlineSave} onPress={() => salvarMod(c.id)} data-testid={`save-mod-${c.id}`}><Ionicons name="checkmark" size={20} color="#fff" /></Pressable>
              </View>
            ) : (
              <Pressable style={s.addModBtn} onPress={() => { setAddMod(c.id); setModText(''); }} data-testid={`add-mod-${c.id}`}>
                <Ionicons name="add" size={16} color={C.cyan} /><Text style={{ color: C.cyan, fontWeight: '700', marginLeft: 6 }}>Adicionar modelo</Text>
              </Pressable>
            )}
          </Card>
        ))}
      </View>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <Pressable style={s.modalBg} onPress={() => setModal(false)}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Nova Categoria</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 70 }}><Text style={s.lbl}>Ícone</Text><TextInput style={s.modalInput} value={novoIcone} onChangeText={setNovoIcone} data-testid="cat-icone" /></View>
              <View style={{ flex: 1 }}><Text style={s.lbl}>Nome</Text><TextInput style={s.modalInput} placeholder="Ex: Toner" placeholderTextColor={C.textMuted} value={novoNome} onChangeText={setNovoNome} data-testid="cat-nome" /></View>
            </View>
            <GradientButton label="CRIAR CATEGORIA" onPress={criarCat} style={{ marginTop: 18 }} testID="cat-criar" />
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  exit: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  divider: { width: 1, backgroundColor: C.border },
  title: { color: C.white, fontWeight: '900', fontSize: 15 },
  muted: { color: C.textSec, fontSize: 12, marginTop: 3 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  tag: { backgroundColor: 'rgba(129,140,248,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 },
  tagTxt: { color: '#A5B4FC', fontWeight: '900', fontSize: 12 },
  tl: { width: 24, alignItems: 'center', marginRight: 8 },
  tlDot: { width: 12, height: 12, borderRadius: 6, marginTop: 22, zIndex: 2 },
  tlLine: { width: 2, backgroundColor: C.border, flex: 1, position: 'absolute', top: 30, bottom: 0 },
  reciboLine: { backgroundColor: C.bg2, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  a4: { backgroundColor: '#fff', borderRadius: 8, padding: 24, minHeight: 400 },
  iconMini: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bg2, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  trash: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3A1420', alignItems: 'center', justifyContent: 'center' },
  modRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg2, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(18,186,255,0.12)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4 },
  chipBtn: { padding: 4, backgroundColor: C.card, borderRadius: 6 },
  addModBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: C.borderActive, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 12, marginTop: 6 },
  inlineInput: { flex: 1, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.borderActive, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, paddingHorizontal: 14, color: C.white, outlineStyle: 'none' },
  inlineSave: { backgroundColor: C.blue, width: 52, borderTopRightRadius: 12, borderBottomRightRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,5,20,0.75)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, borderWidth: 1, borderColor: C.borderActive },
  modalTitle: { color: C.white, fontSize: 20, fontWeight: '900', marginBottom: 18, textAlign: 'center' },
  lbl: { color: C.textMuted, fontSize: 11, fontWeight: '800', marginBottom: 6 },
  modalInput: { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, color: C.white, fontSize: 16, outlineStyle: 'none' },
});
