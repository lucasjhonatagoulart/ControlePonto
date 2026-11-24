// Plataforma de Ponto — telas e regras da interface.
import * as db from './db.js';
import * as C from './calc.js';
import { mapaFeriados, TIPOS_FERIADO, corDe, nacionais } from './holidays.js';
import * as sync from './sync.js';

const S = {
  cfg: null,
  registros: [],
  feriados: [],
  rota: '',
  q: {},
  calSel: null,
  aviso: null,
  confirmarRemocao: null,
  adminAte: 0,
  pedirSenha: false,
  adminMsg: null,
  editando: null,
  confirmarLimpeza: false,
  form: {},
  nuvemMsg: null,
  ocupado: false,
  registrando: false,
  swEspera: null,
  editarConexao: false
};
const $view = document.getElementById('view');

/* ---------- utilidades ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15);
  return (c === 'x' ? r : (r & 3) | 8).toString(16);
}));
const agora = () => sync.agoraServidor();
const hojeStr = () => C.ymd(agora());

const ICON = {
  relogio: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  off: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M8.5 16.5A5.5 5.5 0 0 1 6 6.3M17.5 18H7a4.5 4.5 0 0 1-1-8.9M12 5a6 6 0 0 1 5.7 4.2A4 4 0 0 1 21 13a4 4 0 0 1-1.1 2.7"/></svg>',
  sync: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 1-15.5 6.2M3 12a9 9 0 0 1 15.5-6.2"/><path d="M18 2v4h-4M6 22v-4h4"/></svg>',
  ok: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19H7a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 11 4 4 0 0 1 17.5 19z"/><path d="M9.5 14l2 2 3.5-3.5"/></svg>',
  alerta: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/></svg>',
  aparelho: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>',
  esq: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  dir: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  mais: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  fechar: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  sol: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  cadeado: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  cadeadoAberto: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>',
  espelho: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  raio: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  baixo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  lua: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>'
};

function toast(msg) {
  const el = document.getElementById('toast');
  el.innerHTML = `<div>${esc(msg)}</div>`;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.innerHTML = ''; }, 3200);
}

/* ---------- tema ---------- */
const temaSalvo = () => { try { return localStorage.getItem('tema') || 'auto'; } catch (e) { return 'auto'; } };
const mq = window.matchMedia('(prefers-color-scheme: dark)');
function aplicarTema() {
  const t = temaSalvo();
  const dark = t === 'dark' || (t === 'auto' && mq.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]').setAttribute('content', dark ? '#2B2F36' : '#F4F5F7');
}
function definirTema(t) { try { localStorage.setItem('tema', t); } catch (e) {} aplicarTema(); render(); }
mq.addEventListener ? mq.addEventListener('change', aplicarTema) : mq.addListener(aplicarTema);

/* ---------- dados ---------- */
async function carregar() {
  const salvo = await db.getKV('config', null);
  S.cfg = { ...C.CONFIG_PADRAO, ...(salvo || {}) };
  S.registros = await db.getAll('registros');
  S.feriados = await db.getAll('feriados');
}

async function salvarConfig(patch) {
  S.cfg = { ...S.cfg, ...patch, atualizado_em: agora().toISOString() };
  await db.setKV('config', S.cfg);
  await db.setKV('config_pendente', true);
  await sync.contarPendentes();
  sync.sincronizar();
}

const marcasDoDia = (data) => S.registros.filter((r) => r.data === data && !r.removido).sort((a, b) => a.ts.localeCompare(b.ts));
function feriadosMapa(anos) { return mapaFeriados(anos, S.feriados); }

function diaInfo(date, mapa, agoraMs) {
  const data = C.ymd(date);
  const marcas = marcasDoDia(data);
  const fer = mapa[data] || [];
  const ehHoje = data === hojeStr();
  const t = C.trabalhado(marcas, agoraMs, ehHoje);
  const oc = ocorrencia(data);
  const esp = oc === 'atestado' ? 0 : C.esperado(S.cfg, date, fer);
  const hoje = hojeStr();
  const ini = inicioContagem();
  const encerrada = marcas.length >= 4 && !t.aberto;
  // Conta no saldo: dias desde o início da contagem até ontem; hoje só depois da saída final.
  const conta = !!ini && data >= ini && (data < hoje || (ehHoje && encerrada));
  const falta = conta && esp > 0 && !marcas.length && !oc;
  const incompleto = !ehHoje && marcas.length % 2 === 1;
  return { data, date, marcas, fer, ehHoje, trab: t.min, aberto: t.aberto, esp, oc, conta, falta, incompleto, futuro: data > hoje };
}

/** Banco de horas do mês (mesmo cálculo da tela Mês). */
function bancoDoMes(ref) { return resumoMes(mesStrDe(ref)); }

/* ---------- registrar ponto ---------- */
async function registrar() {
  if (S.registrando) return;
  S.registrando = true;
  try {
    const now = agora();
    const data = C.ymd(now);
    const n = marcasDoDia(data).length;
    const r = {
      id: uuid(), data, tipo: C.tipoPorOrdem(n),
      ts: now.toISOString(), ts_dispositivo: new Date().toISOString(), offset_ms: sync.offsetAtual(),
      offline: !navigator.onLine, manual: false, removido: false,
      criado_em: now.toISOString(), atualizado_em: now.toISOString(), sync: 'pendente'
    };
    await db.put('registros', r);
    S.registros.push(r);
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if (navigator.vibrate) navigator.vibrate(30);
    const nome = C.tipoPorOrdem(n).toLowerCase();
    const hora = C.horaDe(r.ts);
    const nuvemAtiva = sync.estado.configurado && sync.estado.logado;
    S.aviso = !nuvemAtiva
      ? { txt: `Registro de ${nome} às ${hora} salvo neste aparelho.`, off: false }
      : navigator.onLine
        ? { txt: `Registro de ${nome} às ${hora} — enviando…`, off: false }
        : { txt: `Registro de ${nome} às ${hora} salvo no aparelho — será enviado ao reconectar.`, off: true };
    await sync.contarPendentes();
    render();
    const ok = await sync.sincronizar();
    if (ok && S.aviso && S.aviso.txt.endsWith('enviando…')) { S.aviso = { txt: `Registro de ${nome} às ${hora} — enviado e salvo.`, off: false }; render(); }
  } finally {
    setTimeout(() => { S.registrando = false; }, 1200);
  }
}

async function incluirManual(data, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = C.parseYmd(data); d.setHours(h, m, 0, 0);
  const now = agora();
  const r = {
    id: uuid(), data, tipo: 'Ajuste manual', ts: d.toISOString(), ts_dispositivo: new Date().toISOString(),
    offset_ms: sync.offsetAtual(), offline: !navigator.onLine, manual: true, removido: false,
    criado_em: now.toISOString(), atualizado_em: now.toISOString(), sync: 'pendente'
  };
  await db.put('registros', r);
  S.registros.push(r);
  await sync.contarPendentes();
  sync.sincronizar();
}

async function removerRegistro(id) {
  const r = S.registros.find((x) => x.id === id);
  if (!r) return;
  Object.assign(r, { removido: true, atualizado_em: agora().toISOString(), sync: 'pendente' });
  await db.put('registros', r);
  await sync.contarPendentes();
  sync.sincronizar();
}

/* ---------- administrador ---------- */
const ADMIN_MINUTOS = 10;
const adminAtivo = () => Date.now() < S.adminAte;
const b64 = (u8) => btoa(String.fromCharCode(...u8));
async function hashSenha(senha, saltB64) {
  const salt = saltB64 ? Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, key, 256);
  return { hash: b64(new Uint8Array(bits)), salt: b64(salt) };
}
async function conferirSenha(senha) {
  if (!S.cfg.adminHash || !senha) return false;
  return (await hashSenha(senha, S.cfg.adminSalt)).hash === S.cfg.adminHash;
}
function desbloquearAdmin() {
  S.adminAte = Date.now() + ADMIN_MINUTOS * 60000;
  S.pedirSenha = false;
  S.adminMsg = null;
  clearTimeout(desbloquearAdmin.t);
  desbloquearAdmin.t = setTimeout(() => { S.editando = null; S.confirmarLimpeza = false; render(); toast('Modo administrador bloqueado.'); }, ADMIN_MINUTOS * 60000 + 500);
}
function bloquearAdmin() { S.adminAte = 0; S.editando = null; S.confirmarRemocao = null; S.confirmarLimpeza = false; clearTimeout(desbloquearAdmin.t); }

/** Botão/caixa de senha que libera a edição de registros. */
function painelAdmin(contexto) {
  const msg = S.adminMsg ? `<p class="msg ${S.adminMsg.ok ? 'ok' : 'erro'}" role="status">${esc(S.adminMsg.txt)}</p>` : '';
  if (adminAtivo()) {
    return `<div class="admin-ativo"><span>${ICON.cadeadoAberto} Modo administrador até ${C.fromMin(new Date(S.adminAte).getHours() * 60 + new Date(S.adminAte).getMinutes())}</span><button type="button" class="link-btn" data-action="bloquear-admin">Bloquear</button></div>`;
  }
  if (!S.cfg.adminHash) {
    return contexto !== 'cad'
      ? `<a class="btn sec peq" href="#/cadastro?s=admin">${ICON.cadeado} Definir senha de administrador</a>`
      : '';
  }
  if (!S.pedirSenha) return `<button type="button" class="btn sec peq" data-action="pedir-admin">${ICON.cadeado} Alterar registros (administrador)</button>${msg}`;
  return `<form data-form="admin" class="admin-form" novalidate>
      <label class="campo">Senha de administrador<input type="password" name="senha" autocomplete="off" required></label>
      ${msg}
      <div class="duas">
        <button type="button" class="btn sec peq" data-action="cancelar-admin">Cancelar</button>
        <button type="submit" class="btn peq" ${S.ocupado ? 'disabled' : ''}>Desbloquear</button>
      </div>
    </form>`;
}

/* ---------- componentes ---------- */
function faixaConexao() {
  const e = sync.estado;
  const p = e.pendentes;
  const pend = p ? `<b>${p} pendente${p > 1 ? 's' : ''}</b>` : '';
  if (!e.configurado) return `<a class="net idle" href="#/cadastro?s=nuvem">${ICON.aparelho}<span class="txt">Dados salvos só neste aparelho · ativar nuvem</span></a>`;
  if (!e.logado) return `<a class="net idle" href="#/cadastro?s=nuvem">${ICON.aparelho}<span class="txt">Entre na sua conta para sincronizar</span>${pend}</a>`;
  if (!e.online) return `<div class="net off" role="status">${ICON.off}<span class="txt">Sem conexão · os registros ficam salvos no aparelho</span>${pend}</div>`;
  if (e.sincronizando) return `<div class="net sync" role="status">${ICON.sync}<span class="txt">Sincronizando…</span>${p ? `<b>${p} enviando</b>` : ''}</div>`;
  if (e.erro) return `<button type="button" class="net err" data-action="sync">${ICON.alerta}<span class="txt">${esc(e.erro)} Toque para tentar de novo.</span>${pend}</button>`;
  const quando = e.ultimaSync ? C.horaDe(e.ultimaSync) : '—';
  return `<div class="net ok" role="status">${ICON.ok}<span class="txt">Online · ${p ? 'sincronizando em instantes' : 'tudo sincronizado às ' + quando}</span>${pend}</div>`;
}

function faixaAtualizacao() {
  return S.swEspera ? `<div class="atualizacao" role="status"><span>Nova versão do app disponível.</span><button type="button" data-action="atualizar-app">Atualizar</button></div>` : '';
}

