// Banco local no aparelho (IndexedDB). Tudo é gravado aqui primeiro; a nuvem vem depois.
const DB_NAME = 'ponto';
const DB_VERSION = 1;
let dbPromise;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const reg = db.createObjectStore('registros', { keyPath: 'id' });
      reg.createIndex('data', 'data');
      reg.createIndex('sync', 'sync');
      const fer = db.createObjectStore('feriados', { keyPath: 'id' });
      fer.createIndex('sync', 'sync');
      db.createObjectStore('kv', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

const done = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

async function store(name, mode = 'readonly') {
  const db = await openDb();
  return db.transaction(name, mode).objectStore(name);
}

export async function getAll(name) { return done((await store(name)).getAll()); }
export async function get(name, key) { return done((await store(name)).get(key)); }
export async function put(name, value) { return done((await store(name, 'readwrite')).put(value)); }
export async function putMany(name, values) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(name, 'readwrite');
    const s = tx.objectStore(name);
    values.forEach((v) => s.put(v));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export async function byIndex(name, index, value) {
  return done((await store(name)).index(index).getAll(value));
}
export async function getKV(key, fallback = null) {
  const row = await get('kv', key);
  return row ? row.value : fallback;
}
export async function setKV(key, value) { return put('kv', { key, value }); }
