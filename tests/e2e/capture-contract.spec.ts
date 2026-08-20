import { expect, test } from "@playwright/test";

import { analysisReviewCompletePayload, captureSessionCreatePayload, scopeProposalPayload } from "../../src/api/contract-payloads";
import type { CaptureSession } from "../../src/features/capture/api/capture-api";
import {
  findPendingVideoReviewSession,
  findResumableVideoSession,
} from "../../src/features/capture/model/capture-session";

const moveConnectionCode = "MOVE-11111111";

test("keeps the access secret out of browser storage", async ({ page }) => {
  await page.goto("/consumer", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /김서큐님/ })).toBeVisible();

  expect(await page.evaluate(() => JSON.stringify({ localStorage, sessionStorage }))).not.toContain(moveConnectionCode);

});

test("enters the customer home without a guest app", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "고객으로 시작" }).click();
  await page.getByRole("textbox", { name: "이름" }).fill("새 고객");
  await page.getByRole("button", { name: "시작" }).click();

  await expect(page).toHaveURL(/\/consumer$/);
  await expect(page.getByRole("heading", { name: /새 고객님/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "진행 중인 이사가 없어요" })).toBeVisible();
  await page.getByRole("button", { name: "알림 확인" }).click();
  await expect(page.getByRole("heading", { name: "알림", exact: true })).toBeVisible();
  await expect(page.getByText("알림이 없어요")).toBeVisible();
  await expect(page.getByText("작업 알림")).toHaveCount(0);
  await expect(page.getByText("알림이 없어요").locator("..")).not.toHaveClass(/border/);
  await page.getByRole("button", { name: "뒤로가기" }).click();
  await expect(page.getByRole("button", { name: "더보기" })).toBeVisible();
  await page.getByRole("button", { name: /60초 촬영으로/ }).click();
  await expect(page.getByRole("dialog", { name: "이사를 시작해요" }).getByRole("button", { name: "새 이사 시작하기" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "이사를 시작해요" }).getByRole("button", { name: "이사 연결 코드로 불러오기" })).toBeVisible();
  await page.getByRole("button", { name: "닫기" }).click();
  await page.getByRole("button", { name: "내 이사" }).click();
  await expect(page.getByRole("tab", { name: "진행 중 0" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "기록 0" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "진행 중인 이사가 없어요" })).toBeVisible();
  await expect(page.getByRole("button", { name: "새 이사", exact: true }).locator("svg")).toHaveCount(1);
  await page.getByRole("tab", { name: "기록 0" }).click();
  await expect(page.getByRole("tab", { name: "기록 0" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "아직 이사 기록이 없어요" })).toBeVisible();
  await page.getByRole("tab", { name: "진행 중 0" }).click();
  await expect(page.getByRole("tab", { name: "진행 중 0" })).toHaveAttribute("aria-selected", "true");
});

test("replaces the entered customer name with the connected move name", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "고객으로 시작" }).click();
  await page.getByRole("textbox", { name: "이름" }).fill("입력한 이름");
  await page.getByRole("button", { name: "시작" }).click();
  await page.getByRole("button", { name: /60초 촬영으로/ }).click();
  await page.getByRole("button", { name: "이사 연결 코드로 불러오기" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await expect(page.getByRole("heading", { name: "김서큐님의 이사를 불러올까요?" })).toBeVisible();
  await page.getByRole("button", { name: "이전" }).click();
  await expect(page.getByLabel("이사 연결 코드")).toHaveValue(moveConnectionCode);
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "시작", exact: true }).click();
  await page.getByRole("button", { name: "홈" }).click();

  await expect(page.getByRole("heading", { name: /김서큐님/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /입력한 이름님/ })).toHaveCount(0);
});

