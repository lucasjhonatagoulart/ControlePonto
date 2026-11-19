// Feriados: nacionais calculados automaticamente + os cadastrados pelo usuário.
import { pad, ymd, addDays } from './calc.js';

export const TIPOS_FERIADO = {
  federal: { nome: 'Federal', dica: 'Nacional, por lei', cor: '#1D4ED8' },
  estadual: { nome: 'Estadual', dica: 'Lei do estado', cor: '#0F766E' },
  municipal: { nome: 'Municipal', dica: 'Lei da cidade', cor: '#C2410C' },
  religioso: { nome: 'Religioso', dica: 'Data religiosa', cor: '#7C3AED' },
  mundial: { nome: 'Mundial', dica: 'Data internacional', cor: '#BE185D' }
};

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function pascoa(ano) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

// Feriados nacionais (Lei 662/1949, Lei 6.802/1980, Lei 14.759/2023 e outras).
// Carnaval e Corpus Christi são ponto facultativo no âmbito federal; cadastre-os se valerem na sua cidade.
const FIXOS = [
  ['confraternizacao', '01-01', 'Confraternização Universal'],
  ['tiradentes', '04-21', 'Tiradentes'],
  ['trabalho', '05-01', 'Dia do Trabalho'],
  ['independencia', '09-07', 'Independência do Brasil'],
  ['aparecida', '10-12', 'Nossa Senhora Aparecida'],
  ['finados', '11-02', 'Finados'],
  ['republica', '11-15', 'Proclamação da República'],
  ['consciencia', '11-20', 'Dia Nacional de Zumbi e da Consciência Negra', 2024],
  ['natal', '12-25', 'Natal']
];

export function nacionais(ano) {
  const lista = FIXOS.filter((f) => !f[3] || ano >= f[3]).map(([ref, md, nome]) => ({ ref, data: `${ano}-${md}`, nome }));
  lista.push({ ref: 'paixao', data: ymd(addDays(pascoa(ano), -2)), nome: 'Sexta-feira Santa (Paixão de Cristo)' });
  return lista.map((f) => ({ id: 'nac:' + f.ref, ref: f.ref, data: f.data, nome: f.nome, tipo: 'federal', origem: 'nacional', recorrente: true }));
}

/**
 * Mapa "AAAA-MM-DD" → lista de feriados para os anos pedidos.
 * Registros do usuário com id "nac:<ref>" alteram (tipo/nome) ou ocultam (removido) um nacional.
 */
export function mapaFeriados(anos, doUsuario) {
  const overrides = {};
  const proprios = [];
  for (const f of doUsuario) {
    if (f.id.startsWith('nac:')) overrides[f.id] = f;
    else if (!f.removido) proprios.push(f);
  }
  const mapa = {};
  const add = (f) => { (mapa[f.data] = mapa[f.data] || []).push(f); };
  for (const ano of anos) {
    for (const n of nacionais(ano)) {
      const o = overrides[n.id];
      if (o && o.removido) continue;
      add(o ? { ...n, nome: o.nome || n.nome, tipo: o.tipo || n.tipo } : n);
    }
    for (const f of proprios) {
      const [y, m, d] = f.data.split('-');
      if (f.recorrente) { if (ano >= +y) add({ ...f, data: `${ano}-${m}-${d}` }); }
      else if (+y === ano) add(f);
    }
  }
  return mapa;
}

export const corDe = (tipo) => (TIPOS_FERIADO[tipo] || TIPOS_FERIADO.federal).cor;
export { pad };
