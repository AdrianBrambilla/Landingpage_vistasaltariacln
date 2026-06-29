// Librería de captura de leads para la edge function del CRM de TuCasaMas.
// Maneja: persistencia de UTM, armado del payload canónico y envío con manejo de errores.

import {
  CONTACT_FORM_ENDPOINT,
  LANDING_ORIGIN_ID,
  LANDING_USER_ROLE_OWNER,
  LANDING_ENTRY_POINT,
  LANDING_ZONE,
  LANDING_FRACCIONAMIENTO,
  UTM_KEYS,
  type CreditType,
} from '../config/landing';

const UTM_STORAGE_KEY = 'utmParams';

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/**
 * Lee las UTM del querystring en el primer load y las persiste en localStorage.
 * Solo sobrescribe si la URL trae al menos una UTM, para no perder la atribución
 * original cuando el usuario navega sin parámetros.
 */
export function captureUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl: UtmParams = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) fromUrl[key] = value;
    }
    if (Object.keys(fromUrl).length > 0) {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
      return fromUrl;
    }
  } catch {
    /* localStorage / URL no disponibles — ignorar */
  }
  return getUtmParams();
}

/** Recupera las UTM persistidas (o un objeto vacío si no hay). */
export function getUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : {};
  } catch {
    return {};
  }
}

export interface LeadFormInput {
  name: string;
  phone: string;
  email?: string | null;
  credit_type: CreditType;
  nss?: string | null;
  monthly_income?: string | null;
}

export interface LeadPayload extends UtmParams {
  name: string;
  phone: string;
  email: string | null;
  credit_type: CreditType;
  nss: string | null;
  monthly_income: string | null;
  origin_id: string;
  user_role_owner: string;
  entry_point: string;
  zone: string;
  fraccionamiento: string;
}

/** Deja solo dígitos (el teléfono se manda sin lada; el server normaliza a 521 + 10). */
export function normalizePhone(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

/**
 * Arma el payload canónico plano que espera la edge function.
 * Mezcla los valores de contexto de la landing y las UTM persistidas.
 */
export function buildLeadPayload(input: LeadFormInput): LeadPayload {
  const payload: LeadPayload = {
    name: input.name.trim(),
    phone: normalizePhone(input.phone),
    email: input.email ? input.email.trim() : null,
    credit_type: input.credit_type,
    nss: input.nss ? input.nss.replace(/\D/g, '') : null,
    monthly_income: input.monthly_income ? String(input.monthly_income).trim() : null,

    origin_id: LANDING_ORIGIN_ID,
    user_role_owner: LANDING_USER_ROLE_OWNER,
    entry_point: LANDING_ENTRY_POINT,
    zone: LANDING_ZONE,
    fraccionamiento: LANDING_FRACCIONAMIENTO,
  };

  // Adjunta solo las UTM presentes.
  const utms = getUtmParams();
  for (const key of UTM_KEYS) {
    if (utms[key]) payload[key] = utms[key];
  }

  return payload;
}

export interface SubmitResult {
  ok: boolean;
  data?: any;
  error?: string;
  status?: number;
}

/**
 * Envía el lead a la edge function. Trata cualquier `response.ok === false`
 * o `json.ok === false` como fallo y devuelve un mensaje legible.
 */
export async function submitLead(input: LeadFormInput): Promise<SubmitResult> {
  const payload = buildLeadPayload(input);
  try {
    const res = await fetch(CONTACT_FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.ok === false) {
      return {
        ok: false,
        status: res.status,
        error: json.error || `Error en el envío (${res.status})`,
        data: json,
      };
    }
    return { ok: true, status: res.status, data: json };
  } catch (err) {
    return {
      ok: false,
      error: 'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.',
    };
  }
}