test("lists only the move created by a new mock customer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "고객으로 시작" }).click();
  await page.getByRole("textbox", { name: "이름" }).fill("목록 고객");
  await page.getByRole("button", { name: "시작" }).click();
  await page.getByRole("button", { name: "내 이사" }).click();
  await page.getByRole("button", { name: "새 이사", exact: true }).click();
  const moveStartDialog = page.getByRole("dialog", { name: "이사를 시작해요" });
  await expect(moveStartDialog.getByRole("button", { name: "이사 연결 코드로 불러오기" }).locator("img")).toHaveAttribute("src", "/moving-items/secured-letter.png");
  await moveStartDialog.getByRole("button", { name: "새 이사 시작하기" }).click();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page.getByRole("radio", { exact: true, name: "1층" })).toBeChecked();
  await expect(page.getByRole("radio", { exact: true, name: "사용 안 함" })).toBeChecked();
  await expect(page.getByRole("radio", { exact: true, name: "없음" })).toBeChecked();
  await expect(page.getByRole("radio", { exact: true, name: "가능" })).toBeChecked();
  await expect(page.getByRole("radio", { exact: true, name: "아파트" })).toBeChecked();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page.getByRole("radio", { exact: true, name: "1층" })).toBeChecked();
  await expect(page.getByRole("radio", { exact: true, name: "사용 안 함" })).toBeChecked();
  await expect(page.getByRole("radio", { exact: true, name: "없음" })).toBeChecked();
  await expect(page.getByRole("radio", { exact: true, name: "가능" })).toBeChecked();
  await expect(page.getByRole("radio", { exact: true, name: "아파트" })).toBeChecked();
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

test("shows action errors as a transient bottom toast", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/");
  await page.getByText("현장기사", { exact: true }).click();
  await page.getByRole("button", { name: "현장기사로 시작" }).click();
  await page.getByRole("button", { name: /연결 코드 입력하기/ }).click();
  await page.getByRole("textbox", { name: "이사 연결 코드" }).fill("MOVE-INVALID");
  await page.getByRole("button", { name: "내 작업에 연결" }).click();

  const toast = page.locator('[role="alert"]');
  await expect(toast).toHaveClass(/max-w-xs.*rounded-full.*bg-ink-900\/60.*text-\[14px\].*font-normal/);
  await expect(toast).toContainText("네트워크 연결을 확인하고 다시 시도해 주세요");
  const bounds = await toast.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { bottom: window.innerHeight - rect.bottom, left: rect.left, right: rect.right, width: window.innerWidth };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(16);
  expect(bounds.right).toBeLessThanOrEqual(bounds.width - 16);
  expect(bounds.bottom).toBeGreaterThanOrEqual(150);
  await expect(toast).toBeHidden({ timeout: 3500 });
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
  await page.getByRole("button", { name: "새 이사", exact: true }).click();

  await expect(page.getByRole("dialog", { name: "이사를 시작해요" })).toBeVisible();
  await expect(page.getByRole("button", { name: "새 이사 시작하기" })).toBeVisible();
  await page.getByRole("button", { name: "이사 연결 코드로 불러오기" }).click();
  await expect(page.getByLabel("이사 연결 코드")).toHaveValue(moveConnectionCode);
  await page.getByRole("button", { name: "다음" }).click();
  await expect(page.getByRole("heading", { name: "김서큐님의 이사를 불러올까요?" })).toBeVisible();
  await page.getByRole("button", { name: "시작", exact: true }).click();
  await expect(page.getByRole("tab", { name: "진행 중 3" })).toBeVisible();
});

