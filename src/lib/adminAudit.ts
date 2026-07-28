import { supabase } from './supabase';

export async function recordAdminAudit(action: string, entityType: string, entityId: string, details: Record<string, unknown> = {}) {
  const { data } = await supabase.auth.getUser();
  const { error } = await supabase.from('admin_audit_logs').insert({
    actor_id: data.user?.id || null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
  if (error) console.warn('Audit event could not be persisted', { action, entityType, entityId, error: error.message });
}
