import { expect, test, type Page, type Route } from "@playwright/test";

type ParticipantRole = "customer" | "company_manager" | "field_worker";

interface RecordedRequest {
  body: unknown;
  method: string;
  path: string;
}

const ids = {
  job: "11111111-1111-4111-8111-111111111111",
  customer: "22222222-2222-4222-8222-222222222222",
  company: "33333333-3333-4333-8333-333333333333",
  worker: "44444444-4444-4444-8444-444444444444",
  companyInvitation: "55555555-5555-4555-8555-555555555555",
  workerInvitation: "66666666-6666-4666-8666-666666666666",
  origin: "77777777-7777-4777-8777-777777777777",
  destination: "88888888-8888-4888-8888-888888888888",
  room: "99999999-9999-4999-8999-999999999999",
  scope: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  issue: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  proposal: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  setup: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  dispatch: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  vehicle: "ffffffff-ffff-4fff-8fff-ffffffffffff",
  workerOption: "12121212-1212-4212-8212-121212121212",
  completion: "13131313-1313-4313-8313-131313131313",
  completionRequest: "14141414-1414-4414-8414-141414141414",
};

const customerSecret = "customer_secret_".padEnd(48, "c");
const companySecret = "company_secret_".padEnd(48, "m");
const workerSecret = "worker_secret_".padEnd(48, "w");
const scheduledAt = "2026-09-01T09:00:00+09:00";
const now = "2026-08-16T06:00:00Z";

function participantId(role: ParticipantRole) {
  if (role === "customer") return ids.customer;
  if (role === "company_manager") return ids.company;
  return ids.worker;
}

function actor(role: ParticipantRole) {
  return {
    display_name: role === "customer" ? "테스트 고객" : role === "company_manager" ? "테스트 업체" : "테스트 기사",
    expires_at: "2026-09-16T06:00:00Z",
    invitation: null,
    job_id: ids.job,
    participant_id: participantId(role),
    permissions: [],
    role,
  };
}

const job = {
  completed_at: null,
  created_at: now,
  id: ids.job,
  locations: [
    {
      id: ids.origin,
      kind: "origin",
      label: "성수동",
      room_zones: [{ id: ids.room, name: "거실", sort_order: 0 }],
    },
    {
      id: ids.destination,
      kind: "destination",
      label: "합정동",
      room_zones: [{ id: "15151515-1515-4515-8515-151515151515", name: "전체", sort_order: 0 }],
    },
  ],
  participants: [
    { display_name: "테스트 고객", id: ids.customer, role: "customer" },
    { display_name: "테스트 업체", id: ids.company, role: "company_manager" },
    { display_name: "테스트 기사", id: ids.worker, role: "field_worker" },
  ],
  scheduled_at: scheduledAt,
  status: "active",
  title: "브라우저 계약 테스트",
};

const jobHeader = {
  company_display_name: "테스트 업체",
  customer_display_name: "테스트 고객",
  destination_summary: "합정동",
  job_code: "SEQRET-E2E",
  job_id: ids.job,
  origin_summary: "성수동",
  scheduled_at: scheduledAt,
  title: job.title,
  viewer_display_name: "테스트 사용자",
  viewer_role: "customer",
};

function invitation(role: "company_manager" | "field_worker") {
  const company = role === "company_manager";
  return {
    display_name: company ? "테스트 업체" : "테스트 기사",
    expires_at: "2026-09-16T06:00:00Z",
    id: company ? ids.companyInvitation : ids.workerInvitation,
    invitee_participant_id: company ? ids.company : ids.worker,
    issued_at: now,
    issuer_participant_id: company ? ids.customer : ids.company,
    job_id: ids.job,
    resolved_at: now,
    role,
    status: "accepted",
  };
}

function scopeReview(status: "company_review" | "customer_review" | "confirmed") {
  return {
    company_confirmed_at: status === "confirmed" ? now : null,
    customer_confirmed_at: status === "confirmed" ? now : null,
    job: jobHeader,
    media_previews: [],
    proposal_id: status === "company_review" ? null : ids.proposal,
    proposal_reason: status === "company_review" ? null : "기본 견적",
    quote: status === "company_review"
      ? null
      : { adjustments: [], base_amount_krw: 250_000, total_amount_krw: 250_000 },
    revision_request: null,
    scope: {
      exclusion_count: 0,
      exclusions: [],
      id: ids.scope,
      included_works: ["포장", "운송"],
      item_count: 1,
      review_required_count: 0,
      room_groups: [{
        item_count: 1,
        items: [{
          description: "소파 1개",
          item_key: "sofa",
          review_required: false,
          room_zone_id: ids.room,
          source_media_asset_ids: [],
        }],
        label: "거실",
        review_required_count: 0,
        room_zone_id: ids.room,
      }],
      status,
      version_label: "범위 v1",
      work_count: 2,
    },
  };
}

