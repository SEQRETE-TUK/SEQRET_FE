import { expect, test } from "@playwright/test";

import { analysisReviewCompletePayload, captureSessionCreatePayload, scopeProposalPayload } from "../../src/api/contract-payloads";

const moveConnectionCode = "MOVE-11111111";

test("keeps the access secret out of browser storage", async ({ page }) => {
  await page.goto("/consumer", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /김서큐님/ })).toBeVisible();

  expect(await page.evaluate(() => JSON.stringify({ localStorage, sessionStorage }))).not.toContain(moveConnectionCode);

});

test("enters the customer home without a guest app", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "고객으로 시작" }).click();
  await page.getByRole("button", { name: "새 이사" }).click();
  await page.getByRole("textbox", { name: "이름" }).fill("새 고객");
  await page.getByRole("button", { name: "시작" }).click();

  await expect(page).toHaveURL(/\/consumer$/);
  await expect(page.getByRole("heading", { name: /새 고객님/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "진행 중인 이사가 없어요" })).toBeVisible();
  await expect(page.getByRole("button", { name: "더보기" })).toBeVisible();
  await page.getByRole("button", { name: /60초 촬영으로/ }).click();
  await expect(page.getByRole("dialog", { name: "이사를 시작해요" }).getByRole("button", { name: "새 이사 시작하기" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "이사를 시작해요" }).getByRole("button", { name: "이사 연결 코드로 불러오기" })).toBeVisible();
  await page.getByRole("button", { name: "닫기" }).click();
  await page.getByRole("button", { name: "내 이사" }).click();
  await expect(page.getByRole("tab", { name: "진행 중 0" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "기록 0" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "진행 중인 이사가 없어요" })).toBeVisible();
  await page.getByRole("tab", { name: "기록 0" }).click();
  await expect(page.getByRole("tab", { name: "기록 0" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "아직 이사 기록이 없어요" })).toBeVisible();
  await page.getByRole("tab", { name: "진행 중 0" }).click();
  await expect(page.getByRole("tab", { name: "진행 중 0" })).toHaveAttribute("aria-selected", "true");
});

test("lists only the move created by a new mock customer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "고객으로 시작" }).click();
  await page.getByRole("button", { name: "새 이사" }).click();
  await page.getByRole("textbox", { name: "이름" }).fill("목록 고객");
  await page.getByRole("button", { name: "시작" }).click();
  await page.getByRole("button", { name: "내 이사" }).click();
  await page.getByRole("button", { name: "+ 새 이사" }).click();
  await page.getByRole("dialog", { name: "이사를 시작해요" }).getByRole("button", { name: "새 이사 시작하기" }).click();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByRole("button", { name: "이사 초안 만들기" }).click();

  await page.getByRole("button", { name: "이사 목록으로 돌아가기" }).click();
  await expect(page.getByRole("tab", { name: "진행 중 1" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "기록 0" })).toBeVisible();
  await expect(page.getByRole("button", { name: "더보기" })).toBeVisible();
  await expect(page.getByText("서울 성동구 성수동 1가 → 서울 광진구 자양동 오피스텔")).toBeVisible();
  await page.getByText("서울 성동구 성수동 1가 → 서울 광진구 자양동 오피스텔").click();
  await page.getByRole("button", { name: "더보기" }).click();
  await page.getByRole("button", { name: "이사 삭제" }).click();
  await expect(page.getByRole("heading", { name: "진행 중인 이사가 없어요" })).toBeVisible();
  await page.getByRole("button", { name: "더보기" }).click();
  await expect(page.getByRole("heading", { name: "목록 고객" })).toBeVisible();
});

test("loads crew mock data only after entering an invite code", async ({ page }) => {
  await page.goto("/");
  await page.getByText("현장기사", { exact: true }).click();
  await page.getByRole("button", { name: "현장기사로 시작" }).click();

  await expect(page).toHaveURL(/\/crew$/);
  await expect(page.getByRole("heading", { name: "연결된 작업이 없어요" })).toBeVisible();
  await page.getByRole("button", { name: /연결 코드 입력하기/ }).click();
  await page.getByRole("button", { name: "내 작업에 연결" }).click();
  await expect(page.getByRole("heading", { name: /오늘 작업을 준비해요/ })).toBeVisible();
});

test("loads provider mock data only after adding an invite key", async ({ page }) => {
  await page.goto("/");
  await page.getByText("이사업체", { exact: true }).click();
  await page.getByRole("button", { name: "이사업체로 시작" }).click();

  await expect(page).toHaveURL(/\/provider\/web$/);
  await expect(page.getByRole("heading", { name: "연결된 이사가 없어요" })).toBeVisible();
  await page.locator("#main-content").getByRole("button", { name: "연결 코드 추가" }).click();
  await page.getByRole("button", { name: "작업 추가" }).click();
  await expect(page.getByRole("heading", { name: "작업 큐" })).toBeVisible();
  await expect(page.getByRole("button", { name: `${moveConnectionCode} · 복사` })).toBeVisible();
});

test("lets a connected customer choose a new move or invite code", async ({ page }) => {
  await page.goto("/consumer?tab=move&view=list");
  await page.getByRole("button", { name: "+ 새 이사" }).click();

  await expect(page.getByRole("dialog", { name: "이사를 시작해요" })).toBeVisible();
  await expect(page.getByRole("button", { name: "새 이사 시작하기" })).toBeVisible();
  await page.getByRole("button", { name: "이사 연결 코드로 불러오기" }).click();
  await expect(page.getByLabel("이사 연결 코드")).toHaveValue(moveConnectionCode);
  await page.getByRole("button", { name: "내 이사 불러오기" }).click();
  await expect(page.getByRole("tab", { name: "진행 중 3" })).toBeVisible();
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
