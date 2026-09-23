import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { GRAD, C } from './src/theme';
import { api, loadToken, setToken } from './src/api';

import Auth from './src/screens/Auth';
import { MenuCliente, AbrirChamado, MeusChamados, PedirSuprimentos } from './src/screens/Cliente';
import { MenuTecnico, ListaChamados, AtenderChamado } from './src/screens/Tecnico';
import { MenuEstoque, ListaPedidos, DetalhePedido, Comprovante, GerenciarCatalogo } from './src/screens/Estoque';
import { MenuGod, RelatorioGeral, RelatorioPonto, DetalhePonto } from './src/screens/God';
import { Ponto } from './src/screens/Ponto';

function Splash() {
  return (
    <LinearGradient colors={GRAD.screen} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 42, fontWeight: '900', fontStyle: 'italic', color: C.cyanBright }}>PoliPrint</Text>
      <ActivityIndicator color={C.cyan} style={{ marginTop: 20 }} />
    </LinearGradient>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [stack, setStack] = useState([]);

  useEffect(() => {
    (async () => {
      await loadToken();
      try {
        const u = await api.me();
        setUser(u);
        setStack([{ s: `${u.role}_menu` }]);
      } catch (e) {
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const cur = stack[stack.length - 1] || { s: 'auth' };
  const nav = (s, p = {}) => setStack((st) => [...st, { s, p }]);
  const back = () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
  const resetTo = (s, p = {}) => setStack([{ s, p }]);

  const onAuth = (u) => { setUser(u); resetTo(`${u.role}_menu`); };
  const onLogout = async () => { await setToken(null); setUser(null); setStack([]); };
  const backToGodRoot = () => setStack((st) => { const i = st.map((x) => x.s).lastIndexOf('god_menu'); return i >= 0 ? st.slice(0, i + 1) : [{ s: 'god_menu' }]; });

  if (booting) return <Splash />;
  if (!user) return (<><StatusBar style="light" /><Auth onAuth={onAuth} /></>);

  const p = cur.p || {};
  const asGod = user.role === 'god';
  const bk = (menuAsGod) => (asGod && menuAsGod ? backToGodRoot : onLogout);

  const render = () => {
    switch (cur.s) {
      // CLIENTE
      case 'cliente_menu':
        return <MenuCliente user={user} nav={nav} onLogout={onLogout} backToGod={p.asGod ? backToGodRoot : null} />;
      case 'cliente_chamado':
        return <AbrirChamado user={user} nav={nav} back={back} />;
      case 'cliente_meus_chamados':
        return <MeusChamados back={back} />;
      case 'cliente_suprimentos':
        return <PedirSuprimentos user={user} back={back} />;

      // PONTO (shared)
      case 'ponto':
        return <Ponto user={user} back={back} />;

      // TECNICO
      case 'tecnico_menu':
        return <MenuTecnico user={user} nav={nav} onLogout={onLogout} backToGod={p.asGod ? backToGodRoot : null} openChamado={(c) => nav('tecnico_atender', { chamado: c })} />;
      case 'tecnico_lista':
        return <ListaChamados back={back} filtro="Todos" openChamado={(c) => nav('tecnico_atender', { chamado: c })} />;
      case 'tecnico_atender':
        return <AtenderChamado user={user} chamado={p.chamado} back={back} isGod={asGod} />;

      // ESTOQUE
      case 'estoque_menu':
        return <MenuEstoque user={user} nav={nav} onLogout={onLogout} backToGod={p.asGod ? backToGodRoot : null} openPedido={(pd) => nav('estoque_detalhe', { pedido: pd })} />;
      case 'estoque_pedidos':
        return <ListaPedidos back={back} openPedido={(pd) => nav('estoque_detalhe', { pedido: pd })} />;
      case 'estoque_detalhe':
        return <DetalhePedido pedido={p.pedido} back={back} openComprovante={(pd) => nav('estoque_comprovante', { pedido: pd })} />;
      case 'estoque_comprovante':
        return <Comprovante pedido={p.pedido} back={back} />;
      case 'estoque_catalogo':
        return <GerenciarCatalogo back={back} />;

      // GOD
      case 'god_menu':
        return <MenuGod user={user} nav={nav} onLogout={onLogout} goPanel={(role) => nav(`${role}_menu`, { asGod: true })} />;
      case 'god_relatorio':
        return <RelatorioGeral back={back} nav={nav} />;
      case 'god_ponto':
        return <RelatorioPonto back={back} openTecnico={(t) => nav('god_detalhe_ponto', { tecnico: t })} />;
      case 'god_detalhe_ponto':
        return <DetalhePonto tecnico={p.tecnico} back={back} />;
      case 'god_lista_chamados':
        return <ListaChamados back={back} filtro="Todos" openChamado={(c) => nav('tecnico_atender', { chamado: c })} />;
      case 'god_lista_pedidos':
        return <ListaPedidos back={back} openPedido={(pd) => nav('estoque_detalhe', { pedido: pd })} />;

      default:
        return <MenuCliente user={user} nav={nav} onLogout={onLogout} />;
    }
  };

  return (<View style={{ flex: 1, backgroundColor: C.bg }}><StatusBar style="light" />{render()}</View>);
}