function fieldIssue(proposalCreated: boolean) {
  return {
    base_scope_version_id: ids.scope,
    change_proposal_id: proposalCreated ? ids.proposal : null,
    client_reference: "16161616-1616-4616-8616-161616161616",
    description: "추가 상자를 운반해야 합니다.",
    evidence_media_asset_ids: ["17171717-1717-4717-8717-171717171717"],
    field_issue_id: ids.issue,
    issue_type: "out_of_scope",
    job_id: ids.job,
    reported_at: now,
    reported_by_participant_id: ids.worker,
    status: proposalCreated ? "customer_review" : "open",
    title: "추가 이삿짐",
  };
}

function changeProposal(status: "pending" | "approved") {
  return {
    base_scope_version_id: ids.scope,
    base_scope_version_label: "범위 v1",
    clarification_note: null,
    clarification_requested_at: null,
    decided_at: status === "approved" ? now : null,
    decision_note: null,
    evidence_media: [],
    explained_at: null,
    explanation: null,
    field_issue_id: ids.issue,
    job: jobHeader,
    proposal_id: ids.proposal,
    quote: {
      adjustments: [{ amount_krw: 50_000, label: "추가 이삿짐" }],
      base_amount_krw: 250_000,
      total_amount_krw: 300_000,
    },
    reason: "추가 상자 운반",
    requested_at: now,
    result_scope_version_id: status === "approved" ? ids.scope : null,
    status,
    title: "추가 이삿짐",
  };
}

function dispatchView(status: "setup_required" | "ready" | "confirmed") {
  const configured = status !== "setup_required";
  return {
    checks: configured ? [{ detail: "선택 가능", key: "capacity", status: "pass" }] : [],
    confirmed_at: status === "confirmed" ? now : null,
    dispatch_id: status === "confirmed" ? ids.dispatch : null,
    job: { ...jobHeader, viewer_role: "company_manager" },
    lead_worker_id: status === "confirmed" ? ids.workerOption : null,
    notification_created: status === "confirmed",
    requirements: configured ? {
      expected_duration_minutes: 480,
      required_certifications: [],
      required_skills: [],
      required_vehicle_capacity_m2: 28,
      required_vehicle_count: 1,
      required_worker_count: 1,
      start_at: scheduledAt,
    } : null,
    selected_vehicle_id: status === "confirmed" ? ids.vehicle : null,
    selected_worker_ids: status === "confirmed" ? [ids.workerOption] : [],
    setup_id: configured ? ids.setup : null,
    source_scope_version_id: configured ? ids.scope : null,
    source_scope_version_label: configured ? "범위 v1" : null,
    status,
    vehicle_options: configured ? [{
      available: true,
      capacity_m2: 28,
      conflict_reason: null,
      display_name: "5톤 탑차",
      equipment: [],
      external_reference: "vehicle-primary",
      id: ids.vehicle,
      specification: "28㎡ 적재",
    }] : [],
    worker_note: null,
    worker_options: configured ? [{
      available: true,
      certifications: [],
      conflict_reason: null,
      display_name: "테스트 기사",
      external_reference: "worker-1",
      id: ids.workerOption,
      participant_id: ids.worker,
      role_label: "팀장",
      skills: [],
    }] : [],
  };
}

