export type CaseStatus = 'New' | 'Under Process' | 'Transferred' | 'Disposed' | 'Overdue';

export const CASE_STATUSES: CaseStatus[] = [
  'New',
  'Under Process',
  'Transferred',
  'Disposed',
  'Overdue'
];

export type BureauName =
  | 'Approval Bureau'
  | 'Policy Bureau'
  | 'Anti-Ragging Cell'
  | 'Women Cell'
  | 'PGRC';

export const BUREAUS: BureauName[] = [
  'Approval Bureau',
  'Policy Bureau',
  'Anti-Ragging Cell',
  'Women Cell',
  'PGRC'
];

export type UserRole =
  | 'management'
  | 'supervisor'
  | 'officer'
  | 'regional'
  | 'admin'
  | 'auditor';

export const USER_ROLES: UserRole[] = [
  'management',
  'supervisor',
  'officer',
  'regional',
  'admin',
  'auditor'
];

export type Region = 'North' | 'South' | 'East' | 'West' | 'Central';

export const REGIONS: Region[] = ['North', 'South', 'East', 'West', 'Central'];

export type ReviewStatus = 'suggested' | 'confirmed' | 'rejected' | 'deferred';

export type ConfidenceBand = 'Low' | 'Medium' | 'High';

export interface Institution {
  id: string;
  aicte_permanent_id: string;
  canonical_name: string;
  aliases: string[];
  region: string;
  address?: string;
  verification_status: 'verified' | 'pending' | 'flagged';
  created_at: string;
  updated_at: string;
}

export interface Bureau {
  id: string;
  name: BureauName;
  type: string;
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bureau_scope?: string | null;
  region_scope?: string | null;
  active: boolean;
}

export interface Case {
  id: string;
  case_code: string;
  source_system: string;
  source_case_id: string;
  institution_id: string;
  subject: string;
  category: string;
  status: CaseStatus;
  bureau_id: string | null;
  officer_id: string | null;
  received_at: string;
  last_action: string | null;
  last_action_at: string | null;
  next_action: string | null;
  due_at: string | null;
  synced_at: string;
  institution?: Institution;
  bureau?: Bureau | null;
  officer?: User | null;
}

export interface RoutingRule {
  id: string;
  keywords: string[];
  category: string;
  bureau_id: string;
  priority: number;
  active: boolean;
  bureau?: Bureau;
}

export interface RoutingSuggestion {
  case_code: string;
  suggested_category: string;
  suggested_bureau_id: string;
  suggested_bureau_name: string;
  why: string;
  rules_checked: string[];
  matched_rule_id?: string;
}

export interface OverlapReason {
  label: string;
  detail: string;
}

export interface CaseRelationship {
  id: string;
  case_a_id: string;
  case_b_id: string;
  relationship_type: string;
  confidence_band: ConfidenceBand;
  score: number;
  reasons: OverlapReason[];
  review_status: ReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reason: string | null;
  case_a?: Case;
  case_b?: Case;
  reviewer?: User | null;
}

export interface CaseEvent {
  id: string;
  case_id: string;
  actor_id: string;
  event_type: string;
  remarks: string;
  created_at: string;
  actor?: User;
}

export interface Alert {
  id: string;
  case_id: string;
  rule: string;
  triggered_at: string;
  recipient_id: string;
  delivery_status: 'sent' | 'pending' | 'delivered';
  resolved_at: string | null;
  case?: Case;
  recipient?: User;
}

export interface AuditEvent {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, any>;
  created_at: string;
  actor?: User;
}

export interface IngestionRun {
  id: string;
  source: string;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'completed' | 'failed';
  records_seen: number;
  records_changed: number;
  errors: any[];
}