test("opens the native video picker from the inventory action", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      configurable: true,
      get: () => 60,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
      configurable: true,
      get: () => 1080,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
      configurable: true,
      get: () => 1920,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "load", {
      configurable: true,
      value(this: HTMLMediaElement) {
        queueMicrotask(() => {
          this.dispatchEvent(new Event("loadedmetadata"));
          this.dispatchEvent(new Event("loadeddata"));
        });
      },
    });
  });
  await page.goto("/consumer?tab=move&view=items");
  const captureButton = page.getByRole("button", { name: "AI 영상 촬영", exact: true });
  await expect(captureButton).toBeVisible();
  await expect(captureButton).toBeEnabled();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await captureButton.click();
  const fileChooser = await fileChooserPromise;
  expect(fileChooser.isMultiple()).toBe(false);
  await fileChooser.setFiles({ name: "move.mp4", mimeType: "video/mp4", buffer: Buffer.from("mock-video") });
  await expect(page).toHaveURL(/\/consumer\/capture\?mode=video&job=/);
  await expect(page.getByRole("heading", { name: "AI 분석 중" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "출발지 구역을 촬영해 주세요" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "집 전체 촬영" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /AI가 짐 \d+개를 발견했어요/ })).toBeVisible();
  await expect(page.getByRole("img", { name: "분석한 영상 미리보기" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI 초안을 확인해 주세요" })).toHaveCount(0);
});

test("lets the customer resolve AI items with missing quantity and unit", async ({ page }) => {
  await page.addInitScript(() => {
    window.__SEQRET_MOCK_REVIEW_REQUIRED__ = true;
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      configurable: true,
      get: () => 60,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
      configurable: true,
      get: () => 1080,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
      configurable: true,
      get: () => 1920,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "load", {
      configurable: true,
      value(this: HTMLMediaElement) {
        queueMicrotask(() => {
          this.dispatchEvent(new Event("loadedmetadata"));
          this.dispatchEvent(new Event("loadeddata"));
        });
      },
    });
  });
  await page.goto("/consumer?tab=move&view=items");
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "AI 영상 촬영", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "review-required.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("mock-video"),
  });

  const submit = page.getByRole("button", { name: "확인한 짐 11개 반영" });
  const confirmations = page.getByRole("button", { name: /항목 확인 완료/ });
  await expect(confirmations).toHaveCount(11);
  await expect(submit).toBeDisabled();
  while (await confirmations.count()) await confirmations.first().click();
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page).toHaveURL(/\/consumer\?tab=move&view=items&job=/);
  await expect(page.getByRole("button", { name: "AI 영상 촬영", exact: true })).toBeVisible();
});

test("explains an AI schema failure and offers direct inventory entry", async ({ page }) => {
  await page.addInitScript(() => {
    window.__SEQRET_MOCK_ANALYSIS_FAILURE__ = true;
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      configurable: true,
      get: () => 60,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
      configurable: true,
      get: () => 1080,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
      configurable: true,
      get: () => 1920,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "load", {
      configurable: true,
      value(this: HTMLMediaElement) {
        queueMicrotask(() => {
          this.dispatchEvent(new Event("loadedmetadata"));
          this.dispatchEvent(new Event("loadeddata"));
        });
      },
    });
  });
  await page.goto("/consumer?tab=move&view=items");
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "AI 영상 촬영", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({ name: "invalid-result.mp4", mimeType: "video/mp4", buffer: Buffer.from("mock-video") });

  await expect(page.getByRole("heading", { name: "AI 짐 목록 형식을 확인하지 못했어요" })).toBeVisible();
  await expect(page.getByText(/AI가 만든 짐 목록 일부가 필수 형식에 맞지 않아/)).toBeVisible();
  await expect(page.getByRole("button", { name: "직접 짐 선택하기" })).toBeVisible();
  await page.getByRole("button", { name: "직접 짐 선택하기" }).click();
  await expect(page.getByRole("heading", { name: "짐 목록 선택" })).toBeVisible();
});

test("rejects a video longer than two minutes before upload", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      configurable: true,
      get: () => 121,
    });
    Object.defineProperty(HTMLMediaElement.prototype, "load", {
      configurable: true,
      value(this: HTMLMediaElement) {
        queueMicrotask(() => this.dispatchEvent(new Event("loadedmetadata")));
      },
    });
  });
  await page.goto("/consumer?tab=move&view=items");
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "AI 영상 촬영", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({ name: "long.mp4", mimeType: "video/mp4", buffer: Buffer.from("mock-video") });

  await expect(page.getByText("영상은 2분 이내로 촬영해 주세요.")).toBeVisible();
  await expect(page.getByText("촬영 영상을 업로드하고 있어요")).toHaveCount(0);
});

