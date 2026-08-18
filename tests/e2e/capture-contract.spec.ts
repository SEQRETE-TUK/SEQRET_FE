import { expect, test } from "@playwright/test";

import { analysisReviewCompletePayload, captureSessionCreatePayload, scopeProposalPayload } from "../../src/api/contract-payloads";

const customerAccessSecret = "seqret_mock_customer_0000000000000000000000000000";

test("keeps the access secret out of browser storage", async ({ page }) => {
  await page.goto("/consumer", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /김서큐님/ })).toBeVisible();

  expect(await page.evaluate(() => JSON.stringify({ localStorage, sessionStorage }))).not.toContain(customerAccessSecret);

});

test("builds the backend capture consent contract", async () => {
  expect(captureSessionCreatePayload("2026-08-17.v1", true)).toEqual({
    consent_policy_version: "2026-08-17.v1",
    privacy_notice_acknowledged: true,
  });
});

test("builds the AI v2 review contract without dropping structured fields", async () => {
  const items = [{ item_key: "box", room_zone_id: "zone", name: "이사 박스", quantity: 4, unit: "개", work_note: "취급 주의" }];
  const locationConditions = [{ location_id: "origin", kind: "origin", conditions: { elevator: "available" } }];
  expect(analysisReviewCompletePayload({ sourceScopeVersionId: "scope", scopeSchemaVersion: 2, items, locationConditions })).toEqual({
    source_scope_version_id: "scope",
    scope_schema_version: 2,
    items,
    location_conditions: locationConditions,
  });
});

test("keeps the execution plan in a scope proposal", async () => {
  const executionPlan = { vehicle_count: 1, vehicle_description: "5톤 탑차", worker_count: 2, estimated_duration_minutes: 480, notes: null };
  expect(scopeProposalPayload({ execution_plan: executionPlan, reason: "현장 조건 반영" })).toEqual({ execution_plan: executionPlan, reason: "현장 조건 반영" });
});
