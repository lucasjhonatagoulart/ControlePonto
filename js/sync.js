// Sincronização com o Supabase via REST (sem dependências).
// Regras: tudo é salvo primeiro no aparelho; o envio é idempotente (upsert pelo id),
// então reenviar nunca duplica. O que estiver pendente no aparelho prevalece sobre a nuvem.
import * as db from './db.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const listeners = new Set();
export const estado = {
  configurado: false,
  logado: false,
  email: '',
  online: navigator.onLine,
  sincronizando: false,
  ultimaSync: null,
  erro: '',
  pendentes: 0
};
const emitir = () => listeners.forEach((fn) => fn(estado));
export const aoMudar = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

let auth = null;
let conn = { url: '', key: '' };
let offsetMs = 0;
let emAndamento = null;

export const agoraServidor = () => new Date(Date.now() + offsetMs);
export const offsetAtual = () => offsetMs;

export async function iniciar() {
  const salvo = await db.getKV('supabase', null);
  conn = {
    url: (salvo && salvo.url) || SUPABASE_URL,
    key: (salvo && salvo.key) || SUPABASE_ANON_KEY
  };
  auth = await db.getKV('auth', null);
  offsetMs = await db.getKV('offset_ms', 0);
  estado.ultimaSync = await db.getKV('ultima_sync', null);
  estado.configurado = !!(conn.url && conn.key);
  estado.logado = !!auth;
  estado.email = auth ? auth.user.email : '';
  await contarPendentes();
  window.addEventListener('online', () => { estado.online = true; emitir(); sincronizar(); });
  window.addEventListener('offline', () => { estado.online = false; estado.sincronizando = false; emitir(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizar(); });
  setInterval(() => sincronizar(), 60000);
  emitir();
}

export const conexao = () => ({ ...conn });

export async function salvarConexao(url, key) {
  conn = { url: url.trim().replace(/\/+$/, ''), key: key.trim() };
  await db.setKV('supabase', conn);
  estado.configurado = !!(conn.url && conn.key);
  emitir();
}

export async function contarPendentes() {
  const r = await db.byIndex('registros', 'sync', 'pendente');
  const f = await db.byIndex('feriados', 'sync', 'pendente');
  const c = await db.getKV('config_pendente', false);
  estado.pendentes = r.length + f.length + (c ? 1 : 0);
  emitir();
  return estado.pendentes;
}

async function http(path, { method = 'GET', body, token = true, prefer, tentativa = 0 } = {}) {
  const headers = { apikey: conn.key, 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + (await tokenValido(tentativa > 0));
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(conn.url + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  // Token recusado: renova a sessão uma vez e tenta de novo, sem pedir login.
  if (res.status === 401 && token && tentativa === 0) return http(path, { method, body, token, prefer, tentativa: 1 });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = { message: text }; }
  if (!res.ok) {
    const msg = (data && (data.msg || data.message || data.error_description || data.error)) || res.statusText;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function guardarAuth(data) {
  auth = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
    user: { id: data.user.id, email: data.user.email }
  };
  await db.setKV('auth', auth);
  estado.logado = true;
  estado.email = auth.user.email;
  emitir();
}

let renovando = null;
async function tokenValido(forcar = false) {
  if (!auth) { const e = new Error('Entre na sua conta para sincronizar.'); e.sessaoInvalida = true; throw e; }
  if (forcar || Date.now() > auth.expires_at - 60000) {
    if (!renovando) {
      renovando = (async () => {
        try {
          const data = await http('/auth/v1/token?grant_type=refresh_token', { method: 'POST', token: false, body: { refresh_token: auth.refresh_token } });
          await guardarAuth(data);
        } catch (e) {
          // Só desconecta se o servidor recusar a sessão; falta de internet não derruba o login.
          if (e.status === 400 || e.status === 401 || e.status === 403) e.sessaoInvalida = true;
          throw e;
        } finally { renovando = null; }
      })();
    }
    await renovando;
  }
  return auth.access_token;
}

export async function entrar(email, senha) {
  const data = await http('/auth/v1/token?grant_type=password', { method: 'POST', token: false, body: { email, password: senha } });
  await guardarAuth(data);
  await db.setKV('ultimo_pull', null);
  return sincronizar();
}

export async function criarConta(email, senha) {
  const volta = encodeURIComponent(location.origin + location.pathname);
  const data = await http('/auth/v1/signup?redirect_to=' + volta, { method: 'POST', token: false, body: { email, password: senha } });
  if (data && data.access_token) { await guardarAuth(data); return { confirmar: false }; }
  return { confirmar: true };
}

/** Ao voltar do link de confirmação do e-mail, o Supabase devolve a sessão no endereço (#access_token=…). */
export async function sessaoDoLink() {
  const h = location.hash.replace(/^#/, '');
  if (!/(^|&)(access_token|error)=/.test(h)) return null;
  const p = new URLSearchParams(h);
  history.replaceState(null, '', location.pathname + location.search + '#/cadastro?s=nuvem');
  if (p.get('error')) return { ok: false, msg: p.get('error_description') || 'O link de confirmação expirou. Peça um novo criando a conta de novo ou entre com sua senha.' };
  if (!conn.url || !conn.key) return null;
  try {
    const user = await fetch(conn.url + '/auth/v1/user', { headers: { apikey: conn.key, Authorization: 'Bearer ' + p.get('access_token') } }).then((r) => r.json());
    await guardarAuth({ access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_in: Number(p.get('expires_in')) || 3600, user });
    await db.setKV('ultimo_pull', null);
    return { ok: true, msg: 'E-mail confirmado. Você está conectado.' };
  } catch (e) {
    return { ok: false, msg: 'E-mail confirmado. Toque em Entrar para conectar.' };
  }
}

export async function sair() {
  auth = null;
  await db.setKV('auth', null);
  estado.logado = false;
  estado.email = '';
  emitir();
}

/** Diferença entre o relógio do servidor e o do aparelho (corrige celular com hora errada). */
async function medirOffset() {
  const t0 = Date.now();
  const iso = await http('/rest/v1/rpc/agora', { method: 'POST', body: {} });
  const t1 = Date.now();
  offsetMs = Math.round(new Date(iso).getTime() - (t0 + t1) / 2);
  await db.setKV('offset_ms', offsetMs);
}

const colsRegistro = (r, uid) => ({
  id: r.id, user_id: uid, data: r.data, tipo: r.tipo, ts: r.ts, ts_dispositivo: r.ts_dispositivo,
  offset_ms: r.offset_ms, offline: r.offline, manual: r.manual, removido: !!r.removido,
  criado_em: r.criado_em, atualizado_em: r.atualizado_em
});
const colsFeriado = (f, uid) => ({
  id: f.id, user_id: uid, data: f.data, nome: f.nome, tipo: f.tipo,
  recorrente: !!f.recorrente, removido: !!f.removido, atualizado_em: f.atualizado_em
});

async function enviar(tabela, colsFn) {
  const pend = await db.byIndex(tabela, 'sync', 'pendente');
  if (!pend.length) return;
  const uid = auth.user.id;
  await http(`/rest/v1/${tabela}?on_conflict=user_id,id`, {
    method: 'POST', body: pend.map((x) => colsFn(x, uid)), prefer: 'resolution=merge-duplicates,return=minimal'
  });
  // Só marca como enviado o que não mudou durante o envio.
  for (const p of pend) {
    const atual = await db.get(tabela, p.id);
    if (atual && atual.atualizado_em === p.atualizado_em) await db.put(tabela, { ...atual, sync: 'ok' });
  }
}

async function receber(tabela, desde) {
  const filtro = desde ? `&sincronizado_em=gt.${encodeURIComponent(desde)}` : '';
  const rows = await http(`/rest/v1/${tabela}?select=*${filtro}&order=sincronizado_em.asc`);
  let max = desde;
  for (const row of rows) {
    if (!max || row.sincronizado_em > max) max = row.sincronizado_em;
    const local = await db.get(tabela, row.id);
    if (local && local.sync === 'pendente') continue;
    const { user_id, sincronizado_em, recebido_em, ...resto } = row;
    await db.put(tabela, { ...resto, sync: 'ok' });
  }
  return { max, mudou: rows.length > 0 };
}

async function sincConfig(getConfig, setConfigRemota) {
  const uid = auth.user.id;
  if (await db.getKV('config_pendente', false)) {
    const cfg = await getConfig();
    await http('/rest/v1/config?on_conflict=user_id', {
      method: 'POST', body: [{ user_id: uid, dados: cfg, atualizado_em: cfg.atualizado_em }], prefer: 'resolution=merge-duplicates,return=minimal'
    });
    const depois = await getConfig();
    if (depois.atualizado_em === cfg.atualizado_em) await db.setKV('config_pendente', false);
    return false;
  }
  const rows = await http('/rest/v1/config?select=dados,atualizado_em');
  const local = await getConfig();
  if (rows[0] && rows[0].atualizado_em > local.atualizado_em) { await setConfigRemota(rows[0].dados); return true; }
  return false;
}

let hooks = { getConfig: null, setConfigRemota: null, aoReceber: null };
export const ligar = (h) => { hooks = { ...hooks, ...h }; };

export function sincronizar() {
  if (emAndamento) return emAndamento;
  if (!estado.configurado || !estado.logado || !navigator.onLine) { contarPendentes(); return Promise.resolve(false); }
  estado.sincronizando = true;
  estado.erro = '';
  emitir();
  emAndamento = (async () => {
    try {
      await medirOffset();
      await enviar('registros', colsRegistro);
      await enviar('feriados', colsFeriado);
      const cfgMudou = await sincConfig(hooks.getConfig, hooks.setConfigRemota);
      const ultimo = await db.getKV('ultimo_pull', null);
      const a = await receber('registros', ultimo && ultimo.registros);
      const b = await receber('feriados', ultimo && ultimo.feriados);
      await db.setKV('ultimo_pull', { registros: a.max, feriados: b.max });
      estado.ultimaSync = new Date().toISOString();
      await db.setKV('ultima_sync', estado.ultimaSync);
      if ((a.mudou || b.mudou || cfgMudou) && hooks.aoReceber) await hooks.aoReceber();
      return true;
    } catch (e) {
      estado.erro = e.sessaoInvalida
        ? 'Sessão expirada. Entre novamente em Cadastro › Nuvem.'
        : e instanceof TypeError ? 'Sem acesso à internet agora. Os registros continuam salvos no aparelho.'
        : navigator.onLine ? 'Falha ao sincronizar: ' + e.message : '';
      if (e.sessaoInvalida) await sair();
      return false;
    } finally {
      estado.sincronizando = false;
      emAndamento = null;
      await contarPendentes();
    }
  })();
  return emAndamento;
}
