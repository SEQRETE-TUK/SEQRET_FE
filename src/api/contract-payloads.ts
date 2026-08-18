export function captureSessionCreatePayload(consentPolicyVersion: string, privacyNoticeAcknowledged: true) {
  return {
    consent_policy_version: consentPolicyVersion,
    privacy_notice_acknowledged: privacyNoticeAcknowledged,
  };
}

export function analysisReviewCompletePayload<TItem, TLocation>(input: {
  sourceScopeVersionId: string;
  scopeSchemaVersion: 1 | 2;
  items: TItem[];
  locationConditions: TLocation[];
}) {
  return {
    source_scope_version_id: input.sourceScopeVersionId,
    scope_schema_version: input.scopeSchemaVersion,
    items: input.items,
    location_conditions: input.locationConditions,
  };
}

export function scopeProposalPayload<T extends {
  execution_plan: {
    vehicle_count: number;
    vehicle_description: string;
    worker_count: number;
    estimated_duration_minutes: number;
    notes: string | null;
  };
}>(input: T): T {
  return input;
}