function fieldBrief(checkedIn: boolean, submitted: boolean) {
  return {
    assigned_vehicle: dispatchView("ready").vehicle_options[0],
    assigned_worker_count: 1,
    assigned_workers: [{
      display_name: "테스트 기사",
      external_reference: "worker-1",
      is_lead: true,
      role_label: "팀장",
      worker_id: ids.workerOption,
    }],
    checked_in_at: checkedIn ? now : null,
    check_in_items: [
      { confirmed: checkedIn, key: "vehicle_checked", label: "차량과 적재 장비 확인" },
      { confirmed: checkedIn, key: "scope_checked", label: "최신 작업범위 확인" },
      { confirmed: checkedIn, key: "safety_checked", label: "현장 안전사항 확인" },
    ],
    completion_check_items: [
      { confirmed: submitted, key: "tools_removed", label: "작업 도구와 자재 회수" },
      { confirmed: submitted, key: "site_restored", label: "출발지와 도착지 정리" },
      { confirmed: submitted, key: "changes_recorded", label: "변경·이슈 기록 확인" },
    ],
    completion_required_count: 3,
    completion_submission_id: submitted ? ids.completion : null,
    dispatch_id: ids.dispatch,
    field_check_required_count: 3,
    job: { ...jobHeader, viewer_role: "field_worker" },
    lead_worker_name: "테스트 기사",
    masked_destination: "합정동",
    masked_origin: "성수동",
    origin_conditions: [],
    required_skills: [],
    safety_notice: "승인된 범위 밖 작업은 먼저 보고하세요.",
    scope_version_id: ids.scope,
    scope_version_label: "범위 v1",
    start_at: scheduledAt,
  };
}

function completionSummary(requested: boolean, confirmed = false) {
  return {
    approved_scope_version_id: ids.scope,
    approved_scope_version_label: "범위 v1",
    archive_ready: confirmed,
    checklist: { completed_count: 3, total_count: 3 },
    completed_at: confirmed ? now : null,
    completion_media: [],
    completion_media_count: 0,
    completion_request: requested || confirmed ? {
      client_reference: "18181818-1818-4818-8818-181818181818",
      completion_request_id: ids.completionRequest,
      completion_submission_id: ids.completion,
      decided_at: confirmed ? now : null,
      expires_at: "2026-09-08T09:00:00+09:00",
      notification_created: true,
      problem_report: null,
      requested_at: now,
      revoked_at: null,
      status: confirmed ? "confirmed" : "requested",
      unrecorded_extra_charge: confirmed ? false : null,
    } : null,
    completion_submission_id: ids.completion,
    documents: [
      { key: "quote", name: "견적서", status: confirmed ? "ready" : "not_ready" },
    ],
    duration_minutes: 480,
    field_changes: [],
    final_amount_krw: 300_000,
    job: jobHeader,
    job_status: confirmed ? "completed" : "active",
    onsite_confirmation_completed: true,
    problem_report_count: 0,
    quote: {
      adjustments: [{ amount_krw: 50_000, label: "추가 이삿짐" }],
      base_amount_krw: 250_000,
      total_amount_krw: 300_000,
    },
    retention_until: confirmed ? "2026-09-15T06:00:00Z" : null,
    worker_shifts: [],
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    body: JSON.stringify(body),
    contentType: "application/json",
    status,
  });
}

