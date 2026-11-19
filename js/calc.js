// Datas, jornada, saldo e remuneração.
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const brDate = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
export const fromBrDate = (s) => {
  const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 ? ymd(d) : null;
};

export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const DIAS_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Duração em minutos → "08:48" (sem sinal). */
export const hm = (min) => { min = Math.max(0, Math.round(min)); return pad(Math.floor(min / 60)) + ':' + pad(min % 60); };
/** Saldo em minutos → "+00:11" / "-00:03". */
export const saldo = (min) => { min = Math.round(min); return (min < 0 ? '-' : '+') + hm(Math.abs(min)); };
/** Duração curta → "8h48", "1h", "30min". */
export const curto = (min) => (min < 60 ? `${min}min` : `${Math.floor(min / 60)}h${min % 60 ? pad(min % 60) : ''}`);
export const horaDe = (iso) => { const d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
export const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const fromMin = (m) => pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);

export const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const num2 = (v) => (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const parseBr = (s) => { const n = parseFloat(String(s).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };

export const REGIMES = [
  { id: 'clt44', nome: 'CLT · 44h semanais', desc: 'Jornada padrão (art. 58 da CLT)', semanal: 44 },
  { id: 'clt40', nome: 'CLT · 40h semanais', desc: '8h por dia, segunda a sexta', semanal: 40 },
  { id: 'j36', nome: 'Jornada 36h', desc: 'Comum em saúde e serviços', semanal: 36 },
  { id: 'mp30', nome: 'Meio período · 30h', desc: 'Tempo parcial (art. 58-A da CLT)', semanal: 30 },
  { id: 'est30', nome: 'Estágio · 30h', desc: 'Bolsa-estágio (Lei 11.788/2008)', semanal: 30 },
  { id: 'pj', nome: 'PJ / Horista', desc: 'Prestação de serviço por hora', semanal: null }
];

export const CONFIG_PADRAO = {
  nome: '',
  cargo: '',
  admissao: '',
  regime: 'clt44',
  semanalPJ: 40,
  dias: [false, true, true, true, true, true, false],
  entrada: '08:00',
  intervalo: 60,
  historico: [{ vigencia: '2000-01-01', salario: 2500, motivo: 'Salário inicial' }],
  tema: 'auto',
  adminHash: '',
  adminSalt: '',
  atualizado_em: '1970-01-01T00:00:00.000Z'
};

export const regimeDe = (cfg) => REGIMES.find((r) => r.id === cfg.regime) || REGIMES[0];
export const semanal = (cfg) => (cfg.regime === 'pj' ? Number(cfg.semanalPJ) || 40 : regimeDe(cfg).semanal);
/** Divisor mensal: horas semanais × 5 (44h → 220h). */
export const divisor = (cfg) => semanal(cfg) * 5;
export const diasTrabalho = (cfg) => cfg.dias.filter(Boolean).length || 1;
export const cargaDiaria = (cfg) => Math.round((semanal(cfg) * 60) / diasTrabalho(cfg));
export const saidaPrevista = (cfg) => fromMin(toMin(cfg.entrada) + cargaDiaria(cfg) + Number(cfg.intervalo));

/** Intervalo mínimo do art. 71 da CLT conforme a carga diária. */
export function avaliarIntervalo(cfg) {
  const carga = cargaDiaria(cfg);
  const iv = Number(cfg.intervalo);
  if (carga > 360) {
    if (iv < 60) return { ok: false, msg: 'Para jornada acima de 6h, a CLT exige intervalo de no mínimo 1h.' };
    if (iv > 120) return { ok: false, msg: 'Intervalo acima de 2h exige acordo escrito ou convenção coletiva.' };
    return { ok: true, msg: `Dentro do previsto no art. 71 da CLT para jornada de ${curto(carga)}.` };
  }
  if (carga > 240 && iv < 15) return { ok: false, msg: 'Para jornada entre 4h e 6h, a CLT exige intervalo de 15min.' };
  return { ok: true, msg: `Dentro do previsto no art. 71 da CLT para jornada de ${curto(carga)}.` };
}

export function salarioVigente(cfg, data = ymd(new Date())) {
  const h = [...cfg.historico].sort((a, b) => a.vigencia.localeCompare(b.vigencia));
  let atual = h[0];
  for (const item of h) if (item.vigencia <= data) atual = item;
  return atual ? Number(atual.salario) : 0;
}
export const valorHora = (cfg, data) => salarioVigente(cfg, data) / divisor(cfg);

export const TIPOS = ['Entrada', 'Início do intervalo', 'Fim do intervalo', 'Saída'];
export const tipoPorOrdem = (i) => (i < 4 ? TIPOS[i] : i % 2 === 0 ? 'Entrada extra' : 'Saída extra');

/** Minutos trabalhados no dia a partir das marcações (pares entrada/saída). */
export function trabalhado(marks, agoraMs, ehHoje) {
  const ts = marks.map((m) => new Date(m.ts).getTime()).sort((a, b) => a - b);
  let total = 0;
  for (let i = 0; i < ts.length; i += 2) {
    const fim = ts[i + 1] !== undefined ? ts[i + 1] : ehHoje ? agoraMs : null;
    if (fim !== null) total += Math.max(0, fim - ts[i]);
  }
  return { min: Math.floor(total / 60000), aberto: ts.length % 2 === 1 };
}

/** Minutos esperados no dia: 0 em feriado ou dia sem jornada. */
export const esperado = (cfg, date, feriadosDoDia) =>
  feriadosDoDia && feriadosDoDia.length ? 0 : cfg.dias[date.getDay()] ? cargaDiaria(cfg) : 0;

export const inicioSemana = (d) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
