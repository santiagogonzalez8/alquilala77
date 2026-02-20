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
  measurementId: "G-LTFTEXY9NM"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ==========================================
// FIRESTORE REST API HELPERS
// ==========================================
const PROJECT_ID = 'alquilala-77';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Convertir objeto JS a formato Firestore REST
function toFirestoreFormat(data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    
    if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(v => {
            if (typeof v === 'string') return { stringValue: v };
            if (typeof v === 'number') return { doubleValue: v };
            if (typeof v === 'boolean') return { booleanValue: v };
            return { stringValue: String(v) };
          })
        }
      };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { doubleValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else {
      fields[key] = { stringValue: String(value) };
    }
  }
  return { fields };
}

// Convertir respuesta REST a objeto JS limpio
function fromFirestoreFormat(docData) {
  if (!docData || !docData.fields) return {};
  const result = {};
  for (const [key, value] of Object.entries(docData.fields)) {
    if (value.stringValue !== undefined) result[key] = value.stringValue;
    else if (value.doubleValue !== undefined) result[key] = Number(value.doubleValue);
    else if (value.booleanValue !== undefined) result[key] = value.booleanValue;
    else if (value.arrayValue?.values) {
      result[key] = value.arrayValue.values.map(v => 
        v.stringValue ?? v.doubleValue ?? v.booleanValue ?? null
      );
    } else if (value.timestampValue) {
      result[key] = value.timestampValue;
    }
  }
  return result;
}

// GET Collection (con where simple si se necesita)
export async function firestoreGetCollection(collectionPath, whereField = null, whereValue = null, limitCount = null) {
  let url = `${BASE_URL}/${collectionPath}`;
  const params = new URLSearchParams();
  
  if (whereField && whereValue) {
    // Nota: Para queries complejas se requiere crear índices o usar structuredQuery en POST
    // Esta implementación simple filtra en cliente si es necesario, o usa endpoint básico
    // Para mantenerlo simple y robusto sin índices complejos, traemos y filtramos en JS si es poco dato,
    // O usamos la API de runQuery si necesitamos filtro estricto en servidor.
    // Aquí implementamos una versión básica que trae todo y filtra en cliente para simplicidad del demo,
    // PERO para producción real con muchos datos, deberías usar 'runQuery'.
    // Dado el contexto, haremos fetch directo y filtrado local para evitar errores de índices faltantes.
  }

  if (limitCount) params.append('pageSize', limitCount);
  
  const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;

  try {
    const res = await fetch(finalUrl);
    if (!res.ok) throw new Error(`Error fetching: ${res.status}`);
    const data = await res.json();
    
    let docs = data.documents || [];
    
    // Filtro manual en cliente si se especificó (para evitar errores de índices en Firestore free tier)
    if (whereField && whereValue) {
      docs = docs.filter(d => {
        const val = d.fields?.[whereField]?.stringValue || d.fields?.[whereField]?.doubleValue;
        return val == whereValue; // == para comparar string con number si viene así
      });
    }

    return docs.map(d => ({ id: d.name.split('/').pop(), ...fromFirestoreFormat(d) }));
  } catch (error) {
    console.error('REST GET Error:', error);
    return [];
  }
}

// ADD Document
export async function firestoreAdd(collectionPath, data) {
  const url = `${BASE_URL}/${collectionPath}`;
  const body = JSON.stringify(toFirestoreFormat(data));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Error al guardar');
  }

  const result = await res.json();
  return { id: result.name.split('/').pop(), ...data };
}

// UPDATE Document
export async function firestoreUpdate(collectionPath, docId, data) {
  // Mask para actualizar solo los campos enviados
  const fieldMask = Object.keys(data).join(',');
  const url = `${BASE_URL}/${collectionPath}/${docId}?updateMask.fieldPaths=${fieldMask}`;
  const body = JSON.stringify(toFirestoreFormat(data));

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Error al actualizar');
  }
  
  return true;
}

// DELETE Document
export async function firestoreDelete(collectionPath, docId) {
  const url = `${BASE_URL}/${collectionPath}/${docId}`;
  
  const res = await fetch(url, { method: 'DELETE' });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Error al eliminar');
  }
  
  return true;
}