async function installApiMock(page: Page, role: ParticipantRole) {
  const requests: RecordedRequest[] = [];
  const state = {
    changeStatus: "pending" as "pending" | "approved",
    checkedIn: false,
    completionConfirmed: false,
    completionRequested: role === "customer",
    completionSubmitted: role !== "field_worker",
    dispatchStatus: "setup_required" as "setup_required" | "ready" | "confirmed",
    proposalCreated: role === "customer",
    scopeStatus: role === "company_manager" ? "company_review" as const : "customer_review" as const,
  };

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;
    const body = request.postDataJSON() as unknown;
    requests.push({ body, method, path });

    if (method === "GET" && path === "/api/v1/me") {
      await fulfillJson(route, actor(role));
      return;
    }
    if (method === "POST" && path === "/api/v1/move-jobs/onboarding") {
      await fulfillJson(route, {
        customer_access_link: {
          expires_at: "2026-09-16T06:00:00Z",
          id: "19191919-1919-4919-8919-191919191919",
          job_id: ids.job,
          participant_id: ids.customer,
          role: "customer",
          secret: customerSecret,
        },
        job,
      }, 201);
      return;
    }

    const prefix = `/api/v1/move-jobs/${ids.job}`;
    if (method === "GET" && path === prefix) {
      await fulfillJson(route, job);
      return;
    }
    if (method === "GET" && path === `${prefix}/invitations`) {
      await fulfillJson(route, {
        invitations: role === "company_manager" ? [invitation("field_worker")] : [],
      });
      return;
    }
    if (method === "POST" && path === `${prefix}/invitations`) {
      const issued = invitation("company_manager");
      await fulfillJson(route, {
        access_link: {
          expires_at: "2026-09-16T06:00:00Z",
          id: "20202020-2020-4020-8020-202020202020",
          job_id: ids.job,
          participant_id: ids.company,
          role: "company_manager",
          secret: companySecret,
        },
        invitation: issued,
      }, 201);
      return;
    }
    if (method === "GET" && path === `${prefix}/scope-review`) {
      await fulfillJson(route, scopeReview(state.scopeStatus));
      return;
    }
    if (method === "POST" && path === `${prefix}/scope-proposals`) {
      state.scopeStatus = "customer_review";
      await fulfillJson(route, {
        proposal_id: ids.proposal,
        quote: { adjustments: [], base_amount_krw: 250_000, total_amount_krw: 250_000 },
      }, 201);
      return;
    }
    if (method === "POST" && path === `${prefix}/scope-review/confirm`) {
      state.scopeStatus = "confirmed";
      await fulfillJson(route, { scope_version_id: ids.scope });
      return;
    }
    if (method === "POST" && path === `${prefix}/scope-review/revision-request`) {
      await fulfillJson(route, { revision_request_id: "21212121-2121-4121-8121-212121212121" }, 201);
      return;
    }
    if (method === "GET" && path === `${prefix}/field-issues`) {
      await fulfillJson(route, role === "company_manager" ? [fieldIssue(state.proposalCreated)] : []);
      return;
    }
    if (method === "POST" && path === `${prefix}/change-proposals`) {
      state.proposalCreated = true;
      await fulfillJson(route, {
        base_scope_version_id: ids.scope,
        field_issue_id: ids.issue,
        proposal_id: ids.proposal,
        quote: changeProposal("pending").quote,
        requested_at: now,
        result_scope_version_id: null,
        status: "pending",
      }, 201);
      return;
    }
    if (method === "GET" && path === `${prefix}/change-proposals/${ids.proposal}`) {
      await fulfillJson(route, changeProposal(state.changeStatus));
      return;
    }
    if (method === "POST" && path === `${prefix}/change-proposals/${ids.proposal}/decision`) {
      state.changeStatus = "approved";
      await fulfillJson(route, {
        decision: "approve",
        proposal_id: ids.proposal,
        result_scope_version_id: ids.scope,
        status: "approved",
      });
      return;
    }
    if (method === "GET" && path === `${prefix}/dispatch`) {
      await fulfillJson(route, dispatchView(state.dispatchStatus));
      return;
    }
    if (method === "POST" && path === `${prefix}/dispatch/setup`) {
      state.dispatchStatus = "ready";
      await fulfillJson(route, dispatchView("ready"), 201);
      return;
    }
    if (method === "PUT" && path === `${prefix}/dispatch`) {
      state.dispatchStatus = "confirmed";
      await fulfillJson(route, dispatchView("confirmed"));
      return;
    }
    if (method === "GET" && path === `${prefix}/field-brief`) {
      await fulfillJson(route, fieldBrief(state.checkedIn, state.completionSubmitted));
      return;
    }
    if (method === "POST" && path === `${prefix}/check-ins`) {
      state.checkedIn = true;
      await fulfillJson(route, {
        check_in_id: "22222222-aaaa-4222-8222-222222222222",
        checked_in_at: now,
        confirmed_check_keys: ["vehicle_checked", "scope_checked", "safety_checked"],
        dispatch_id: ids.dispatch,
        participant_id: ids.worker,
      }, 201);
      return;
    }
    if (method === "GET" && path === `${prefix}/capture-sessions`) {
      await fulfillJson(route, []);
      return;
    }
    if (method === "POST" && path === `${prefix}/completion-submissions`) {
      state.completionSubmitted = true;
      await fulfillJson(route, { completion_submission_id: ids.completion }, 201);
      return;
    }
    if (method === "GET" && path === `${prefix}/completion-summary`) {
      await fulfillJson(route, completionSummary(state.completionRequested, state.completionConfirmed));
      return;
    }
    if (method === "POST" && path === `${prefix}/completion-requests`) {
      state.completionRequested = true;
      await fulfillJson(route, completionSummary(true).completion_request, 201);
      return;
    }
    if (method === "POST" && path === `${prefix}/completion-requests/${ids.completionRequest}/decision`) {
      state.completionConfirmed = true;
      await fulfillJson(route, {
        completed_at: now,
        completion_request_id: ids.completionRequest,
        decided_at: now,
        decision: "confirm",
        job_status: "completed",
        problem_report: null,
        retention_scheduled_count: 0,
        status: "confirmed",
      });
      return;
    }
    if (method === "GET" && path === `${prefix}/documents/archive`) {
      await route.fulfill({
        body: "PK synthetic archive",
        headers: { "Content-Disposition": 'attachment; filename="seqret-documents.zip"' },
        status: 200,
      });
      return;
    }

    await fulfillJson(route, { detail: `Unhandled mock route: ${method} ${path}` }, 500);
  });

  return { requests, state };
}