test("rejects a video that the browser cannot decode before upload", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "load", {
      configurable: true,
      value(this: HTMLMediaElement) {
        queueMicrotask(() => this.dispatchEvent(new Event("error")));
      },
    });
  });
  await page.goto("/consumer?tab=move&view=items");
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "AI 영상 촬영", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "unsupported-codec.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("unsupported-video"),
  });

  await expect(page.getByText(
    "영상 코덱을 재생할 수 없어요. H.264 MP4 영상으로 다시 촬영해 주세요.",
  )).toBeVisible();
  await expect(page.getByText("촬영 영상을 업로드하고 있어요")).toHaveCount(0);
});

test("reuses a video session while its analysis is active", () => {
  const activeSession: CaptureSession = {
    id: "11111111-1111-4111-8111-111111111111",
    media_assets: [{
      media_purpose: "inventory",
      status: "ready",
      content_type: "video/mp4",
    }],
    analysis: { status: "running" },
  } as unknown as CaptureSession;

  const completedSession = {
    ...activeSession,
    analysis: { ...activeSession.analysis!, status: "completed" },
  } as CaptureSession;
  const pendingReview = {
    capture_session_id: completedSession.id,
    review_scope_version_id: null,
  } as unknown as Parameters<typeof findPendingVideoReviewSession>[1];
  const unrelatedReadyVideoSession = {
    ...activeSession,
    analysis: null,
    media_assets: [
      { ...activeSession.media_assets[0], status: "failed" },
      {
        ...activeSession.media_assets[0],
        id: "22222222-2222-4222-8222-222222222222",
        media_purpose: "evidence",
        status: "ready",
      },
    ],
  } as CaptureSession;

  expect(findResumableVideoSession([activeSession])).toBe(activeSession);
  expect(findResumableVideoSession([completedSession])).toBeNull();
  expect(findResumableVideoSession([unrelatedReadyVideoSession])).toBeNull();
  expect(findPendingVideoReviewSession([completedSession], pendingReview)).toBe(completedSession);
  expect(findPendingVideoReviewSession(
    [completedSession],
    { ...pendingReview!, review_scope_version_id: "review-version" },
  )).toBeNull();
});

test("redirects legacy capture URLs instead of showing the room flow", async ({ page }) => {
  await page.goto("/consumer");
  await expect(page.getByRole("heading", { name: /김서큐님/ })).toBeVisible();
  await page.evaluate(() => {
    history.pushState({}, "", "/consumer/capture?job=11111111-1111-4111-8111-111111111111");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page).toHaveURL(/\/consumer\?tab=move&view=items&job=/);
  await expect(page.getByRole("heading", { name: "출발지 구역을 촬영해 주세요" })).toHaveCount(0);
});

test("redirects stale video capture URLs back to the inventory action", async ({ page }) => {
  await page.goto("/consumer");
  await expect(page.getByRole("heading", { name: /김서큐님/ })).toBeVisible();
  await page.evaluate(() => {
    history.pushState({}, "", "/consumer/capture?mode=video&job=11111111-1111-4111-8111-111111111111");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page).toHaveURL(/\/consumer\?tab=move&view=items&job=/);
  await expect(page.getByRole("button", { name: "AI 영상 촬영", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "침실 촬영" })).toHaveCount(0);
});

test("shows the shared code instead of delete after a quote is accepted", async ({ page }) => {
  await page.goto("/consumer?tab=move&view=list");
  await page.getByText("성수동 아파트 → 자양동 오피스텔").click();
  await page.getByRole("tab", { name: "확인서" }).click();
  await page.getByRole("button", { name: "견적서 확인" }).click();
  await page.getByRole("button", { name: "이대로 확인" }).click();
  await expect(page).toHaveURL(/\/consumer\?tab=move&view=agreement/);
  await page.getByRole("button", { name: "더보기" }).click();

  await expect(page.getByRole("heading", { name: "이사 연결 코드" })).toBeVisible();
  await expect(page.getByRole("button", { name: "코드 복사" })).toBeVisible();
  await expect(page.getByRole("button", { name: "이사 삭제" })).toHaveCount(0);
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