function iniciais() {
  const p = (S.cfg.nome || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
  return esc(((p[0][0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase());
}

const tagFeriado = (f) => `<span class="tag" style="background:${corDe(f.tipo)}">Feriado ${esc((TIPOS_FERIADO[f.tipo] || TIPOS_FERIADO.federal).nome.toLowerCase())}</span>`;

/* ---------- tela: início ---------- */
function telaInicio() {
  const cfg = S.cfg;
  const now = agora();
  const nowMs = now.getTime();
  const hoje = C.ymd(now);
  const ini = C.inicioSemana(now);
  const mapa = feriadosMapa([...new Set([ini.getFullYear(), C.addDays(ini, 6).getFullYear()])]);
  const info = diaInfo(now, mapa, nowMs);
  const n = info.marcas.length;
  const carga = C.cargaDiaria(cfg);
  const entrada = C.toMin(cfg.entrada);
  const iniInt = entrada + Math.floor(carga / 2 / 30) * 30;
  const previstos = [entrada, iniInt, iniInt + Number(cfg.intervalo), entrada + carga + Number(cfg.intervalo)];
  const pendIds = new Set(S.registros.filter((r) => r.sync === 'pendente').map((r) => r.id));

  const qtdSlots = Math.max(4, n + (n >= 4 && n % 2 === 0 ? 0 : 0));
  let slots = '';
  for (let i = 0; i < Math.max(qtdSlots, n); i++) {
    const m = info.marcas[i];
    const cls = m ? 'feito' : i === n ? 'prox' : '';
    const t = m ? C.horaDe(m.ts) : previstos[i] !== undefined ? C.fromMin(previstos[i]) : '—';
    const lbl = i < 4 ? ['Entrada', 'Início intervalo', 'Fim intervalo', 'Saída'][i] : C.tipoPorOrdem(i);
    slots += `<li class="slot ${cls}"><span class="l">${lbl}</span><span class="t num">${t}</span>${m && pendIds.has(m.id) ? '<span class="pend">Pendente</span>' : ''}</li>`;
  }

  const encerrada = n >= 4 && n % 2 === 0;
  const status = !n ? { c: 'fim', t: 'Fora da jornada' } : info.aberto ? { c: 'ok', t: 'Em jornada' } : encerrada ? { c: 'fim', t: 'Jornada encerrada' } : { c: 'pausa', t: 'Em intervalo' };
  const proximo = C.tipoPorOrdem(n).toLowerCase();

  let previsto;
  if (info.fer.length) previsto = `Feriado: ${esc(info.fer[0].nome)} — registros contam como hora extra`;
  else if (!info.esp) previsto = 'Hoje não há jornada prevista';
  else previsto = `Jornada prevista ${cfg.entrada} – ${C.saidaPrevista(cfg)} · Intervalo ${C.curto(Number(cfg.intervalo))}`;

  // Semana
  let semTrab = 0, semEsp = 0, temFeriado = false, linhas = '';
  for (let k = 0; k < 7; k++) {
    const d = C.addDays(ini, k);
    const di = diaInfo(d, mapa, nowMs);
    semTrab += di.trab; semEsp += di.esp;
    if (di.fer.length && cfg.dias[d.getDay()]) temFeriado = true;
    if (!di.marcas.length && !di.fer.length && !di.esp) continue;
    const pend = di.marcas.filter((m) => pendIds.has(m.id)).length;
    const futuro = di.data > hoje;
    let corpo = '';
    if (di.fer.length) corpo += `<span class="h">${esc(di.fer[0].nome)}</span>${tagFeriado(di.fer[0])}`;
    if (di.marcas.length) {
      const nota = pend ? `${pend} registro${pend > 1 ? 's' : ''} aguardando envio`
        : di.ehHoje && (di.aberto || di.marcas.length < 4) ? (di.aberto ? 'Hoje · em andamento' : 'Hoje · em intervalo')
          : di.aberto ? 'Marcação ímpar — inclua a saída no Calendário'
            : di.esp || di.trab ? 'Saldo ' + C.saldo(di.trab - di.esp) : '';
      corpo += `<span class="m num">${di.marcas.map((m) => C.horaDe(m.ts)).join(' · ')}</span><span class="s ${pend || (di.aberto && !di.ehHoje) ? 'warn' : ''}">${nota}</span>`;
    } else if (!di.fer.length) {
      corpo += `<span class="s">${futuro ? 'Previsto ' + C.hm(di.esp) : di.ehHoje ? 'Nenhum registro ainda' : 'Sem registros'}</span>`;
    }
    linhas += `<li class="${di.ehHoje ? 'hoje' : ''}"><div class="dia"><span class="w">${C.DIAS_CURTO[d.getDay()]}</span><span class="n num">${C.pad(d.getDate())}</span></div><div class="info">${corpo}</div><span class="tot num">${di.marcas.length ? C.hm(di.trab) : '—'}</span></li>`;
  }
  const fimSem = C.addDays(ini, 6);
  const rm = bancoDoMes(now);
  const banco = rm.saldo;
  const primeiroNome = (cfg.nome || '').trim().split(/\s+/)[0];

  return `
  <header class="top">
    <div class="titulo">
      <span class="sub">${C.DIAS[now.getDay()]}, ${now.getDate()} de ${C.MESES[now.getMonth()]}</span>
      <h1>${primeiroNome ? 'Olá, ' + esc(primeiroNome) : 'Olá!'}</h1>
    </div>
    <div class="acoes">
      <button type="button" class="icon-btn" data-action="alternar-tema" aria-label="Alternar tema claro/chumbo">${document.documentElement.dataset.theme === 'dark' ? ICON.sol : ICON.lua}</button>
      <a href="#/cadastro" class="icon-btn avatar" aria-label="Abrir cadastro e configurações">${iniciais()}</a>
    </div>
  </header>
  ${faixaAtualizacao()}
  ${faixaConexao()}
  <div class="cols"><div class="col">
  <section class="card" aria-label="Registro de ponto">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
      <span class="pill ${status.c}"><span class="dot"></span>${status.t}</span>
      <span style="font-size:13px;color:var(--muted)">${esc(C.regimeDe(cfg).nome)}</span>
    </div>
    <div class="relogio">
      <span class="hora num" aria-live="off"><span data-clock="hm">${C.pad(now.getHours())}:${C.pad(now.getMinutes())}</span><span class="seg" data-clock="s">:${C.pad(now.getSeconds())}</span></span>
      <span class="prev">${previsto}</span>
    </div>
    <button type="button" class="btn-registrar" data-action="registrar">${ICON.relogio} Registrar ${proximo}</button>
    ${S.aviso ? `<p class="aviso ${S.aviso.off ? 'off' : ''}" role="status">${esc(S.aviso.txt)}</p>` : ''}
    <ol class="slots" aria-label="Marcações de hoje">${slots}</ol>
  </section>
  <section class="resumo" aria-label="Resumo">
    <div><span class="l">Hoje</span><span class="v num">${C.hm(info.trab)}</span><span class="d">de ${C.hm(info.esp)}</span></div>
    <div><span class="l">Semana</span><span class="v num">${C.hm(semTrab)}</span><span class="d">de ${C.hm(semEsp)}${temFeriado ? ' *' : ''}</span></div>
    <a href="#/mes" class="resumo-link" aria-label="Banco de horas: ${C.saldo(banco)}. Abrir o mês"><span class="l">Banco de horas ›</span><span class="v num ${banco > 0 ? 'pos' : banco < 0 ? 'neg' : ''}">${C.saldo(banco)}</span><span class="d">ver o mês</span></a>
  </section>
  ${rm.faltas ? `<a class="atalho-mes" href="#/mes"><span class="ic">${ICON.espelho}</span><span class="tx"><b>Mês de ${C.MESES[now.getMonth()]}</b><span class="neg">${rm.faltas} dia${rm.faltas === 1 ? '' : 's'} sem registro · saldo ${C.saldo(banco)}</span></span>${ICON.dir}</a>` : ''}
  ${temFeriado ? '<p class="nota">* Esta semana tem feriado em dia de trabalho — a carga semanal foi reduzida automaticamente.</p>' : ''}
  </div><div class="col">
  <section class="bloco" aria-labelledby="sem">
    <div class="bloco-head"><h2 id="sem">Registros da semana</h2><span>${ini.getDate()} ${C.MESES[ini.getMonth()].slice(0, 3)} – ${fimSem.getDate()} ${C.MESES[fimSem.getMonth()].slice(0, 3)}</span></div>
    <ul class="lista">${linhas || '<li><span class="vazio">Nenhum dia de trabalho nesta semana.</span></li>'}</ul>
  </section>
  </div></div>`;
}

/* ---------- tela: calendário ---------- */
function telaCalendario() {
  const now = agora();
  const mesStr = S.q.m || C.ymd(now).slice(0, 7);
  const [ano, mes] = mesStr.split('-').map(Number);
  const primeiro = new Date(ano, mes - 1, 1);
  const ult = new Date(ano, mes, 0).getDate();
  const inicio = C.addDays(primeiro, -primeiro.getDay());
  const semanas = Math.ceil((primeiro.getDay() + ult) / 7);
  const mapa = feriadosMapa([ano - 1, ano, ano + 1]);
  const hoje = hojeStr();
  if (!S.calSel || S.calSel.slice(0, 7) !== mesStr) S.calSel = hoje.slice(0, 7) === mesStr ? hoje : `${mesStr}-01`;
  const sel = S.calSel;

  let cels = '';
  for (let i = 0; i < semanas * 7; i++) {
    const d = C.addDays(inicio, i);
    const ds = C.ymd(d);
    const fora = d.getMonth() !== mes - 1;
    const fer = mapa[ds] || [];
    const trab = marcasDoDia(ds).length > 0;
    const fds = !S.cfg.dias[d.getDay()];
    const cls = ['cel', fora && 'fora', !fora && fer.length && 'fer', !fora && !fer.length && fds && 'fds', trab && 'trab', ds === hoje && 'hoje', ds === sel && 'sel'].filter(Boolean).join(' ');
    const style = !fora && fer.length ? ` style="background:${corDe(fer[0].tipo)}"` : '';
    const aria = `${d.getDate()} de ${C.MESES[d.getMonth()]}${fer.length ? ', feriado ' + (TIPOS_FERIADO[fer[0].tipo] || {}).nome + ': ' + fer[0].nome : ''}${trab ? ', com registros' : ''}`;
    cels += `<button type="button" class="${cls}"${style} data-action="cal-dia" data-dia="${ds}" aria-label="${esc(aria)}" aria-pressed="${ds === sel}"><span class="n num">${d.getDate()}</span><span class="p"></span></button>`;
  }

  const legenda = Object.values(TIPOS_FERIADO).map((t) => `<span><span class="sw" style="background:${t.cor}"></span>${t.nome}</span>`).join('')
    + '<span><span class="sw" style="width:8px;height:8px;border-radius:4px;background:var(--ok-dot);margin:0 2px"></span>Dia trabalhado</span>';

  // Detalhe do dia
  const dSel = C.parseYmd(sel);
  const di = diaInfo(dSel, mapa, now.getTime());
  const pendIds = new Set(S.registros.filter((r) => r.sync === 'pendente').map((r) => r.id));
  let det = `<span class="k">${C.DIAS[dSel.getDay()]}, ${dSel.getDate()} de ${C.MESES[dSel.getMonth()]}</span>`;
  if (di.fer.length) {
    di.fer.forEach((f) => { det += `<span class="t">${esc(f.nome)}</span>${tagFeriado(f)}`; });
    det += `<span class="x">Dia não útil — não conta na carga semanal. Registros neste dia entram como hora extra.</span>`;
  } else if (di.esp) {
    det += `<span class="t">${di.marcas.length ? 'Trabalhado: ' + C.hm(di.trab) : sel > hoje ? 'Dia útil previsto' : di.ehHoje ? 'Hoje' : 'Sem registros'}</span><span class="x">Jornada prevista ${C.hm(di.esp)} · Intervalo ${C.curto(Number(S.cfg.intervalo))}${di.marcas.length && !di.aberto && !di.ehHoje ? ' · Saldo ' + C.saldo(di.trab - di.esp) : ''}</span>`;
  } else {
    det += `<span class="t">${di.marcas.length ? 'Trabalhado: ' + C.hm(di.trab) : 'Descanso semanal'}</span><span class="x">Sem jornada prevista neste dia.</span>`;
  }
  const admin = adminAtivo();
  if (di.marcas.length) {
    det += '<ul class="marcas">' + di.marcas.map((m, i) => {
      const flags = [m.manual && 'ajustada', m.offline && 'offline', pendIds.has(m.id) && 'pendente'].filter(Boolean).join(' · ');
      if (admin && S.editando === m.id) {
        return `<li><form data-form="editar" style="display:flex;gap:8px;align-items:center;width:100%">
          <label class="sr-only" for="ed-${m.id}">Novo horário</label>
          <input id="ed-${m.id}" class="input num" type="time" name="hora" value="${C.horaDe(m.ts)}" required style="height:44px;flex:1">
          <button type="button" class="link-btn" style="color:var(--muted)" data-action="cancelar-edicao">Cancelar</button>
          <button type="submit" class="btn peq" style="width:auto;padding:0 14px;height:44px">Salvar</button>
        </form></li>`;
      }
      const conf = S.confirmarRemocao === m.id;
      const acoes = admin
        ? `<button type="button" class="link-btn" style="color:var(--text)" data-action="editar-reg" data-id="${m.id}">Alterar</button><button type="button" class="link-btn" data-action="remover-reg" data-id="${m.id}">${conf ? 'Confirmar' : 'Remover'}</button>`
        : '';
      return `<li><span class="num" style="font-weight:600">${C.horaDe(m.ts)}</span><span class="tp">${C.tipoPorOrdem(i)}${flags ? ` <span class="flag">· ${flags}</span>` : ''}</span>${acoes}</li>`;
    }).join('') + '</ul>';
  }
  if (sel <= hoje && admin) {
    det += `<form data-form="manual" style="display:flex;gap:8px;align-items:flex-end">
      <label class="campo" style="flex:1">Incluir marcação esquecida<input type="time" name="hora" required></label>
      <button type="submit" class="btn peq" style="width:auto;padding:0 16px">Incluir</button>
    </form>`;
  }
  if (sel <= hoje) det += painelAdmin('cal');
  const proprio = di.fer.find((f) => f.origem !== 'nacional');
  det += `<a class="btn sec peq" href="#/feriado?data=${sel}${di.fer[0] ? '&id=' + encodeURIComponent(di.fer[0].id) : ''}">${di.fer.length ? 'Editar feriado' : 'Marcar este dia como feriado'}</a>`;

  // Feriados do mês
  const doMes = [];
  for (let k = 1; k <= ult; k++) {
    const ds = `${mesStr}-${C.pad(k)}`;
    (mapa[ds] || []).forEach((f) => doMes.push({ ...f, data: ds }));
  }
  const listaFer = doMes.map((f) => {
    const d = C.parseYmd(f.data);
    return `<li><a class="fer-item" href="#/feriado?data=${f.data}&id=${encodeURIComponent(f.id)}" style="display:flex;align-items:center;gap:12px;width:100%"><span class="badge num" style="background:${corDe(f.tipo)}">${C.pad(d.getDate())}</span><div class="info"><span class="h" style="font-size:15px">${esc(f.nome)}</span><span class="s">${C.DIAS[d.getDay()]} · ${(TIPOS_FERIADO[f.tipo] || {}).nome}${f.recorrente && f.origem !== 'nacional' ? ' · todo ano' : ''}</span></div></a></li>`;
  }).join('');

  const prev = new Date(ano, mes - 2, 1), next = new Date(ano, mes, 1);
  const mStr = (d) => `${d.getFullYear()}-${C.pad(d.getMonth() + 1)}`;
  void proprio;

  return `
  <header class="top">
    <h1>Calendário</h1>
    <a class="btn peq" style="width:auto;padding:0 14px;gap:6px;height:44px" href="#/feriado?data=${sel}">${ICON.mais} Marcar feriado</a>
  </header>
  <div class="cols"><div class="col">
  <section class="card" aria-label="${C.MESES[mes - 1]} de ${ano}" style="padding:16px 14px 18px;gap:12px">
    <div class="cal-head">
      <a class="nav-btn" href="#/calendario?m=${mStr(prev)}" aria-label="Mês anterior">${ICON.esq}</a>
      <span class="mes display" style="text-transform:capitalize">${C.MESES[mes - 1]} ${ano}</span>
      <a class="nav-btn" href="#/calendario?m=${mStr(next)}" aria-label="Próximo mês">${ICON.dir}</a>
    </div>
    <div class="semana-h" aria-hidden="true"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div>
    <div class="grade">${cels}</div>
  </section>
  <section class="legenda" aria-label="Legenda">${legenda}</section>
  </div><div class="col">
  <section class="card s det" aria-label="Dia selecionado" style="gap:8px">${det}</section>
  <section class="bloco" aria-labelledby="fm">
    <div class="bloco-head"><h2 id="fm">Feriados do mês</h2></div>
    <ul class="lista">${listaFer || '<li><span class="vazio">Nenhum feriado neste mês.</span></li>'}</ul>
  </section>
  </div></div>`;
}

/* ---------- folha: marcar/editar feriado ---------- */
function folhaFeriado() {
  const id = S.q.id || '';
  const data = S.q.data || hojeStr();
  const ano = Number(data.slice(0, 4));
  let existente = id ? S.feriados.find((f) => f.id === id) : null;
  const nac = id.startsWith('nac:') ? nacionais(ano).find((n) => n.id === id) : null;
  if (!S.form.feriadoKey || S.form.feriadoKey !== id + data) {
    const base = existente || nac || {};
    S.form = {
      feriadoKey: id + data,
      data: existente && !existente.recorrente ? existente.data : data,
      nome: (existente && existente.nome) || (nac && nac.nome) || '',
      tipo: (existente && existente.tipo) || base.tipo || 'municipal',
      recorrente: existente ? !!existente.recorrente : nac ? true : false
    };
  }
  const F = S.form;
  const dataIso = /^\d{4}-\d{2}-\d{2}$/.test(F.data) ? F.data : null;
  const dow = dataIso ? C.DIAS[C.parseYmd(dataIso).getDay()] : '—';
  const tipos = Object.entries(TIPOS_FERIADO).map(([k, t]) =>
    `<button type="button" class="tipo" role="radio" aria-checked="${F.tipo === k}" data-action="fer-tipo" data-tipo="${k}" style="color:${t.cor}"><span class="sw" style="background:${t.cor}"></span><span class="tx" style="color:var(--text)"><b>${t.nome}</b><span>${t.dica}</span></span></button>`).join('');
  return `
  <div class="folha-bg" data-action="fechar-folha-bg">
    <section class="folha" role="dialog" aria-modal="true" aria-labelledby="mf">
      <span class="alca" aria-hidden="true"></span>
      <div class="cab">
        <h1 id="mf" class="display">${nac ? 'Feriado nacional' : existente ? 'Editar feriado' : 'Marcar feriado'}</h1>
        <button type="button" class="icon-btn" style="background:var(--surface-2)" data-action="fechar-folha" aria-label="Fechar">${ICON.fechar}</button>
      </div>
      <form data-form="feriado" style="display:flex;flex-direction:column;gap:18px" novalidate>
        <div class="duas">
          <label class="campo">Data<input type="date" name="data" value="${esc(F.data)}" ${nac ? 'readonly' : ''} data-field="fer-data" class="num"></label>
          <label class="campo">Dia da semana<input type="text" value="${dow}" readonly data-out="dow"></label>
        </div>
        <label class="campo">Nome do feriado<input type="text" name="nome" placeholder="Ex.: Aniversário da cidade" value="${esc(F.nome)}" data-field="fer-nome" maxlength="80"></label>
        <fieldset><legend>Tipo</legend><div class="tipos" role="radiogroup">${tipos}</div></fieldset>
        ${nac ? '<p class="dica" style="color:var(--muted)">Feriado nacional calculado automaticamente todo ano. Você pode mudar o tipo/nome ou ocultá-lo.</p>'
    : `<button type="button" class="switch" role="switch" aria-checked="${F.recorrente}" data-action="fer-rec"><span class="tx"><b>Repetir todo ano</b><span>Mesma data nos próximos anos</span></span><span class="trk"><span class="knb"></span></span></button>`}
        <p class="msg erro" data-out="fer-erro" role="alert"></p>
        <div class="duas">
          <button type="button" class="btn sec" data-action="fechar-folha">Cancelar</button>
          <button type="submit" class="btn">Salvar feriado</button>
        </div>
        ${existente || nac ? `<button type="button" class="link-btn" data-action="fer-remover" style="align-self:center">${nac ? 'Ocultar este feriado nacional' : 'Remover feriado'}</button>` : ''}
      </form>
    </section>
  </div>`;
}

async function salvarFeriado() {
  const F = S.form;
  const id = S.q.id || '';
  const nac = id.startsWith('nac:');
  const dataIso = /^\d{4}-\d{2}-\d{2}$/.test(F.data) ? F.data : null;
  const erro = document.querySelector('[data-out="fer-erro"]');
  if (!dataIso) { erro.textContent = 'Escolha a data do feriado.'; return; }
  if (!F.nome.trim()) { erro.textContent = 'Informe o nome do feriado.'; return; }
  const now = agora().toISOString();
  const atual = S.feriados.find((f) => f.id === id);
  const reg = {
    ...(atual || {}),
    id: nac ? id : atual ? atual.id : uuid(),
    data: dataIso, nome: F.nome.trim(), tipo: F.tipo,
    recorrente: nac ? true : !!F.recorrente, removido: false,
    atualizado_em: now, sync: 'pendente'
  };
  await db.put('feriados', reg);
  S.feriados = S.feriados.filter((f) => f.id !== reg.id).concat(reg);
  await sync.contarPendentes();
  sync.sincronizar();
  S.calSel = dataIso;
  toast('Feriado salvo.');
  location.hash = `#/calendario?m=${dataIso.slice(0, 7)}`;
}

async function removerFeriado() {
  const id = S.q.id;
  const nac = id.startsWith('nac:');
  const atual = S.feriados.find((f) => f.id === id);
  const data = S.q.data || hojeStr();
  const reg = { ...(atual || { id, data, nome: '', tipo: 'federal', recorrente: true }), removido: true, atualizado_em: agora().toISOString(), sync: 'pendente' };
  await db.put('feriados', reg);
  S.feriados = S.feriados.filter((f) => f.id !== id).concat(reg);
  await sync.contarPendentes();
  sync.sincronizar();
  toast(nac ? 'Feriado nacional ocultado.' : 'Feriado removido.');
  location.hash = `#/calendario?m=${data.slice(0, 7)}`;
}

/* ---------- tela: cadastro ---------- */
function telaCadastro() {
  const cfg = S.cfg;
  const div = C.divisor(cfg);
  const sal = C.salarioVigente(cfg);
  const vh = sal / div;
  if (!S.form.cadastro) S.form = { cadastro: true, modo: 'salario', valor: C.num2(sal), vigencia: hojeStr() };
  const F = S.form;
  const iv = C.avaliarIntervalo(cfg);
  const regimes = C.REGIMES.map((r) => `<button type="button" class="opcao" role="radio" aria-checked="${cfg.regime === r.id}" data-action="regime" data-id="${r.id}"><span class="rd"></span><span class="tx"><b>${r.nome}</b><span>${r.desc}</span></span><span class="dv num">${(r.semanal || C.semanal(cfg)) * 5}h/mês</span></button>`).join('');
  const ivs = [15, 30, 60, 90, 120].map((v) => `<button type="button" class="chip" role="radio" aria-checked="${Number(cfg.intervalo) === v}" data-action="intervalo" data-v="${v}">${C.curto(v)}</button>`).join('');
  const dias = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((l, i) => `<button type="button" class="chip redondo" aria-pressed="${!!cfg.dias[i]}" aria-label="${C.DIAS[i]}" data-action="dia" data-i="${i}">${l}</button>`).join('');
  const hist = [...cfg.historico].sort((a, b) => b.vigencia.localeCompare(a.vigencia))
    .map((h) => `<li><span>${h.vigencia <= '2000-01-01' ? 'Inicial' : 'A partir de ' + C.brDate(h.vigencia)}${h.motivo && h.vigencia > '2000-01-01' ? ' · ' + esc(h.motivo) : ''}</span><span class="num" style="font-weight:600">${C.brl(h.salario)}</span></li>`).join('');
  const rotuloSal = cfg.regime === 'pj' ? 'Estimativa mensal' : cfg.regime === 'est30' ? 'Bolsa mensal' : 'Salário mensal';
  const tema = temaSalvo();

  return `
  <header class="top" style="justify-content:flex-start">
    <a href="#/" class="icon-btn" aria-label="Voltar para o início">${ICON.esq}</a>
    <h1>Cadastro e configurações</h1>
  </header>
  <div class="cad-grid">

  <section class="card s" aria-labelledby="s1">
    <h2 id="s1" class="sec-title">1 · Colaborador</h2>
    <label class="campo">Nome completo<input type="text" value="${esc(cfg.nome)}" placeholder="Nome do colaborador" data-cfg="nome" autocomplete="name"></label>
    <div class="duas">
      <label class="campo">Cargo<input type="text" value="${esc(cfg.cargo)}" placeholder="Cargo" data-cfg="cargo"></label>
      <label class="campo">Admissão<input type="date" value="${esc(cfg.admissao || '')}" max="${hojeStr()}" data-cfg="admissao" class="num"></label>
    </div>
  </section>

  <section class="card s" aria-labelledby="s2">
    <h2 id="s2" class="sec-title">2 · Regime de trabalho</h2>
    <div class="opcoes" role="radiogroup" aria-labelledby="s2">${regimes}</div>
    ${cfg.regime === 'pj' ? `<label class="campo">Horas previstas por semana<input type="number" min="1" max="70" value="${C.semanal(cfg)}" data-cfg="semanalPJ" inputmode="numeric"></label>` : ''}
  </section>

  <section class="card s" aria-labelledby="s3" style="gap:14px">
    <h2 id="s3" class="sec-title">3 · Horário e intervalo</h2>
    <div class="duas">
      <label class="campo">Entrada<input type="time" value="${cfg.entrada}" data-cfg="entrada" class="num"></label>
      <label class="campo">Saída (calculada)<input type="text" value="${C.saidaPrevista(cfg)}" readonly class="num"></label>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <span id="int" style="font-size:13px;font-weight:600;color:var(--text-2)">Tempo de intervalo</span>
      <div class="chips" role="radiogroup" aria-labelledby="int" style="grid-template-columns:repeat(5,minmax(0,1fr))">${ivs}</div>
      <p class="dica ${iv.ok ? '' : 'erro'}">${iv.msg}</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <span id="dias" style="font-size:13px;font-weight:600;color:var(--text-2)">Dias de trabalho</span>
      <div class="chips" role="group" aria-labelledby="dias" style="grid-template-columns:repeat(7,minmax(0,1fr));gap:4px">${dias}</div>
    </div>
    <div class="linha-info"><span style="color:var(--text-2)">Carga diária</span><span class="num" style="font-weight:600">${C.curto(C.cargaDiaria(cfg))} · ${C.diasTrabalho(cfg)} dias/semana</span></div>
  </section>

  <section class="card s" aria-labelledby="s4" style="gap:14px">
    <h2 id="s4" class="sec-title">4 · Remuneração</h2>
    <div class="kpi2">
      <div class="forte"><span class="l">${rotuloSal}</span><span class="v num">${C.brl(sal)}</span></div>
      <div><span class="l" style="color:var(--muted);opacity:1">Valor hora</span><span class="v num">${C.brl(vh)}</span></div>
    </div>
    <p class="formula num">${C.brl(sal)} ÷ ${div}h (divisor mensal para ${C.semanal(cfg)}h semanais) = ${C.brl(vh)}/h</p>
    <form class="divisor-sec" data-form="reajuste" novalidate>
      <span style="font-size:15px;font-weight:600">Reajustar</span>
      <div class="tabs" role="tablist" aria-label="Reajustar por">
        <button type="button" role="tab" aria-selected="${F.modo === 'salario'}" data-action="modo" data-m="salario">Pelo salário</button>
        <button type="button" role="tab" aria-selected="${F.modo === 'hora'}" data-action="modo" data-m="hora">Pelo valor hora</button>
      </div>
      <label class="campo">${F.modo === 'salario' ? 'Novo salário mensal' : 'Novo valor hora'}
        <span class="dinheiro"><span>R$</span><input type="text" inputmode="decimal" value="${esc(F.valor)}" data-field="valor" class="num"></span>
      </label>
      <div class="presets">${[3, 5, 8, 10].map((p) => `<button type="button" data-action="preset" data-p="${p}">+${p}%</button>`).join('')}</div>
      <div class="previa" data-out="previa">${previaReajuste()}</div>
      <label class="campo">Vigência a partir de<input type="date" value="${esc(F.vigencia)}" data-field="vigencia" class="num"></label>
      <p class="msg erro" data-out="reaj-erro" role="alert"></p>
      <button type="submit" class="btn">Aplicar reajuste</button>
    </form>
    <div class="divisor-sec" style="gap:8px">
      <span style="font-size:13px;font-weight:600;color:var(--text-2)">Histórico salarial</span>
      <ul class="hist">${hist}</ul>
    </div>
  </section>

  ${secaoNuvem()}

  ${secaoAdmin()}

  <section class="card s" aria-labelledby="s6">
    <h2 id="s6" class="sec-title">6 · Aparência</h2>
    <div class="chips" role="radiogroup" aria-labelledby="s6" style="grid-template-columns:repeat(3,minmax(0,1fr))">
      ${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Chumbo']].map(([v, l]) => `<button type="button" class="chip" role="radio" aria-checked="${tema === v}" data-action="tema" data-v="${v}">${l}</button>`).join('')}
    </div>
    <p class="dica" style="color:var(--muted)">Automático segue o tema do celular.</p>
  </section>

  <section class="card s" aria-labelledby="s7">
    <h2 id="s7" class="sec-title">7 · Dados</h2>
    <button type="button" class="btn sec peq" data-action="exportar">Exportar backup (JSON)</button>
    <p class="dica" style="color:var(--muted)">${S.registros.filter((r) => !r.removido).length} registros e ${S.feriados.filter((f) => !f.removido).length} feriados salvos neste aparelho.</p>
  </section>
  </div>
  <div style="height:16px"></div>`;
}

function calcReajuste() {
  const cfg = S.cfg;
  const div = C.divisor(cfg);
  const sal = C.salarioVigente(cfg);
  const v = C.parseBr(S.form.valor);
  const novoSal = S.form.modo === 'salario' ? v : v * div;
  const novoHora = S.form.modo === 'salario' ? v / div : v;
  const pct = sal ? (novoSal / sal - 1) * 100 : 0;
  return { novoSal, novoHora, pct };
}
function previaReajuste() {
  const r = calcReajuste();
  const cls = r.pct > 0.004 ? 'pos' : r.pct < -0.004 ? 'neg' : '';
  return `<div><span style="color:var(--text-2)">Novo salário</span><span class="num" style="font-weight:600">${C.brl(r.novoSal)}</span></div>
    <div><span style="color:var(--text-2)">Novo valor hora</span><span class="num" style="font-weight:600">${C.brl(r.novoHora)}</span></div>
    <div><span style="color:var(--text-2)">Variação</span><span class="num ${cls}" style="font-weight:600">${(r.pct >= 0 ? '+' : '') + r.pct.toFixed(2).replace('.', ',')}%</span></div>`;
}

function secaoAdmin() {
  const msg = S.adminMsg ? `<p class="msg ${S.adminMsg.ok ? 'ok' : 'erro'}" role="status">${esc(S.adminMsg.txt)}</p>` : '';
  let corpo;
  if (!S.cfg.adminHash) {
    corpo = `<p class="dica" style="color:var(--muted)">Defina uma senha para liberar a alteração, inclusão e remoção de registros de ponto.</p>
      <form data-form="definir-admin" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <div class="duas">
          <label class="campo">Nova senha<input type="password" name="nova" autocomplete="new-password" minlength="4" required></label>
          <label class="campo">Repetir senha<input type="password" name="repetir" autocomplete="new-password" minlength="4" required></label>
        </div>
        ${msg}
        <button type="submit" class="btn peq">Definir senha</button>
      </form>`;
  } else if (!adminAtivo()) {
    corpo = `<p class="dica" style="color:var(--muted)">Registros só podem ser alterados com a senha de administrador. Depois de desbloquear, edite os registros pelo Calendário.</p>${painelAdmin('cad')}`;
  } else {
    const total = S.registros.filter((r) => !r.removido).length;
    corpo = `${painelAdmin('cad')}
      <a class="btn sec peq" href="#/calendario">Alterar registros no Calendário</a>
      <button type="button" class="btn sec peq" style="color:var(--err)" data-action="limpar-registros" ${total ? '' : 'disabled'}>${S.confirmarLimpeza ? `Confirmar: remover ${total} registro${total === 1 ? '' : 's'}` : 'Limpar todos os registros de teste'}</button>
      <form data-form="trocar-admin" class="divisor-sec" style="gap:12px" novalidate>
        <span style="font-size:13px;font-weight:600;color:var(--text-2)">Trocar senha de administrador</span>
        <div class="duas">
          <label class="campo">Nova senha<input type="password" name="nova" autocomplete="new-password" minlength="4" required></label>
          <label class="campo">Repetir senha<input type="password" name="repetir" autocomplete="new-password" minlength="4" required></label>
        </div>
        ${msg}
        <button type="submit" class="btn sec peq">Trocar senha</button>
      </form>`;
  }
  return `<section class="card s" id="admin" aria-labelledby="s8">
    <h2 id="s8" class="sec-title">8 · Administração</h2>
    ${corpo}
  </section>`;
}

function secaoNuvem() {
  const e = sync.estado;
  const c = sync.conexao();
  const msg = S.nuvemMsg ? `<p class="msg ${S.nuvemMsg.ok ? 'ok' : 'erro'}" role="status">${esc(S.nuvemMsg.txt)}</p>` : '';
  let corpo;
  if (!e.configurado || S.editarConexao) {
    corpo = `<p class="dica" style="color:var(--muted)">Cole os dados do seu projeto Supabase (Project Settings › API).</p>
      <form data-form="conexao" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <label class="campo">Project URL<input type="url" name="url" value="${esc(c.url)}" placeholder="https://xxxx.supabase.co" autocomplete="off"></label>
        <label class="campo">Chave anon public<input type="text" name="key" value="${esc(c.key)}" placeholder="eyJhbGciOi…" autocomplete="off"></label>
        ${msg}
        <button type="submit" class="btn peq">Salvar conexão</button>
      </form>`;
  } else if (!e.logado) {
    corpo = `<form data-form="login" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <label class="campo">E-mail<input type="email" name="email" autocomplete="username" required></label>
        <label class="campo">Senha<input type="password" name="senha" autocomplete="current-password" minlength="6" required></label>
        ${msg}
        <div class="duas">
          <button type="button" class="btn sec peq" data-action="criar-conta" ${S.ocupado ? 'disabled' : ''}>Criar conta</button>
          <button type="submit" class="btn peq" ${S.ocupado ? 'disabled' : ''}>${S.ocupado ? 'Aguarde…' : 'Entrar'}</button>
        </div>
      </form>
      <button type="button" class="link-btn" style="color:var(--muted);align-self:flex-start" data-action="editar-conexao">Alterar conexão</button>`;
  } else {
    corpo = `<div class="linha-info"><span style="color:var(--text-2)">Conta</span><span style="font-weight:600">${esc(e.email)}</span></div>
      <div class="linha-info"><span style="color:var(--text-2)">Última sincronização</span><span class="num" style="font-weight:600">${e.ultimaSync ? C.brDate(C.ymd(new Date(e.ultimaSync))) + ' ' + C.horaDe(e.ultimaSync) : '—'}</span></div>
      <div class="linha-info"><span style="color:var(--text-2)">Pendentes no aparelho</span><span class="num" style="font-weight:600">${e.pendentes}</span></div>
      ${e.erro ? `<p class="msg erro">${esc(e.erro)}</p>` : ''}${msg}
      <div class="duas">
        <button type="button" class="btn sec peq" data-action="sair">Sair</button>
        <button type="button" class="btn peq" data-action="sync" ${e.sincronizando ? 'disabled' : ''}>${e.sincronizando ? 'Sincronizando…' : 'Sincronizar agora'}</button>
      </div>`;
  }
  return `<section class="card s" id="nuvem" aria-labelledby="s5">
    <h2 id="s5" class="sec-title">5 · Nuvem e sincronização</h2>
    ${corpo}
  </section>`;
}

/* ---------- mês: cálculo ---------- */
const ROT_OC = { falta: 'Falta', atestado: 'Atestado / abono', folga: 'Folga compensada' };
const ocorrencia = (data) => (S.cfg.ocorrencias || {})[data] || null;

/** Primeiro dia que conta para o saldo: a admissão ou, sem ela, o 1º dia do mês do primeiro registro. */
function inicioContagem() {
  if (S.cfg.admissao) return S.cfg.admissao;
  const p = S.registros.filter((r) => !r.removido).map((r) => r.data).sort()[0];
  return p ? p.slice(0, 7) + '-01' : null;
}

/** Horários padrão do dia: entrada, início e fim do intervalo, saída. */
function horariosPadrao() {
  const cfg = S.cfg;
  const carga = C.cargaDiaria(cfg);
  const entrada = C.toMin(cfg.entrada);
  const iniInt = entrada + Math.floor(carga / 2 / 30) * 30;
  return [entrada, iniInt, iniInt + Number(cfg.intervalo), entrada + carga + Number(cfg.intervalo)].map(C.fromMin);
}

function resumoPeriodo(ini, fim, mapa) {
  const nowMs = agora().getTime();
  let trab = 0, esp = 0, faltas = 0, incompletos = 0;
  const dias = [];
  for (let d = C.parseYmd(ini); C.ymd(d) <= fim; d = C.addDays(d, 1)) {
    const di = diaInfo(d, mapa, nowMs);
    dias.push(di);
    if (di.conta) { trab += di.trab; esp += di.esp; }
    if (di.falta) faltas++;
    if (di.incompleto && di.conta) incompletos++;
  }
  return { trab, esp, saldo: trab - esp, faltas, incompletos, dias };
}

function resumoMes(mesStr) {
  const [ano, mes] = mesStr.split('-').map(Number);
  const ult = new Date(ano, mes, 0).getDate();
  return resumoPeriodo(`${mesStr}-01`, `${mesStr}-${C.pad(ult)}`, feriadosMapa([ano]));
}

/* ---------- mês: lançamentos ---------- */
function novoRegistroManual(data, hhmm, i, nowIso) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = C.parseYmd(data); d.setHours(h, m, 0, 0);
  return {
    id: uuid(), data, tipo: C.tipoPorOrdem(i), ts: d.toISOString(), ts_dispositivo: new Date().toISOString(),
    offset_ms: sync.offsetAtual(), offline: !navigator.onLine, manual: true, removido: false,
    criado_em: nowIso, atualizado_em: nowIso, sync: 'pendente'
  };
}

/** Grava os horários de vários dias de uma vez. itens: [{ data, horas: ['08:00', ...], oc: null|'falta'|'atestado'|'folga' }] */
async function lancarDias(itens) {
  const nowIso = agora().toISOString();
  const mudados = [];
  const ocs = { ...(S.cfg.ocorrencias || {}) };
  for (const { data, horas, oc } of itens) {
    const atuais = marcasDoDia(data);
    const iguais = atuais.length === horas.length && atuais.every((m, i) => C.horaDe(m.ts) === horas[i]);
    if (!iguais) {
      for (const m of atuais) { Object.assign(m, { removido: true, atualizado_em: nowIso, sync: 'pendente' }); mudados.push(m); }
      horas.forEach((h, i) => { const r = novoRegistroManual(data, h, i, nowIso); S.registros.push(r); mudados.push(r); });
    }
    if (oc) ocs[data] = oc; else delete ocs[data];
  }
  if (mudados.length) await db.putMany('registros', mudados);
  if (JSON.stringify(ocs) !== JSON.stringify(S.cfg.ocorrencias || {})) await salvarConfig({ ocorrencias: ocs });
  else { await sync.contarPendentes(); sync.sincronizar(); }
}

async function preencherPadrao(datas) {
  const p = horariosPadrao();
  await lancarDias(datas.map((data) => ({ data, horas: p, oc: null })));
}

/* ---------- tela: mês ---------- */
const mesDe = (s) => { const [a, m] = s.split('-').map(Number); return { a, m }; };
const mesStrDe = (d) => `${d.getFullYear()}-${C.pad(d.getMonth() + 1)}`;
const linkMes = (m, v, extra = '') => `#/mes?m=${m}&v=${v}${extra}`;
const lancarHref = (data, v) => `#/lancar?data=${data}&v=${v}`;

function rotuloSaldo(saldo) {
  if (saldo < 0) return `Você está devendo <b class="num">${C.hm(-saldo)}</b> horas`;
  if (saldo > 0) return `Você tem <b class="num">${C.hm(saldo)}</b> horas de crédito`;
  return 'Saldo zerado';
}

function linhaDiaSimples(di, v) {
  const d = di.date;
  const dia = `<div class="dia"><span class="w">${C.DIAS_CURTO[d.getDay()]}</span><span class="n num">${C.pad(d.getDate())}</span></div>`;
  const fds = !S.cfg.dias[d.getDay()];
  if (!di.marcas.length && !di.fer.length && !di.oc && fds) return `<li class="compacto"><span class="num">${C.DIAS_CURTO[d.getDay()]} ${C.pad(d.getDate())}</span><span>Descanso</span></li>`;
  let corpo = '', tot = '—', acao = '';
  if (di.fer.length) corpo += `<span class="h">${esc(di.fer[0].nome)}</span>${tagFeriado(di.fer[0])}`;
  if (di.oc) {
    corpo += `<span class="h">${ROT_OC[di.oc]}</span><span class="s">${di.oc === 'atestado' ? 'Não conta como dívida' : 'Conta como dívida: −' + C.hm(di.esp)}</span>`;
    acao = `<a class="mini-btn sec" href="${lancarHref(di.data, v)}">Editar</a>`;
  } else if (di.marcas.length) {
    const s = di.trab - di.esp;
    const nota = di.ehHoje && !di.conta ? 'Hoje · em andamento' : di.incompleto ? 'Marcação ímpar — falta um horário' : 'Saldo ' + C.saldo(s);
    corpo += `<span class="m num">${di.marcas.map((m) => C.horaDe(m.ts)).join(' · ')}</span><span class="s ${di.incompleto ? 'warn' : s < 0 && di.conta ? 'neg' : s > 0 && di.conta ? 'pos' : ''}">${nota}</span>`;
    tot = C.hm(di.trab);
    acao = `<a class="mini-btn sec" href="${lancarHref(di.data, v)}">Editar</a>`;
  } else if (di.falta) {
    corpo += `<span class="s neg" style="font-weight:600">Sem registro · −${C.hm(di.esp)}</span>`;
    acao = `<a class="mini-btn" href="${lancarHref(di.data, v)}">${ICON.mais}Lançar</a>`;
  } else if (!di.fer.length) {
    corpo += `<span class="s">${di.futuro ? 'Previsto ' + C.hm(di.esp) : di.ehHoje ? 'Hoje · nenhum registro ainda' : 'Antes do início da contagem'}</span>`;
  }
  return `<li class="${di.ehHoje ? 'hoje' : ''} ${di.falta ? 'falta' : ''}">${dia}<div class="info">${corpo}</div><span class="tot num">${tot}</span>${acao}</li>`;
}

function vistaSemanas(r, mesStr, ini, fim) {
  const semanas = [];
  for (let ws = C.inicioSemana(C.parseYmd(ini)); C.ymd(ws) <= fim; ws = C.addDays(ws, 7)) {
    const a = C.ymd(ws) < ini ? ini : C.ymd(ws);
    const we = C.ymd(C.addDays(ws, 6));
    const b = we > fim ? fim : we;
    const dias = r.dias.filter((di) => di.data >= a && di.data <= b);
    let trab = 0, esp = 0, faltas = 0, espTotal = 0;
    dias.forEach((di) => { espTotal += di.esp; if (di.conta) { trab += di.trab; esp += di.esp; } if (di.falta) faltas++; });
    // Pula pedaços de semana sem nada (ex.: só o domingo do dia 1).
    if (!espTotal && !dias.some((d) => d.marcas.length || d.fer.length || d.oc)) continue;
    semanas.push({ espTotal, id: C.ymd(ws), a, b, dias, trab, esp, saldo: trab - esp, faltas, temHoje: dias.some((d) => d.ehHoje), futura: a > hojeStr() });
  }
  if (S.semAberta !== '__nenhuma' && (!S.semAberta || !semanas.some((s) => s.id === S.semAberta))) {
    S.semAberta = (semanas.find((s) => s.faltas) || semanas.find((s) => s.temHoje) || semanas[0]).id;
  }
  return semanas.map((s, i) => {
    const aberta = s.id === S.semAberta;
    const pct = s.esp ? Math.min(100, Math.round((s.trab / s.esp) * 100)) : 0;
    const tag = s.faltas ? `<span class="chip-st neg">${s.faltas} sem registro</span>`
      : s.futura ? '<span class="chip-st">Futura</span>'
        : s.temHoje ? '<span class="chip-st info">Em andamento</span>'
          : s.esp || s.trab ? '<span class="chip-st pos">Completa</span>' : '<span class="chip-st">Sem jornada</span>';
    const rot = `${C.pad(C.parseYmd(s.a).getDate())} – ${C.pad(C.parseYmd(s.b).getDate())} ${C.MESES[C.parseYmd(s.b).getMonth()].slice(0, 3)}`;
    const faltasDatas = s.dias.filter((d) => d.falta).map((d) => d.data).join(',');
    const corpo = aberta ? `<ul class="lista-sem">${s.dias.map((di) => linhaDiaSimples(di, 'semanas')).join('')}</ul>
      ${s.faltas ? `<button type="button" class="btn sec peq" data-action="preencher" data-datas="${faltasDatas}">${ICON.raio} Preencher semana com a jornada padrão</button>` : ''}` : '';
    return `<section class="semana ${aberta ? 'aberta' : ''}">
      <button type="button" class="sem-head" data-action="sem-toggle" data-w="${s.id}" aria-expanded="${aberta}">
        <span class="sem-tit"><span><b>Semana ${i + 1}</b> <span class="muted">${rot}</span></span>${tag}</span>
        <span class="sem-val"><span class="num ${s.saldo < 0 ? 'neg' : s.saldo > 0 ? 'pos' : ''}" style="font-size:16px;font-weight:600">${s.futura ? '—' : C.saldo(s.saldo)}</span><span class="num muted" style="font-size:11px">${s.futura ? 'previsto ' + C.hm(s.espTotal) : C.hm(s.trab) + ' de ' + C.hm(s.esp)}</span></span>
        <span class="seta">${ICON.baixo}</span>
      </button>
      <div class="barra"><div style="width:${pct}%"></div></div>
      ${corpo}
    </section>`;
  }).join('');
}

function vistaDias(r, mesStr) {
  const f = S.q.f || 'todos';
  const lista = r.dias.filter((di) => (f === 'faltas' ? di.falta : f === 'incompletos' ? di.incompleto && di.conta : true));
  const chip = (t) => `<span class="num tchip">${t}</span>`;
  const vazio = '<span class="num tchip vazio">--:--</span>';
  const linhasMob = lista.map((di) => {
    const d = di.date;
    const fds = !S.cfg.dias[d.getDay()];
    const dia = `<div class="dia"><span class="w">${C.DIAS_CURTO[d.getDay()]}</span><span class="n num">${C.pad(d.getDate())}</span></div>`;
    if (di.fer.length && !di.marcas.length) return `<li>${dia}<div class="info"><span class="h">${esc(di.fer[0].nome)}</span>${tagFeriado(di.fer[0])}</div><span class="tot num muted">—</span></li>`;
    if (fds && !di.marcas.length && !di.oc) return `<li class="compacto"><span class="num">${C.DIAS_CURTO[d.getDay()]} ${C.pad(d.getDate())}</span><span>Descanso semanal</span></li>`;
    if (di.oc) return `<li>${dia}<div class="info"><span class="h">${ROT_OC[di.oc]}</span></div><a class="mini-btn sec" href="${lancarHref(di.data, 'dias')}">Editar</a></li>`;
    const hs = di.marcas.slice(0, 4).map((m) => chip(C.horaDe(m.ts)));
    while (hs.length < 4) hs.push(vazio);
    const s = di.trab - di.esp;
    const dir = di.falta ? `<div class="dir"><span class="num neg" style="font-weight:700;font-size:13px">−${C.hm(di.esp)}</span><a class="mini-btn" href="${lancarHref(di.data, 'dias')}">${ICON.mais}Lançar</a></div>`
      : di.marcas.length ? `<div class="dir"><span class="num" style="font-weight:600">${di.ehHoje && !di.conta ? 'em curso' : C.hm(di.trab)}</span>${di.conta ? `<span class="num ${s < 0 ? 'neg' : s > 0 ? 'pos' : 'muted'}" style="font-size:12px;font-weight:600">${C.saldo(s)}</span>` : ''}<a class="link-mini" href="${lancarHref(di.data, 'dias')}">Editar</a></div>`
        : `<div class="dir"><span class="num muted" style="font-size:12px">${di.futuro ? 'previsto' : '—'}</span></div>`;
    return `<li class="${di.falta ? 'falta' : ''} ${di.ehHoje ? 'hoje' : ''}">${dia}<div class="grid4">${hs.join('')}</div>${dir}</li>`;
  }).join('');
  const tdn = (c, cls = '') => `<td class="num c ${cls}">${c}</td>`;
  const linhasDesk = lista.map((di) => {
    const d = di.date;
    const fds = !S.cfg.dias[d.getDay()];
    const ini = `<td class="num"><b>${C.pad(d.getDate())}/${C.pad(d.getMonth() + 1)}</b></td><td class="muted">${C.DIAS_CURTO[d.getDay()]}</td>`;
    const cls = di.falta ? 'falta' : di.ehHoje ? 'hoje' : fds || di.fer.length ? 'fds' : '';
    if (di.fer.length && !di.marcas.length) return `<tr class="${cls}">${ini}<td colspan="4"><span class="fer-inline"><span class="sw" style="background:${corDe(di.fer[0].tipo)}"></span>${esc(di.fer[0].nome)} · feriado ${(TIPOS_FERIADO[di.fer[0].tipo] || {}).nome.toLowerCase()}</span></td>${tdn('—', 'muted')}${tdn('—', 'muted')}${tdn('—', 'muted')}<td></td></tr>`;
    if (fds && !di.marcas.length && !di.oc) return `<tr class="${cls}">${ini}<td colspan="4" class="muted">Descanso semanal</td>${tdn('—', 'muted')}${tdn('—', 'muted')}${tdn('—', 'muted')}<td></td></tr>`;
    if (di.oc) return `<tr class="${cls}">${ini}<td colspan="4"><b>${ROT_OC[di.oc]}</b></td>${tdn('00:00', 'muted')}${tdn(C.hm(di.esp))}${tdn(di.esp ? '−' + C.hm(di.esp) : '+00:00', di.esp ? 'neg' : 'muted')}<td class="r"><a class="mini-btn sec" href="${lancarHref(di.data, 'dias')}">Editar</a></td></tr>`;
    const hs = di.marcas.slice(0, 4).map((m) => tdn(`<b>${C.horaDe(m.ts)}</b>`));
    while (hs.length < 4) hs.push(tdn('--:--', 'muted'));
    const s = di.trab - di.esp;
    const saldoTd = di.conta ? tdn(C.saldo(s), s < 0 ? 'neg' : s > 0 ? 'pos' : 'muted') : tdn('—', 'muted');
    const acao = di.falta ? `<a class="mini-btn" href="${lancarHref(di.data, 'dias')}">${ICON.mais}Lançar</a>` : di.marcas.length ? `<a class="mini-btn sec" href="${lancarHref(di.data, 'dias')}">Editar</a>` : '';
    return `<tr class="${cls}">${ini}${hs.join('')}${tdn(di.ehHoje && !di.conta && di.marcas.length ? 'em curso' : di.marcas.length ? C.hm(di.trab) : '—', di.marcas.length ? '' : 'muted')}${tdn(di.esp ? C.hm(di.esp) : '—', di.esp ? '' : 'muted')}${saldoTd}<td class="r">${acao}</td></tr>`;
  }).join('');
  const fl = (id, t) => `<a role="tab" aria-selected="${f === id}" class="fchip" href="${linkMes(mesStr, 'dias', id === 'todos' ? '' : '&f=' + id)}">${t}</a>`;
  return `<div class="filtros" role="tablist" aria-label="Filtrar dias">${fl('todos', 'Todos')}${fl('faltas', `Sem registro (${r.faltas})`)}${fl('incompletos', `Incompletos (${r.incompletos})`)}</div>
    <div class="so-mobile"><ul class="lista lista-dias">${linhasMob || '<li><span class="vazio">Nenhum dia neste filtro.</span></li>'}</ul></div>
    <div class="so-desk card tabela-wrap"><table class="espelho">
      <thead><tr><th class="l">Data</th><th class="l">Dia</th><th>Entrada</th><th>Saída int.</th><th>Volta</th><th>Saída</th><th>Trabalhado</th><th>Previsto</th><th>Saldo</th><th><span class="sr-only">Ações</span></th></tr></thead>
      <tbody>${linhasDesk || '<tr><td colspan="10" class="muted" style="padding:16px">Nenhum dia neste filtro.</td></tr>'}</tbody>
      <tfoot><tr><td colspan="6"><b>Total contado</b></td>${tdn(`<b>${C.hm(r.trab)}</b>`)}${tdn(`<b>${C.hm(r.esp)}</b>`)}${tdn(`<b>${C.saldo(r.saldo)}</b>`, r.saldo < 0 ? 'neg' : r.saldo > 0 ? 'pos' : '')}<td></td></tr></tfoot>
    </table></div>`;
}

function vistaSaldo(r, mesStr) {
  const { a: ano, m: mes } = mesDe(mesStr);
  const primeiro = new Date(ano, mes - 1, 1);
  const inicio = C.addDays(primeiro, -primeiro.getDay());
  const ult = new Date(ano, mes, 0).getDate();
  const semanas = Math.ceil((primeiro.getDay() + ult) / 7);
  const porData = Object.fromEntries(r.dias.map((d) => [d.data, d]));
  if (!S.mesSel || S.mesSel.slice(0, 7) !== mesStr) S.mesSel = (r.dias.find((d) => d.falta) || r.dias.find((d) => d.ehHoje) || r.dias[0]).data;
  let cels = '';
  for (let i = 0; i < semanas * 7; i++) {
    const d = C.addDays(inicio, i);
    const ds = C.ymd(d);
    const di = porData[ds];
    if (!di) { cels += `<span class="cs fora num">${d.getDate()}</span>`; continue; }
    let cls = 'cs', sub = '', style = '';
    if (di.fer.length && !di.marcas.length) { cls += ' fer'; style = ` style="background:${corDe(di.fer[0].tipo)}"`; sub = 'feriado'; }
    else if (di.oc) { cls += di.oc === 'atestado' ? ' abono' : ' neg'; sub = di.oc === 'atestado' ? 'abono' : di.oc === 'folga' ? 'folga' : 'falta'; }
    else if (di.falta) { cls += ' neg'; sub = '−' + Math.floor(di.esp / 60) + ':' + C.pad(di.esp % 60); }
    else if (di.conta && (di.marcas.length || di.esp)) { const s = di.trab - di.esp; cls += s >= 0 ? ' pos' : ' warn'; sub = (s >= 0 ? '+' : '−') + Math.floor(Math.abs(s) / 60) + ':' + C.pad(Math.abs(s) % 60); }
    else if (!S.cfg.dias[d.getDay()]) cls += ' fds';
    else if (di.ehHoje) sub = 'hoje';
    if (di.ehHoje) cls += ' hoje';
    if (ds === S.mesSel) cls += ' sel';
    cels += `<button type="button" class="${cls}"${style} data-action="mes-dia" data-dia="${ds}" aria-pressed="${ds === S.mesSel}" aria-label="${d.getDate()} de ${C.MESES[d.getMonth()]}${sub ? ', ' + sub : ''}"><span class="n num">${d.getDate()}</span><span class="sb num">${sub}</span></button>`;
  }
  const di = porData[S.mesSel];
  const dS = di.date;
  let det = `<span class="k">${C.DIAS[dS.getDay()]}, ${dS.getDate()} de ${C.MESES[dS.getMonth()]}</span>`;
  if (di.fer.length) det += `<span class="t">${esc(di.fer[0].nome)}</span>${tagFeriado(di.fer[0])}`;
  if (di.oc) det += `<span class="t">${ROT_OC[di.oc]}</span>`;
  else if (di.falta) det += `<span class="t neg">Sem registro · −${C.hm(di.esp)}</span>`;
  else if (di.marcas.length) det += `<span class="t">${di.marcas.map((m) => C.horaDe(m.ts)).join(' · ')}</span><span class="x">Trabalhado ${C.hm(di.trab)}${di.conta ? ' · saldo ' + C.saldo(di.trab - di.esp) : ''}</span>`;
  else if (!di.fer.length) det += `<span class="t">${di.futuro ? 'Previsto ' + C.hm(di.esp) : 'Sem jornada prevista'}</span>`;
  const podeLancar = !di.futuro;
  det += podeLancar ? `<div class="duas">${di.falta ? `<button type="button" class="btn sec peq" data-action="preencher" data-datas="${di.data}">Jornada padrão</button>` : '<span></span>'}<a class="btn peq" href="${lancarHref(di.data, 'saldo')}">${di.marcas.length || di.oc ? 'Editar horários' : 'Lançar horários'}</a></div>` : '';
  const leg = (c, t) => `<span><span class="sw" style="background:${c}"></span>${t}</span>`;
  return `<div class="cols"><div class="col">
    <section class="card s" aria-label="Calendário de saldo" style="gap:8px;padding:14px 12px">
      <div class="semana-h" aria-hidden="true"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div>
      <div class="grade-saldo">${cels}</div>
    </section>
    <section class="legenda" aria-label="Legenda">${leg('var(--ok-bg)', 'Completo / positivo')}${leg('var(--warn-bg)', 'Saldo negativo')}${leg('var(--err-bg)', 'Sem registro / falta')}${leg('#1D4ED8', 'Feriado')}</section>
  </div><div class="col">
    <section class="card s det" aria-label="Dia selecionado" style="gap:10px">${det}</section>
  </div></div>`;
}

function telaMes() {
  const hoje = hojeStr();
  const mq = S.q.m || (S.q.data ? S.q.data.slice(0, 7) : '');
  const mesStr = /^\d{4}-\d{2}$/.test(mq) ? mq : hoje.slice(0, 7);
  const v = ['semanas', 'dias', 'saldo'].includes(S.q.v) ? S.q.v : 'semanas';
  const { a: ano, m: mes } = mesDe(mesStr);
  const ult = new Date(ano, mes, 0).getDate();
  const ini = `${mesStr}-01`, fim = `${mesStr}-${C.pad(ult)}`;
  const r = resumoPeriodo(ini, fim, feriadosMapa([ano]));
  const prev = mesStrDe(new Date(ano, mes - 2, 1)), next = mesStrDe(new Date(ano, mes, 1));
  const inicio = inicioContagem();
  const atual = mesStr === hoje.slice(0, 7);
  const ontem = C.addDays(C.parseYmd(hoje), -1);
  const quando = atual ? `Saldo até ontem (${C.pad(ontem.getDate())}/${C.pad(ontem.getMonth() + 1)})` : mesStr < hoje.slice(0, 7) ? 'Saldo do mês' : 'Mês futuro';
  const pct = r.esp ? Math.min(100, Math.round((r.trab / r.esp) * 100)) : 0;
  const todasFaltas = r.dias.filter((d) => d.falta).map((d) => d.data);
  const aviso = !inicio
    ? `<a class="aviso-card" href="#/cadastro">Cadastre a <b>data de admissão</b> para o saldo contar desde o início do trabalho.</a>`
    : !S.cfg.admissao ? `<a class="aviso-card" href="#/cadastro">Contando desde ${C.brDate(inicio)} (mês do primeiro registro). Defina a <b>data de admissão</b> em Cadastro para ajustar.</a>` : '';
  const vbtn = (id, t) => `<a role="tab" aria-selected="${v === id}" href="${linkMes(mesStr, id)}">${t}</a>`;
  const corpo = v === 'dias' ? vistaDias(r, mesStr) : v === 'saldo' ? vistaSaldo(r, mesStr) : `<div class="semanas">${vistaSemanas(r, mesStr, ini, fim)}</div>`;
  return `
  <header class="top">
    <h1>Mês</h1>
    <div class="mes-nav">
      <a class="nav-btn" href="${linkMes(prev, v)}" aria-label="Mês anterior">${ICON.esq}</a>
      <span class="display" style="text-transform:capitalize;font-weight:600;min-width:130px;text-align:center">${C.MESES[mes - 1]} ${ano}</span>
      <a class="nav-btn" href="${linkMes(next, v)}" aria-label="Próximo mês">${ICON.dir}</a>
    </div>
  </header>
  <div class="cols mes-topo"><div class="col">
    <section class="card saldo-card" aria-label="Saldo do mês">
      <div style="display:flex;flex-direction:column;gap:2px">
        <span class="muted" style="font-size:13px">${quando}</span>
        <span class="num saldo-grande ${r.saldo < 0 ? 'neg' : r.saldo > 0 ? 'pos' : ''}">${C.saldo(r.saldo)}</span>
        <span style="font-size:13px;color:var(--text-2)">${rotuloSaldo(r.saldo)}</span>
      </div>
      <div class="barra grossa"><div style="width:${pct}%"></div></div>
      <div class="kpi3">
        <div><span class="muted">Trabalhado</span><b class="num">${C.hm(r.trab)}</b></div>
        <div><span class="muted">Previsto</span><b class="num">${C.hm(r.esp)}</b></div>
        <div><span class="muted">Sem registro</span><b class="num ${r.faltas ? 'neg' : ''}">${r.faltas} dia${r.faltas === 1 ? '' : 's'}</b></div>
      </div>
    </section>
  </div><div class="col acoes-mes">
    ${aviso}
    <div class="admin-mes">${painelAdmin('mes')}</div>
    ${todasFaltas.length ? `<button type="button" class="btn peq" data-action="preencher" data-datas="${todasFaltas.join(',')}">${ICON.raio} Preencher ${todasFaltas.length} dia${todasFaltas.length === 1 ? '' : 's'} sem registro com a jornada padrão</button>
    <p class="dica" style="color:var(--muted);margin:0">${horariosPadrao().join(' · ')}. Depois ajuste os dias diferentes ou marque falta / atestado.</p>` : r.esp ? '<p class="dica" style="margin:0">Nenhum dia sem registro neste mês.</p>' : ''}
  </div></div>
  <nav class="vistas" role="tablist" aria-label="Forma de visualizar">${vbtn('semanas', 'Semanas')}${vbtn('dias', 'Dia a dia')}${vbtn('saldo', 'Calendário de saldo')}</nav>
  <div class="mes-corpo">${corpo}</div>`;
}

/* ---------- folha: lançar horários do dia ---------- */
function folhaLancar() {
  const data = /^\d{4}-\d{2}-\d{2}$/.test(S.q.data || '') ? S.q.data : hojeStr();
  const v = S.q.v || 'semanas';
  const d = C.parseYmd(data);
  const marcas = marcasDoDia(data);
  if (S.form.lancarKey !== data) {
    const hs = marcas.length ? marcas.slice(0, 4).map((m) => C.horaDe(m.ts)) : horariosPadrao();
    while (hs.length < 4) hs.push('');
    S.form = { lancarKey: data, tipo: ocorrencia(data) || 'trabalhado', h: hs, erro: '' };
  }
  const F = S.form;
  const admin = adminAtivo();
  const prevD = C.ymd(C.addDays(d, -1)), nextD = C.ymd(C.addDays(d, 1));
  const futuro = data > hojeStr();
  const tipos = [['trabalhado', 'Trabalhado'], ['falta', 'Falta'], ['atestado', 'Atestado / abono'], ['folga', 'Folga compensada']]
    .map(([id, t]) => `<button type="button" class="chip pill-chip" role="radio" aria-checked="${F.tipo === id}" data-action="lanc-tipo" data-t="${id}">${t}</button>`).join('');
  const rot = ['Entrada', 'Início do intervalo', 'Fim do intervalo', 'Saída'];
  const campos = F.h.map((h, i) => `<label class="campo">${rot[i]}<input type="time" class="num grande" value="${h}" data-field="lh" data-i="${i}"></label>`).join('');
  const desc = { falta: 'O dia conta como dívida da jornada prevista.', atestado: 'O dia não conta como dívida (abonado).', folga: 'Usa o banco de horas: conta como dívida da jornada prevista.' };
  return `
  <div class="folha-bg" data-action="fechar-folha-bg">
    <section class="folha" role="dialog" aria-modal="true" aria-labelledby="ld">
      <span class="alca" aria-hidden="true"></span>
      <div class="cab">
        <a class="icon-btn" style="background:var(--surface-2)" href="${lancarHref(prevD, v)}" aria-label="Dia anterior">${ICON.esq}</a>
        <div style="display:flex;flex-direction:column;align-items:center;text-align:center"><span class="muted" style="font-size:12px">Lançar horários</span><h1 id="ld" class="display" style="font-size:19px">${C.DIAS[d.getDay()]}, ${d.getDate()} de ${C.MESES[d.getMonth()]}</h1></div>
        <a class="icon-btn" style="background:var(--surface-2)" href="${lancarHref(nextD, v)}" aria-label="Próximo dia">${ICON.dir}</a>
      </div>
      ${admin ? '' : `<div class="admin-lanc">${painelAdmin('lanc')}</div>`}
      ${futuro ? '<p class="msg erro" style="margin:0">Este dia ainda não chegou — lançamentos só para hoje ou dias anteriores.</p>' : ''}
      <form data-form="lancar" style="display:flex;flex-direction:column;gap:14px" novalidate>
        <div role="radiogroup" aria-label="Tipo do dia" class="tipos-dia">${tipos}</div>
        ${F.tipo === 'trabalhado' ? `<div class="duas">${campos}</div>
        <div style="display:flex;gap:6px">
          <button type="button" class="btn sec peq" data-action="lanc-padrao">Jornada padrão</button>
          <button type="button" class="btn sec peq" data-action="lanc-copiar">Copiar dia anterior</button>
        </div>
        <div class="linha-info"><span style="color:var(--text-2)">Total do dia</span><span class="num" style="font-weight:600" data-out="lanc-total">${totalLancamento()}</span></div>`
    : `<p class="linha-info" style="margin:0">${desc[F.tipo]}</p>`}
        <p class="msg erro" data-out="lanc-erro" role="alert">${esc(F.erro || '')}</p>
        <div class="duas">
          <button type="submit" name="acao" value="salvar" class="btn sec" ${admin && !futuro ? '' : 'disabled'}>Salvar</button>
          <button type="submit" name="acao" value="proximo" class="btn" ${admin && !futuro ? '' : 'disabled'} style="line-height:1.2;padding:0 8px">Salvar e próximo sem registro</button>
        </div>
        ${(marcas.length || ocorrencia(data)) && admin ? '<button type="button" class="link-btn" data-action="lanc-limpar" style="align-self:center">Limpar este dia</button>' : ''}
        <a class="link-btn" style="align-self:center;color:var(--muted);text-decoration:none" href="${linkMes(data.slice(0, 7), v)}">Voltar ao mês</a>
      </form>
    </section>
  </div>`;
}

function totalLancamento() {
  const hs = S.form.h.filter(Boolean).map(C.toMin);
  let t = 0;
  for (let i = 0; i + 1 < hs.length; i += 2) t += Math.max(0, hs[i + 1] - hs[i]);
  const d = C.parseYmd(S.form.lancarKey);
  const esp = C.esperado(S.cfg, d, feriadosMapa([d.getFullYear()])[S.form.lancarKey]);
  return `${C.hm(t)} · saldo ${C.saldo(t - esp)}`;
}

function validarHoras(hs) {
  if (hs.length < 2) return 'Informe pelo menos entrada e saída.';
  if (hs.length % 2) return 'Os horários precisam formar pares (entrada/saída). Deixe vazio só o par do intervalo.';
  for (let i = 1; i < hs.length; i++) if (C.toMin(hs[i]) <= C.toMin(hs[i - 1])) return 'Os horários precisam estar em ordem crescente.';
  return '';
}

function proximaFalta(depoisDe) {
  const mesStr = depoisDe.slice(0, 7);
  const r = resumoMes(mesStr);
  const faltas = r.dias.filter((d) => d.falta).map((d) => d.data);
  return faltas.find((x) => x > depoisDe) || faltas[0] || null;
}

async function salvarLancamento(proximo) {
  const F = S.form;
  const data = F.lancarKey;
  const v = S.q.v || 'semanas';
  if (!adminAtivo()) return;
  let horas = [];
  if (F.tipo === 'trabalhado') {
    horas = F.h.filter(Boolean);
    const erro = validarHoras(horas);
    if (erro) { F.erro = erro; document.querySelector('[data-out="lanc-erro"]').textContent = erro; return; }
  }
  await lancarDias([{ data, horas, oc: F.tipo === 'trabalhado' ? null : F.tipo }]);
  const d = C.parseYmd(data);
  toast(`${d.getDate()}/${C.pad(d.getMonth() + 1)} salvo.`);
  if (proximo) {
    const n = proximaFalta(data);
    if (n) { location.hash = lancarHref(n, v); return; }
    toast('Nenhum outro dia sem registro neste mês.');
  }
  location.hash = linkMes(data.slice(0, 7), v);
}

/* ---------- roteamento e render ---------- */
function lerRota() {
  let h = location.hash.replace(/^#/, '') || '/';
  if (!h.startsWith('/')) h = '/';
  const [path, qs] = h.split('?');
  S.rota = path;
  S.q = Object.fromEntries(new URLSearchParams(qs || ''));
}

function render() {
  if (!S.cfg) return;
  let html;
  let aba = 'inicio';
  if (S.rota === '/calendario') { html = telaCalendario(); aba = 'calendario'; }
  else if (S.rota === '/mes') { html = telaMes(); aba = 'mes'; }
  else if (S.rota === '/lancar') { html = telaMes() + folhaLancar(); aba = 'mes'; }
  else if (S.rota === '/feriado') { html = telaCalendario() + folhaFeriado(); aba = 'calendario'; }
  else if (S.rota === '/cadastro') { html = telaCadastro(); aba = 'cadastro'; }
  else html = telaInicio();
  $view.innerHTML = html;
  document.querySelectorAll('.tabbar a').forEach((a) => {
    if (a.dataset.tab === aba) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

let ultimaRota = '';
window.addEventListener('hashchange', () => {
  lerRota();
  const folhas = ['/feriado', '/lancar'];
  if (!folhas.includes(S.rota)) S.form = {};
  const mesmaTela = (S.rota === ultimaRota) || (folhas.includes(S.rota) || folhas.includes(ultimaRota));
  if (!mesmaTela) window.scrollTo(0, 0);
  ultimaRota = S.rota;
  S.confirmarRemocao = null;
  S.nuvemMsg = null;
  render();
  if (S.rota === '/cadastro' && S.q.s === 'nuvem') document.getElementById('nuvem')?.scrollIntoView({ block: 'start' });
});

/* ---------- eventos ---------- */
const fecharFolha = () => {
  if (S.rota === '/lancar') { location.hash = linkMes((S.q.data || hojeStr()).slice(0, 7), S.q.v || 'semanas'); return; }
  location.hash = '#/calendario?m=' + (S.q.data || hojeStr()).slice(0, 7);
};
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && (S.rota === '/feriado' || S.rota === '/lancar')) fecharFolha(); });
document.addEventListener('click', async (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'fechar-folha-bg') { if (ev.target === el) fecharFolha(); return; }
  switch (a) {
    case 'registrar': await registrar(); break;
    case 'sync': S.nuvemMsg = null; await sync.sincronizar(); if (sync.estado.erro === '' && S.rota === '/cadastro') S.nuvemMsg = { ok: true, txt: 'Tudo sincronizado.' }; render(); break;
    case 'alternar-tema': definirTema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); break;
    case 'tema': definirTema(el.dataset.v); break;
    case 'atualizar-app': if (S.swEspera) { atualizando = true; S.swEspera.postMessage('skipWaiting'); } break;
    case 'sem-toggle': S.semAberta = S.semAberta === el.dataset.w ? '__nenhuma' : el.dataset.w; render(); break;
    case 'mes-dia': S.mesSel = el.dataset.dia; render(); break;
    case 'preencher': {
      if (!adminAtivo()) { S.pedirSenha = true; S.adminMsg = { ok: false, txt: 'Desbloqueie o modo administrador para lançar horários.' }; render(); document.querySelector('[data-form="admin"] input')?.focus(); break; }
      const datas = el.dataset.datas.split(',').filter(Boolean);
      await preencherPadrao(datas);
      toast(`${datas.length} dia${datas.length === 1 ? '' : 's'} preenchido${datas.length === 1 ? '' : 's'} com a jornada padrão.`);
      render();
      break;
    }
    case 'lanc-tipo': S.form.tipo = el.dataset.t; S.form.erro = ''; render(); break;
    case 'lanc-padrao': S.form.h = horariosPadrao(); S.form.erro = ''; render(); break;
    case 'lanc-copiar': {
      let d = C.parseYmd(S.form.lancarKey);
      let achou = null;
      for (let k = 0; k < 31 && !achou; k++) { d = C.addDays(d, -1); const m = marcasDoDia(C.ymd(d)); if (m.length >= 2) achou = m; }
      if (!achou) { toast('Nenhum dia anterior com horários.'); break; }
      const hs = achou.slice(0, 4).map((m) => C.horaDe(m.ts)); while (hs.length < 4) hs.push('');
      S.form.h = hs; S.form.erro = ''; render(); break;
    }
    case 'lanc-limpar':
      if (!adminAtivo()) break;
      await lancarDias([{ data: S.form.lancarKey, horas: [], oc: null }]);
      toast('Dia limpo.');
      S.form = {};
      render();
      break;
    case 'cal-dia': S.calSel = el.dataset.dia; S.confirmarRemocao = null; render(); break;
    case 'pedir-admin': S.pedirSenha = true; S.adminMsg = null; render(); document.querySelector('[data-form="admin"] input')?.focus(); break;
    case 'cancelar-admin': S.pedirSenha = false; S.adminMsg = null; render(); break;
    case 'bloquear-admin': bloquearAdmin(); render(); toast('Modo administrador bloqueado.'); break;
    case 'editar-reg': if (adminAtivo()) { S.editando = el.dataset.id; S.confirmarRemocao = null; render(); document.querySelector('[data-form="editar"] input')?.focus(); } break;
    case 'cancelar-edicao': S.editando = null; render(); break;
    case 'limpar-registros': {
      if (!adminAtivo()) break;
      if (!S.confirmarLimpeza) { S.confirmarLimpeza = true; render(); break; }
      S.confirmarLimpeza = false;
      const ativos = S.registros.filter((r) => !r.removido);
      const ts = agora().toISOString();
      ativos.forEach((r) => Object.assign(r, { removido: true, atualizado_em: ts, sync: 'pendente' }));
      await db.putMany('registros', ativos);
      await sync.contarPendentes();
      sync.sincronizar();
      toast(`${ativos.length} registro${ativos.length === 1 ? '' : 's'} removido${ativos.length === 1 ? '' : 's'}.`);
      render();
      break;
    }
    case 'remover-reg':
      if (!adminAtivo()) break;
      if (S.confirmarRemocao === el.dataset.id) { S.confirmarRemocao = null; await removerRegistro(el.dataset.id); toast('Marcação removida.'); }
      else S.confirmarRemocao = el.dataset.id;
      render(); break;
    case 'fechar-folha': fecharFolha(); break;
    case 'fer-tipo': S.form.tipo = el.dataset.tipo; render(); break;
    case 'fer-rec': S.form.recorrente = !S.form.recorrente; render(); break;
    case 'fer-remover': await removerFeriado(); break;
    case 'regime': await salvarConfig({ regime: el.dataset.id }); S.form = {}; render(); break;
    case 'intervalo': await salvarConfig({ intervalo: Number(el.dataset.v) }); render(); break;
    case 'dia': { const d = S.cfg.dias.slice(); d[+el.dataset.i] = !d[+el.dataset.i]; if (!d.some(Boolean)) { toast('Mantenha ao menos um dia de trabalho.'); break; } await salvarConfig({ dias: d }); render(); break; }
    case 'modo': {
      S.form.modo = el.dataset.m;
      const sal = C.salarioVigente(S.cfg);
      S.form.valor = C.num2(S.form.modo === 'salario' ? sal : Math.round((sal / C.divisor(S.cfg)) * 100) / 100);
      render(); break;
    }
    case 'preset': {
      const sal = C.salarioVigente(S.cfg);
      const base = S.form.modo === 'salario' ? sal : sal / C.divisor(S.cfg);
      S.form.valor = C.num2(base * (1 + Number(el.dataset.p) / 100));
      const inp = document.querySelector('[data-field="valor"]');
      if (inp) inp.value = S.form.valor;
      document.querySelector('[data-out="previa"]').innerHTML = previaReajuste();
      break;
    }
    case 'editar-conexao': S.editarConexao = true; render(); break;
    case 'criar-conta': await acaoConta('criar'); break;
    case 'sair': await sync.sair(); S.nuvemMsg = { ok: true, txt: 'Você saiu. Os dados continuam salvos neste aparelho.' }; render(); break;
    case 'exportar': exportar(); break;
  }
});

document.addEventListener('input', (ev) => {
  const f = ev.target.dataset && ev.target.dataset.field;
  if (!f) return;
  if (f === 'valor') { S.form.valor = ev.target.value; document.querySelector('[data-out="previa"]').innerHTML = previaReajuste(); }
  if (f === 'vigencia') S.form.vigencia = ev.target.value;
  if (f === 'lh') {
    S.form.h[+ev.target.dataset.i] = ev.target.value;
    const out = document.querySelector('[data-out="lanc-total"]');
    if (out) out.textContent = totalLancamento();
  }
  if (f === 'fer-nome') S.form.nome = ev.target.value;
  if (f === 'fer-data') {
    S.form.data = ev.target.value;
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(ev.target.value) ? ev.target.value : null;
    const out = document.querySelector('[data-out="dow"]');
    if (out) out.value = iso ? C.DIAS[C.parseYmd(iso).getDay()] : '—';
  }
});

document.addEventListener('change', async (ev) => {
  const k = ev.target.dataset && ev.target.dataset.cfg;
  if (!k) return;
  let v = ev.target.value;
  if (k === 'admissao') {
    if (v.trim() === '') v = '';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) { toast('Escolha a data de admissão no calendário.'); return; }
  }
  if (k === 'semanalPJ') v = Math.min(70, Math.max(1, Number(v) || 40));
  if (k === 'entrada' && !/^\d{2}:\d{2}$/.test(v)) return;
  await salvarConfig({ [k]: v });
  if (k === 'entrada' || k === 'semanalPJ') render();
  else toast('Cadastro salvo.');
});

document.addEventListener('submit', async (ev) => {
  const form = ev.target;
  const tipo = form.dataset.form;
  if (!tipo) return;
  ev.preventDefault();
  if (tipo === 'lancar') {
    await salvarLancamento(ev.submitter && ev.submitter.value === 'proximo');
    return;
  }
  if (tipo === 'admin') {
    S.ocupado = true;
    const ok = await conferirSenha(form.senha.value);
    S.ocupado = false;
    if (ok) { desbloquearAdmin(); toast(`Modo administrador liberado por ${ADMIN_MINUTOS} minutos.`); }
    else { await new Promise((r) => setTimeout(r, 800)); S.adminMsg = { ok: false, txt: 'Senha incorreta.' }; }
    render();
    if (!ok) document.querySelector('[data-form="admin"] input')?.focus();
    return;
  }
  if (tipo === 'definir-admin' || tipo === 'trocar-admin') {
    if (tipo === 'trocar-admin' && !adminAtivo()) return;
    const nova = form.nova.value, rep2 = form.repetir.value;
    if (nova.length < 4) { S.adminMsg = { ok: false, txt: 'Use pelo menos 4 caracteres.' }; render(); return; }
    if (nova !== rep2) { S.adminMsg = { ok: false, txt: 'As senhas não conferem.' }; render(); return; }
    const h = await hashSenha(nova);
    await salvarConfig({ adminHash: h.hash, adminSalt: h.salt });
    desbloquearAdmin();
    S.adminMsg = { ok: true, txt: tipo === 'definir-admin' ? 'Senha definida. Modo administrador liberado.' : 'Senha trocada.' };
    render();
    return;
  }
  if (tipo === 'editar') {
    if (!adminAtivo() || !S.editando) return;
    const hora = form.hora.value;
    if (!hora) return;
    await removerRegistro(S.editando);
    await incluirManual(S.calSel, hora);
    S.editando = null;
    toast('Horário alterado.');
    render();
    return;
  }
  if (tipo === 'manual') {
    if (!adminAtivo()) return;
    const hora = form.hora.value;
    if (!hora) return;
    await incluirManual(S.calSel, hora);
    toast('Marcação incluída.');
    render();
  } else if (tipo === 'feriado') {
    await salvarFeriado();
  } else if (tipo === 'reajuste') {
    const erro = document.querySelector('[data-out="reaj-erro"]');
    const r = calcReajuste();
    const vig = /^\d{4}-\d{2}-\d{2}$/.test(S.form.vigencia || '') ? S.form.vigencia : null;
    if (!(r.novoSal > 0)) { erro.textContent = 'Informe um valor maior que zero.'; return; }
    if (!vig) { erro.textContent = 'Escolha a data de vigência.'; return; }
    const historico = S.cfg.historico.filter((h) => h.vigencia !== vig).concat({
      vigencia: vig, salario: Math.round(r.novoSal * 100) / 100,
      motivo: S.form.modo === 'hora' ? 'Reajuste pelo valor hora' : 'Reajuste pelo salário'
    });
    await salvarConfig({ historico });
    S.form = {};
    toast(vig > hojeStr() ? `Reajuste agendado para ${C.brDate(vig)}.` : 'Reajuste aplicado.');
    render();
  } else if (tipo === 'conexao') {
    const url = form.url.value.trim();
    const key = form.key.value.trim();
    if (!/^(https:\/\/.+|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)/.test(url) || key.length < 20) { S.nuvemMsg = { ok: false, txt: 'Confira a URL (https://…supabase.co) e a chave anon.' }; render(); return; }
    await sync.salvarConexao(url, key);
    S.editarConexao = false;
    S.nuvemMsg = { ok: true, txt: 'Conexão salva. Agora entre ou crie sua conta.' };
    render();
  } else if (tipo === 'login') {
    await acaoConta('entrar');
  }
});

async function acaoConta(tipo) {
  const form = document.querySelector('[data-form="login"]');
  const email = form.email.value.trim();
  const senha = form.senha.value;
  if (!email || senha.length < 6) { S.nuvemMsg = { ok: false, txt: 'Informe e-mail e senha (mínimo 6 caracteres).' }; render(); return; }
  S.ocupado = true; S.nuvemMsg = null; render();
  try {
    if (tipo === 'criar') {
      const r = await sync.criarConta(email, senha);
      S.nuvemMsg = r.confirmar
        ? { ok: true, txt: 'Conta criada. Confirme pelo link enviado ao seu e-mail e depois toque em Entrar.' }
        : { ok: true, txt: 'Conta criada e conectada.' };
      if (!r.confirmar) await sync.sincronizar();
    } else {
      await sync.entrar(email, senha);
      S.nuvemMsg = { ok: true, txt: 'Conectado. Seus registros foram sincronizados.' };
    }
  } catch (e) {
    const m = String(e.message || e);
    S.nuvemMsg = { ok: false, txt: /invalid login/i.test(m) ? 'E-mail ou senha incorretos.' : /not confirmed/i.test(m) ? 'Confirme seu e-mail pelo link recebido antes de entrar.' : e instanceof TypeError ? 'Sem conexão com o servidor. Tente quando estiver online.' : 'Não foi possível: ' + m };
  } finally {
    S.ocupado = false;
    render();
  }
}

function exportar() {
  const dados = { exportado_em: new Date().toISOString(), config: S.cfg, registros: S.registros, feriados: S.feriados };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ponto-backup-${hojeStr()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ---------- relógio ao vivo ---------- */
let ultimoMinuto = -1;
setInterval(() => {
  if (S.rota !== '/' && S.rota !== '') return;
  const now = agora();
  if (now.getMinutes() !== ultimoMinuto) {
    ultimoMinuto = now.getMinutes();
    if (!document.activeElement || document.activeElement === document.body || document.activeElement.closest('.tabbar') || document.activeElement === $view) render();
  }
  const hm = document.querySelector('[data-clock="hm"]');
  const s = document.querySelector('[data-clock="s"]');
  if (hm) hm.textContent = `${C.pad(now.getHours())}:${C.pad(now.getMinutes())}`;
  if (s) s.textContent = ':' + C.pad(now.getSeconds());
}, 1000);

/* ---------- service worker (offline) ---------- */
let atualizando = false;
function registrarSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    const avisar = (w) => { if (w && navigator.serviceWorker.controller) { S.swEspera = w; render(); } };
    avisar(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w && w.addEventListener('statechange', () => { if (w.state === 'installed') avisar(w); });
    });
    setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
  }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (atualizando) location.reload(); });
}

/* ---------- início ---------- */
(async function iniciar() {
  aplicarTema();
  lerRota();
  ultimaRota = S.rota;
  await carregar();
  sync.ligar({
    getConfig: async () => S.cfg,
    setConfigRemota: async (dados) => { S.cfg = { ...C.CONFIG_PADRAO, ...dados }; await db.setKV('config', S.cfg); },
    aoReceber: async () => { await carregar(); render(); }
  });
  sync.aoMudar(() => {
    // Atualiza só a faixa de conexão (e a seção da nuvem) sem redesenhar a tela inteira.
    const faixa = document.querySelector('.net');
    if (faixa) faixa.outerHTML = faixaConexao();
    const nuvem = document.getElementById('nuvem');
    if (nuvem && !nuvem.contains(document.activeElement)) nuvem.outerHTML = secaoNuvem();
  });
  await sync.iniciar();
  const link = await sync.sessaoDoLink();
  if (link) { lerRota(); ultimaRota = S.rota; S.nuvemMsg = { ok: link.ok, txt: link.msg }; }
  render();
  if (link) document.getElementById('nuvem')?.scrollIntoView({ block: 'start' });
  registrarSW();
  sync.sincronizar();
})();
