import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
export const API = `${BASE}/api`;

const client = axios.create({ baseURL: API });

let TOKEN = null;

export async function loadToken() {
  if (TOKEN) return TOKEN;
  TOKEN = await AsyncStorage.getItem('pp_token');
  return TOKEN;
}

export async function setToken(t) {
  TOKEN = t;
  if (t) await AsyncStorage.setItem('pp_token', t);
  else await AsyncStorage.removeItem('pp_token');
}

client.interceptors.request.use(async (config) => {
  const t = await loadToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

function err(e) {
  const d = e?.response?.data?.detail;
  if (typeof d === 'string') return new Error(d);
  if (Array.isArray(d)) return new Error(d.map((x) => x.msg).join(' '));
  return new Error(e?.message || 'Erro de conexão');
}

export const api = {
  register: (b) => client.post('/auth/register', b).then((r) => r.data).catch((e) => { throw err(e); }),
  login: (b) => client.post('/auth/login', b).then((r) => r.data).catch((e) => { throw err(e); }),
  me: () => client.get('/auth/me').then((r) => r.data.user),

  chamados: () => client.get('/chamados').then((r) => r.data),
  createChamado: (b) => client.post('/chamados', b).then((r) => r.data),
  updateChamado: (id, b) => client.patch(`/chamados/${id}`, b).then((r) => r.data),

  pedidos: () => client.get('/pedidos').then((r) => r.data),
  createPedido: (b) => client.post('/pedidos', b).then((r) => r.data),
  updatePedido: (id, b) => client.patch(`/pedidos/${id}`, b).then((r) => r.data),

  catalogo: () => client.get('/catalogo').then((r) => r.data),
  addCategoria: (b) => client.post('/catalogo', b).then((r) => r.data),
  delCategoria: (id) => client.delete(`/catalogo/${id}`).then((r) => r.data),
  addModelo: (cat, b) => client.post(`/catalogo/${cat}/modelos`, b).then((r) => r.data),
  delModelo: (cat, mod) => client.delete(`/catalogo/${cat}/modelos/${mod}`).then((r) => r.data),
  estoqueDelta: (cat, mod, delta) => client.patch(`/catalogo/${cat}/modelos/${mod}`, { delta }).then((r) => r.data),
  baixaEstoque: (items) => client.post('/catalogo/baixa', { items }).then((r) => r.data),

  pontos: (mine) => client.get(`/pontos${mine ? '?mine=true' : ''}`).then((r) => r.data),
  createPonto: (b) => client.post('/pontos', b).then((r) => r.data),

  waLink: (phone, message) => client.post('/whatsapp/link', { phone, message }).then((r) => r.data.link),
  waSend: (phone, message) => client.post('/whatsapp/send', { phone, message }).then((r) => r.data),
  waStatus: () => client.get('/whatsapp/status').then((r) => r.data),

  stats: () => client.get('/stats').then((r) => r.data),
};