async function connect(page: Page, role: ParticipantRole, secret: string) {
  await page.goto("/");
  const labels: Record<ParticipantRole, string> = {
    company_manager: "업체",
    customer: "사용자",
    field_worker: "작업자",
  };
  await page.getByRole("group", { name: "연결 역할" }).getByRole("button", { name: new RegExp(labels[role]) }).click();
  await page.getByLabel("Bearer 보안코드").fill(secret);
  await page.getByRole("button", { name: `${labels[role]}로 연결` }).click();
}

test("customer onboarding issues an invitation without persisting its secret", async ({ page }) => {
  const consoleMessages: string[] = [];
  page.on("console", (message) => consoleMessages.push(message.text()));
  const { requests } = await installApiMock(page, "customer");

  await page.goto("/");
  await page.getByLabel("이름", { exact: true }).fill("테스트 고객");
  await page.getByLabel("작업 이름").fill("브라우저 계약 테스트");
  await page.getByLabel("예정 일시").fill("2026-09-01T09:00");
  await page.getByLabel("출발지 표시명").fill("성수동");
  await page.getByLabel("도착지 표시명").fill("합정동");
  await page.getByRole("button", { name: "새 이사 만들기" }).click();

  await expect(page).toHaveURL(/\/consumer$/);
  await expect(page.getByRole("heading", { name: "내 이사 진행" })).toBeVisible();
  await page.getByLabel("초대 대상 이름").fill("테스트 업체");
  await page.getByRole("button", { name: "초대", exact: true }).click();
  await expect(page.getByText("지금 전달할 보안코드")).toBeVisible();

  const onboarding = requests.find(({ path }) => path.endsWith("/onboarding"));
  expect(onboarding?.body).toMatchObject({
    customer_display_name: "테스트 고객",
    locations: [
      { kind: "origin", label: "성수동" },
      { kind: "destination", label: "합정동" },
    ],
  });
  const issued = requests.find(({ method, path }) => method === "POST" && path.endsWith("/invitations"));
  expect(issued?.body).toEqual({ display_name: "테스트 업체", role: "company_manager" });
  await expect(page.locator("body")).not.toContainText(companySecret);
  expect(page.url()).not.toContain(companySecret);
  expect(consoleMessages.join("\n")).not.toContain(companySecret);
  expect(await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }))).toEqual({ local: [], session: [] });
});

test("provider sends quote, change, dispatch, and completion commands", async ({ page }) => {
  const { requests } = await installApiMock(page, "company_manager");
  await connect(page, "company_manager", companySecret);

  await expect(page).toHaveURL(/\/provider\/web$/);
  await expect(page.getByRole("heading", { name: "업체 운영" })).toBeVisible();
  await page.getByLabel("총 견적 금액").fill("250000");
  await page.getByRole("button", { name: "견적 제안 보내기" }).click();
  await expect.poll(() => requests.filter(({ path }) => path.endsWith("/scope-proposals")).length).toBe(1);
  await expect(page.getByText("250,000원").first()).toBeVisible();

  await page.getByLabel("증감 금액").fill("50000");
  await page.getByLabel("고객에게 보일 사유").fill("추가 상자 운반");
  await page.getByRole("button", { name: "변경안 고객에게 보내기" }).click();
  await expect.poll(() => requests.filter(({ path }) => path.endsWith("/change-proposals")).length).toBe(1);

  await page.getByRole("button", { name: "배차 후보 등록" }).click();
  await expect(page.getByRole("button", { name: "배차 확정" })).toBeVisible();
  await page.getByRole("button", { name: "배차 확정" }).click();
  await expect(page.getByText(/배차 확정 ·/)).toBeVisible();

  await page.getByRole("button", { name: "고객 완료 확인 요청" }).click();
  await expect.poll(() => requests.filter(({ path }) => path.endsWith("/completion-requests")).length).toBe(1);

  expect(requests.find(({ path }) => path.endsWith("/scope-proposals"))?.body).toMatchObject({
    source_scope_version_id: ids.scope,
    quote: { total_amount_krw: 250_000 },
  });
  expect(requests.find(({ path }) => path.endsWith("/change-proposals"))?.body).toMatchObject({
    base_scope_version_id: ids.scope,
    field_issue_id: ids.issue,
    quote: { total_amount_krw: 300_000 },
  });
  expect(requests.find(({ path }) => path.endsWith("/dispatch/setup"))?.body).toMatchObject({
    required_worker_count: 1,
    source_scope_version_id: ids.scope,
  });
  expect(requests.find(({ method, path }) => method === "PUT" && path.endsWith("/dispatch"))?.body).toMatchObject({
    lead_worker_id: ids.workerOption,
    setup_id: ids.setup,
    vehicle_id: ids.vehicle,
  });
});

