import { query } from '../db/connection.js';
import { logger } from '../lib/logger.js';

export class AuditRepository {
  constructor(localStoreRef) {
    this.store = localStoreRef;
  }

  async logAudit(action, entityType, entityId, actorId = null, actorRole = null, details = null) {
    const entry = {
      action,
      entityType,
      entityId,
      actorId,
      actorRole,
      details,
      createdAt: new Date().toISOString()
    };

    this.store.data.auditLogs = this.store.data.auditLogs || [];
    this.store.data.auditLogs.unshift(entry);

    query(
      `INSERT INTO audit_log (action, entity_type, entity_id, actor_id, actor_role, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [action, entityType, entityId, actorId, actorRole, details ? JSON.stringify(details) : null]
    ).catch(err => logger.debug({ err: err.message }, 'Postgres audit_log insert background sync skipped'));

    return entry;
  }

  getAuditLogs() {
    return this.store.data.auditLogs || [];
  }
}

export default AuditRepository;
