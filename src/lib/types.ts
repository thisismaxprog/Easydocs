export type DocStatus =
  | 'uploaded'
  | 'processing'
  | 'extracted'
  | 'needs_review'
  | 'approved'
  | 'failed';

export interface Firm {
  id: string;
  name: string;
  vat_number?: string | null;
  created_at: string;
  updated_at?: string;
}

export type FirmMemberRole = 'owner' | 'staff' | 'admin' | 'collaborator';

export interface FirmMember {
  id: string;
  firm_id: string;
  user_id: string;
  role: FirmMemberRole;
  created_at: string;
}

export type ClientInvitationStatus = 'not_invited' | 'invited' | 'accepted' | 'expired';

export interface Client {
  id: string;
  firm_id: string;
  name: string;
  company_name: string | null;
  vat_number: string | null;
  tax_code: string | null;
  internal_code: string | null;
  contact_name: string | null;
  contact_email: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  invitation_status: ClientInvitationStatus;
  upload_token: string | null;
  created_at: string;
  updated_at?: string;
}

export type DocumentSourceType = 'client_portal' | 'upload_link' | 'firm_upload' | 'email' | 'unknown';
export type DocumentClassificationStatus = 'assigned' | 'suggested' | 'unmatched';

export interface Document {
  id: string;
  firm_id: string;
  client_id: string | null;
  uploaded_by_user_id?: string | null;
  source_type?: DocumentSourceType;
  filename: string;
  storage_path: string;
  mime_type: string | null;
  status: DocStatus;
  doc_type: string | null;
  doc_date: string | null;
  doc_number: string | null;
  total: number | null;
  classification_status?: DocumentClassificationStatus;
  match_confidence?: number | null;
  match_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  clients?: Client | null;
}


export interface ExtractionJson {
  doc_type: 'invoice' | 'receipt' | 'bank' | 'utility' | 'other' | null;
  vendor_name: string | null;
  vendor_vat: string | null;
  doc_number: string | null;
  doc_date: string | null;
  net_amount: number | null;
  vat_amount: number | null;
  total_amount: number | null;
  currency: string | null;
  notes: string | null;
  confidence: number;
}

export interface Extraction {
  id: string;
  firm_id: string;
  document_id: string;
  extracted_json: ExtractionJson;
  confidence: number | null;
  issues: string[] | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  firm_id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}