test("crew checks in and submits the immutable completion command", async ({ page }) => {
  const { requests } = await installApiMock(page, "field_worker");
  await connect(page, "field_worker", workerSecret);

  await expect(page).toHaveURL(/\/crew$/);
  await expect(page.getByRole("heading", { name: "오늘 현장 작업" })).toBeVisible();
  for (const label of ["차량과 적재 장비 확인", "최신 작업범위 확인", "현장 안전사항 확인"]) {
    await page.getByLabel(label).check();
  }
  await page.getByRole("button", { name: "현장 도착 체크인" }).click();
  await expect(page.getByRole("button", { name: "체크인 완료" })).toBeVisible();

  for (const label of ["작업 도구와 자재 회수", "출발지와 도착지 정리", "변경·이슈 기록 확인"]) {
    await page.getByLabel(label).check();
  }
  await page.getByLabel("고객이 현장에서 완료를 확인했어요").check();
  await page.getByRole("button", { name: "작업 완료 기록 제출" }).click();
  await expect(page.getByText("완료 기록 제출됨")).toBeVisible();

  const checkIn = requests.find(({ path }) => path.endsWith("/check-ins"));
  expect(checkIn?.body).toEqual({
    confirmed_check_keys: ["vehicle_checked", "scope_checked", "safety_checked"],
    dispatch_id: ids.dispatch,
  });
  const completion = requests.find(({ path }) => path.endsWith("/completion-submissions"));
  expect(completion?.body).toMatchObject({
    completed_check_keys: ["tools_removed", "site_restored", "changes_recorded"],
    completion_media_asset_ids: [],
    dispatch_id: ids.dispatch,
    onsite_customer_confirmed: true,
    scope_version_id: ids.scope,
    worker_shifts: [{ worker_id: ids.workerOption }],
  });
});

test("customer confirms scope, field change, and completion", async ({ page }) => {
  const { requests } = await installApiMock(page, "customer");
  await connect(page, "customer", customerSecret);

  await expect(page).toHaveURL(/\/consumer$/);
  await page.getByRole("button", { name: "이 범위 확인" }).click();
  await expect.poll(() => requests.filter(({ path }) => path.endsWith("/scope-review/confirm")).length).toBe(1);

  await page.getByLabel("변경 제안 ID").fill(ids.proposal);
  await page.getByRole("button", { name: "열기" }).click();
  await expect(page.getByRole("heading", { name: "추가 이삿짐" })).toBeVisible();
  await page.getByRole("button", { name: "승인하기" }).click();
  await expect.poll(() => requests.filter(({ path }) => path.endsWith("/decision")).length).toBe(1);

  await page.getByRole("button", { name: "추가금 없음" }).click();
  await page.getByRole("button", { name: "완료 확인" }).click();
  await expect.poll(() => requests.filter(({ path }) => path.endsWith("/decision")).length).toBe(2);

  expect(requests.find(({ path }) => path.endsWith("/scope-review/confirm"))?.body).toEqual({
    scope_version_id: ids.scope,
  });
  const decisions = requests.filter(({ path }) => path.endsWith("/decision"));
  expect(decisions[0]?.body).toEqual({ decision: "approve" });
  expect(decisions[1]?.body).toEqual({ decision: "confirm", unrecorded_extra_charge: false });
});
