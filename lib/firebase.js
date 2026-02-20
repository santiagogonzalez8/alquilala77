import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCfQxGT9EhJpv4vXZoMTHyy6Gl7Vih-f6w",
  authDomain: "alquilala-77.firebaseapp.com",
  projectId: "alquilala-77",
  storageBucket: "alquilala-77.firebasestorage.app",
  messagingSenderId: "27583580727",
  appId: "1:27583580727:web:3d88d9654302a37a064db2",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ============================================================
//  FIRESTORE REST API — Helper centralizado
//  Base de datos: "alquilala" (no "(default)")
// ============================================================
const PROJECT_ID = 'alquilala-77';
const DATABASE = 'alquilala';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}/documents`;

// --- Serializar JS → Firestore REST ---
function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(value)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestoreValue(v);
  return fields;
}

// --- Deserializar Firestore REST → JS ---
function fromFirestoreValue(val) {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('stringValue' in val) return val.stringValue;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in val) return fromFirestoreFields(val.mapValue.fields || {});
  return null;
}

function fromFirestoreFields(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields)) obj[k] = fromFirestoreValue(v);
  return obj;
}

function docToObject(doc) {
  const id = doc.name.split('/').pop();
  return { id, ...fromFirestoreFields(doc.fields || {}) };
}

// --- Obtener token del usuario logueado ---
async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay usuario autenticado');
  return await user.getIdToken();
}

// ============================================================
//  API Pública — requiere auth
// ============================================================

/**
 * Leer todos los documentos de una colección (con auth)
 * Soporta filtros: [{ field, op, value }]
 * op: 'EQUAL' | 'NOT_EQUAL' | 'GREATER_THAN' | 'LESS_THAN'
 */
export async function firestoreGetAll(collection, filters = []) {
  const token = await getToken();

  if (filters.length > 0) {
    const url = `${BASE_URL}/${collection}:runQuery`;
    const body = {
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: filters.length === 1
          ? {
              fieldFilter: {
                field: { fieldPath: filters[0].field },
                op: filters[0].op,
                value: toFirestoreValue(filters[0].value),
              }
            }
          : {
              compositeFilter: {
                op: 'AND',
                filters: filters.map(f => ({
                  fieldFilter: {
                    field: { fieldPath: f.field },
                    op: f.op,
                    value: toFirestoreValue(f.value),
                  }
                }))
              }
            }
      }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`firestoreGetAll query error: ${res.status}`);
    const results = await res.json();
    return results.filter(r => r.document).map(r => docToObject(r.document));
  }

  const res = await fetch(`${BASE_URL}/${collection}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`firestoreGetAll error: ${res.status}`);
  const data = await res.json();
  return (data.documents || []).map(docToObject);
}

/**
 * Leer un documento por ID (con auth)
 */
export async function firestoreGet(collection, id) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${collection}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`firestoreGet error: ${res.status}`);
  const doc = await res.json();
  return docToObject(doc);
}

/**
 * Crear documento con ID autogenerado (con auth)
 */
export async function firestoreAdd(collection, data) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${collection}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `firestoreAdd error: ${res.status}`);
  }
  const doc = await res.json();
  return docToObject(doc);
}

/**
 * Crear/sobreescribir documento con ID específico (con auth)
 */
export async function firestoreSet(collection, id, data) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${collection}/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `firestoreSet error: ${res.status}`);
  }
  const doc = await res.json();
  return docToObject(doc);
}

/**
 * Actualizar campos específicos de un documento (con auth)
 */
export async function firestoreUpdate(collection, id, data) {
  const token = await getToken();
  const fields = toFirestoreFields(data);
  const fieldPaths = Object.keys(data).join(',');
  const res = await fetch(
    `${BASE_URL}/${collection}/${id}?updateMask.fieldPaths=${encodeURIComponent(fieldPaths)}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `firestoreUpdate error: ${res.status}`);
  }
  return true;
}

/**
 * Eliminar un documento (con auth)
 */
export async function firestoreDelete(collection, id) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/${collection}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `firestoreDelete error: ${res.status}`);
  }
  return true;
}

// ============================================================
//  API Pública — SIN auth (home, páginas públicas)
// ============================================================

/**
 * Leer colección sin auth usando apiKey.
 * Lista todos los docs y filtra en cliente — más confiable
 * con base de datos de nombre custom sin autenticación.
 */
export async function firestoreGetPublic(collection, filters = [], limitCount = 6) {
  const apiKey = firebaseConfig.apiKey;

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}/documents/${collection}?key=${apiKey}&pageSize=100`,
    { method: 'GET' }
  );

  if (!res.ok) {
    console.error('firestoreGetPublic error:', res.status);
    return [];
  }

  const data = await res.json();
  const todos = (data.documents || []).map(docToObject);

  // Filtrar en cliente
  let resultado = todos;
  for (const f of filters) {
    resultado = resultado.filter(doc => {
      const val = doc[f.field];
      switch (f.op) {
        case 'EQUAL':        return val === f.value;
        case 'NOT_EQUAL':    return val !== f.value;
        case 'GREATER_THAN': return val > f.value;
        case 'LESS_THAN':    return val < f.value;
        default:             return true;
      }
    });
  }

  return resultado.slice(0, limitCount);
}

/**
 * Leer un documento por ID sin auth — página de detalle pública
 */
export async function firestoreGetPublicById(collection, id) {
  const apiKey = firebaseConfig.apiKey;
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}/documents/${collection}/${id}?key=${apiKey}`
  );
  if (!res.ok) throw new Error(`firestoreGetPublicById error: ${res.status}`);
  const doc = await res.json();
  return docToObject(doc);
}