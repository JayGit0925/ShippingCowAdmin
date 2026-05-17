export interface FormState {
  name: string;
  company: string;
  email: string;
  item_type: string;
  weight_lbs: string;
  origin_zip: string;
}

export function buildQuotePayload(form: FormState): {
  name: string;
  company?: string;
  email: string;
  item_type?: string;
  weight_lbs?: number;
  origin_zip?: string;
} {
  const payload: ReturnType<typeof buildQuotePayload> = {
    name: form.name,
    email: form.email,
  };
  if (form.company.trim()) payload.company = form.company.trim();
  if (form.item_type.trim()) payload.item_type = form.item_type.trim();
  if (form.weight_lbs.trim()) {
    const parsed = parseInt(form.weight_lbs, 10);
    if (!isNaN(parsed)) payload.weight_lbs = parsed;
  }
  if (form.origin_zip.trim()) payload.origin_zip = form.origin_zip.trim();
  return payload;
}
