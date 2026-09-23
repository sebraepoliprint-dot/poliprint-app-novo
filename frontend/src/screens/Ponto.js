import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, TopBar, Card, GradientButton, SectionTitle } from '../ui';
import { C, GRAD } from '../theme';
import { api } from '../api';
import { notify, getLocation } from '../utils';

const ETAPAS = ['Entrada', 'Saída Almoço', 'Volta Almoço', 'Fim Expediente'];

export function Ponto({ user, back }) {
  const [hist, setHist] = useState([]);
  const [emSaida, setEmSaida] = useState(false);
  const hoje = new Date().toLocaleDateString('pt-BR');

  const load = () => api.pontos(true).then((all) => setHist(all.filter((p) => p.data === hoje))).catch(() => {});
  useEffect(() => { load(); }, []);

  const idx = hist.filter((i) => i.tipo !== 'Saída Informada' && i.tipo !== 'Volta (Saída Informada)').length;
  const etapa = ETAPAS[idx] || 'Jornada Concluída';

  const registrar = async (tipo, cb) => {
    const l = await getLocation();
    await api.createPonto({
      tipo, horario: new Date().toLocaleTimeString('pt-BR'), data: hoje,
      coords: `${l.lat.toFixed(4)}, ${l.lng.toFixed(4)}`,
      foto: 'https://images.pexels.com/photos/32588544/pexels-photo-32588544.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=200&w=200',
    });
    notify(`✅ ${tipo} registrada`, 'Ponto salvo com GPS.');
    if (cb) cb();
    load();
  };

  return (
    <Screen>
      <TopBar title="Ponto Eletrônico" onBack={back} />
      <View style={{ padding: 16 }}>
        <Card glow={C.roles.cliente.glow}>
          <Text style={{ color: C.cyan, fontSize: 16, fontWeight: '800' }}>📅 {hoje}</Text>
          <Text style={{ color: C.textSec, marginTop: 4 }}>{idx < 4 ? `Próxima marcação: ${etapa}` : 'Jornada concluída! 🎉'}</Text>
        </Card>
        {idx < 4 ? <GradientButton label={`Registrar ${etapa}`} icon="finger-print" colors={GRAD.success} onPress={() => registrar(etapa)} testID="ponto-registrar" /> : null}
        <GradientButton
          label={emSaida ? '🔄 Registrar Volta' : '⚠️ Registrar Saída Informada'}
          colors={emSaida ? ['#06B6D4', '#0891B2'] : ['#F59E0B', '#D97706']}
          onPress={() => registrar(emSaida ? 'Volta (Saída Informada)' : 'Saída Informada', () => setEmSaida(!emSaida))}
          testID="ponto-saida"
        />
        <SectionTitle style={{ marginTop: 16 }}>Registros de hoje</SectionTitle>
        {hist.length === 0 ? <Text style={{ color: C.textMuted, textAlign: 'center' }}>Nenhum registro ainda.</Text> : hist.map((it) => (
          <Card key={it.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }} testID={`ponto-${it.id}`}>
            <View style={{ flex: 1 }}><Text style={{ color: C.white, fontWeight: '800' }}>{it.tipo}</Text><Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>📍 {it.coords}</Text></View>
            <Text style={{ color: C.cyanBright, fontWeight: '900', fontSize: 16 }}>{it.horario}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
