// Configuración de la landing — Portal de Bugambilias
// Fuente de verdad de los valores de contexto del CRM (edge function de captura de leads).
// Estos valores ya están dados de alta en CRM. No hardcodear en componentes: leer desde aquí.

export const CONTACT_FORM_ENDPOINT =
  'https://degyverotsqktwjisgxs.supabase.co/functions/v1/lead-contact-form';

export const LANDING_ORIGIN_ID = '47b65a5e-aefa-4336-8ce6-4138586501fd';
export const LANDING_USER_ROLE_OWNER = 'contact_center';
export const LANDING_ENTRY_POINT = 'portal_de_bugambilias_landing_page';
export const LANDING_ZONE = 'Juárez';

// Etapas disponibles en CRM (cambiar el default si la landing apunta a otra etapa):
//   Portal Bugambilias E1 -> e48c32a1-bbb3-4caa-9300-689c0cb86fa3
//   Portal Bugambilias E2 -> 2eab92c1-d6a3-4d07-8a1c-b7c3cc899218  (default actual)
//   Bugambilias Etapa 3   -> 1b9543b3-1d1a-4267-b1fc-17768d84201d
export const LANDING_FRACCIONAMIENTO = 'Portal Bugambilias E2';

// Tipos de crédito permitidos por la edge function.
export type CreditType = 'infonavit' | 'cofinavit' | 'bank' | 'fovissste' | 'fovissste_infonavit';

// Lógica condicional de campos según el tipo de crédito.
//   infonavit           -> NSS requerido, ingresos NO
//   cofinavit           -> NSS requerido, ingresos requerido
//   bank                -> NSS NO,        ingresos requerido
//   fovissste           -> NSS requerido, ingresos NO
//   fovissste_infonavit -> NSS requerido, ingresos NO
export const CREDIT_RULES: Record<CreditType, { needsNss: boolean; needsIncome: boolean }> = {
  infonavit:           { needsNss: true,  needsIncome: false },
  cofinavit:           { needsNss: true,  needsIncome: true  },
  bank:                { needsNss: false, needsIncome: true  },
  fovissste:           { needsNss: true,  needsIncome: false },
  fovissste_infonavit: { needsNss: true,  needsIncome: false },
};

// Llaves UTM que conserva la atribución de marketing.
export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
] as const;
