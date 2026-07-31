import { supabase } from './supabase';

export async function recordAdminAudit(action: string, entityType: string, entityId: string, details: Record<string, unknown> = {}) {
  const { error } = await supabase.rpc('record_authoring_audit_event', {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_details: details,
  });
  if (error) console.warn('Audit event could not be persisted', { action, entityType, entityId, error: error.message });
}
