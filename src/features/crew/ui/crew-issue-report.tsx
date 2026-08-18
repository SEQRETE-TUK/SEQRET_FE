import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CameraIcon as Camera,
  CaretRightIcon as CaretRight,
  CheckCircleIcon as CheckCircle,
  ClipboardTextIcon as ClipboardText,
  PlusIcon as Plus,
  WarningCircleIcon as WarningCircle,
} from "@phosphor-icons/react";
import { useRef, useState, type ChangeEvent } from "react";

import { mockApiEnabled } from "@/api/mock-api";
import { InfoCallout } from "@/components/layout/app-primitives";
import { MobilePageHeader } from "@/components/layout/mobile-app-shell";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  asSupportedContentType,
  completeMediaUpload,
  createCaptureSession,
  createMediaUpload,
  getMediaConsentPolicy,
  uploadCaptureFile,
} from "@/features/capture/api/capture-api";
import {
  apiErrorMessage,
  checkIn,
  createFieldIssue,
  getMoveJob,
  shouldRecoverState,
  workflowKeys,
  type Connection,
  type FieldBrief,
  type FieldIssue,
} from "@/features/workflow/api/workflow-api";

const issueStatusLabel = (status: FieldIssue["status"]) => ({
  open: "업체 처리 대기",
  customer_review: "고객 확인 대기",
  clarification_requested: "설명 보완 중",
  approved: "확인서 반영 완료",
  rejected: "반영하지 않음",
})[status];
const issueTypeOptions = [
  { label: "범위 밖 작업", value: "out_of_scope" },
  { label: "현장 장애", value: "site_blocker" },
  { label: "파손 위험", value: "damage_risk" },
] as const;

type EvidenceDraft = { file: File | null; id: string; url: string };
const maxEvidenceCount = 5;

export function CrewIssueReport({ brief, connection, issues }: {
  brief: FieldBrief | undefined;
  connection: Connection;
  issues: FieldIssue[];
}) {
  const queryClient = useQueryClient();
  const reference = useRef(crypto.randomUUID());
  const [checkKeys, setCheckKeys] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [issueType, setIssueType] = useState<FieldIssue["issue_type"]>("site_blocker");
  const [title, setTitle] = useState(mockApiEnabled ? "엘리베이터 운행 중단" : "");
  const [description, setDescription] = useState(mockApiEnabled ? "점검 중이라 5층까지 계단 운반이 필요합니다." : "");
  const [evidence, setEvidence] = useState<EvidenceDraft[]>(mockApiEnabled ? [{ file: null, id: "mock-elevator-evidence", url: "/elevator-outage-evidence.png" }] : []);
  const [submitted, setSubmitted] = useState(false);
  const jobQuery = useQuery({ queryKey: [...workflowKeys.root(connection.jobId), "job"], queryFn: () => getMoveJob(connection) });
  const refreshBrief = () => queryClient.invalidateQueries({ queryKey: workflowKeys.brief(connection.jobId) });
  const checkInMutation = useMutation({
    mutationFn: () => checkIn(connection, brief!.dispatch_id, checkKeys),
    onError: async (error) => { if (shouldRecoverState(error)) await refreshBrief(); },
    onSuccess: refreshBrief,
  });
  const uploadMutation = useMutation({
    mutationFn: async (drafts: Array<Pick<EvidenceDraft, "file" | "url"> & { file: File }>) => {
      const roomZoneId = jobQuery.data?.locations.flatMap((location) => location.room_zones)[0]?.id;
      if (!roomZoneId) throw new Error("증거를 연결할 공간이 없습니다.");
      const policy = await getMediaConsentPolicy(connection);
      const capture = await createCaptureSession({ ...connection, consentPolicyVersion: policy.policy_version, privacyNoticeAcknowledged: true });
      return Promise.all(drafts.map(async ({ file, url }) => {
        const target = await createMediaUpload({ ...connection, captureSessionId: capture.id, contentLength: file.size, contentType: asSupportedContentType(file), mediaPurpose: "change_evidence", roomZoneId });
        await uploadCaptureFile(target, file);
        const asset = await completeMediaUpload({ ...connection, captureSessionId: capture.id, mediaAssetId: target.asset.id });
        return { file, id: asset.id, url };
      }));
    },
    onError: (_error, drafts) => drafts.forEach(({ url }) => URL.revokeObjectURL(url)),
    onSuccess: (assets) => setEvidence((current) => [...current, ...assets].slice(0, maxEvidenceCount)),
  });
  const issueMutation = useMutation({
    mutationFn: () => createFieldIssue(connection, {
      client_reference: reference.current,
      base_scope_version_id: brief!.scope_version_id,
      issue_type: issueType,
      title: title.trim(),
      description: description.trim(),
      evidence_media_asset_ids: evidence.map(({ id }) => id),
    }),
    onError: async (error) => { if (shouldRecoverState(error)) await queryClient.invalidateQueries({ queryKey: workflowKeys.fieldIssues(connection.jobId) }); },
    onSuccess: async () => {
      setSubmitted(true);
      await queryClient.invalidateQueries({ queryKey: workflowKeys.fieldIssues(connection.jobId) });
      setFormOpen(false);
    },
  });
  const checkedIn = Boolean(brief?.checked_in_at) || mockApiEnabled;
  const allChecked = Boolean(brief && brief.check_in_items.every((item) => item.confirmed || checkKeys.includes(item.key)));
  const pickEvidence = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])].slice(0, maxEvidenceCount - evidence.length);
    if (files.length) uploadMutation.mutate(files.map((file) => ({ file, url: URL.createObjectURL(file) })));
    event.target.value = "";
  };
  const removeEvidence = (item: EvidenceDraft) => {
    if (item.file) URL.revokeObjectURL(item.url);
    setEvidence((current) => current.filter((candidate) => candidate !== item));
  };
  const error = checkInMutation.error ?? uploadMutation.error ?? issueMutation.error;
  const sentIssues = issues.length > 0 ? issues : mockApiEnabled ? [{
    field_issue_id: "mock-issue",
    title: "엘리베이터 운행 중단",
    status: "open" as const,
    evidence_media_asset_ids: ["mock-evidence"],
    reported_at: "2026-08-18T09:18:00+09:00",
  }] : [];
  const selectedIssue = sentIssues.find((issue) => issue.field_issue_id === selectedIssueId);
  const selectedDescription = selectedIssue && "description" in selectedIssue ? selectedIssue.description : "현장 사실과 증거를 함께 제출한 보고입니다.";

  if (!checkedIn) {
    return <div className="px-[var(--content-gutter)] pb-28 pt-5"><section className="ui-card p-5"><p className="text-sm font-extrabold text-primary-700">현장 도착 확인</p><h2 className="mt-2 text-ui-section font-black">보고 전 체크인이 필요해요</h2><div className="mt-5 space-y-2">{brief?.check_in_items.map((item) => <label className="flex min-h-14 items-center gap-3 rounded-xl border border-line px-4" key={item.key}><input checked={item.confirmed || checkKeys.includes(item.key)} onChange={(event) => setCheckKeys((current) => event.target.checked ? [...current, item.key] : current.filter((key) => key !== item.key))} type="checkbox" /><span className="text-sm font-bold">{item.label}</span></label>)}</div><Button className="mt-5 w-full" disabled={!allChecked || checkInMutation.isPending} onClick={() => checkInMutation.mutate()} size="cta">현장 도착 체크인</Button></section>{error ? <p className="mt-3 text-sm font-bold text-danger-ink" role="alert">{apiErrorMessage(error)}</p> : null}</div>;
  }

  if (formOpen) {
    return <Sheet onOpenChange={setFormOpen} open={formOpen}><SheetContent presentation="page" showClose={false}><MobilePageHeader onBack={() => setFormOpen(false)} title="새 현장 보고" /><SheetTitle className="sr-only">새 현장 보고</SheetTitle><SheetDescription className="sr-only">현장 사실과 증거를 업체에 보고합니다.</SheetDescription><div className="px-[var(--content-gutter)] pb-28 pt-4">
        <ChoiceGroup className="mt-2" columns={3} label="어떤 문제인가요?" onChange={(label) => setIssueType(issueTypeOptions.find((option) => option.label === label)?.value ?? "site_blocker")} options={issueTypeOptions.map((option) => option.label)} value={issueTypeOptions.find((option) => option.value === issueType)?.label ?? "현장 장애"} />
        <Label className="mt-5 block text-sm font-extrabold" htmlFor="issue-title">제목</Label><Input className="mt-2" id="issue-title" maxLength={100} onChange={(event) => setTitle(event.target.value)} placeholder="예: 엘리베이터 운행 중단" value={title} />
        <Label className="mt-5 block text-sm font-extrabold" htmlFor="issue-description">현장 설명</Label><Textarea className="mt-2 min-h-28" id="issue-description" maxLength={200} onChange={(event) => setDescription(event.target.value)} placeholder="무엇이 달라졌고 작업에 어떤 영향이 있는지 적어주세요." value={description} /><p className="mt-1 text-right text-xs text-ink-400">{description.length}/200</p>
        <h3 className="mt-5 text-sm font-extrabold">현장 증거</h3><div className="mt-2 grid grid-cols-3 gap-2">{evidence.map((item, index) => <div className="relative" key={item.id}><img alt={`현장 증거 ${index + 1}`} className="aspect-square w-full rounded-[var(--radius-card)] object-cover" src={item.url} /><button aria-label={`현장 증거 ${index + 1} 삭제`} className="absolute right-1 top-1 grid size-9 place-items-center rounded-full bg-ink-900/75 text-lg text-white" onClick={() => removeEvidence(item)} type="button">×</button></div>)}{evidence.length < maxEvidenceCount ? <Label className="grid aspect-square cursor-pointer place-items-center rounded-[var(--radius-card)] border border-dashed border-primary-300 bg-primary-50 text-center text-sm font-extrabold text-primary-700"><span><Plus aria-hidden="true" className="mx-auto mb-1" size="var(--icon-md)" />{uploadMutation.isPending ? "업로드 중…" : "사진 추가"}</span><input accept="image/jpeg,image/png" capture="environment" className="sr-only" disabled={uploadMutation.isPending} multiple onChange={pickEvidence} type="file" /></Label> : null}</div>
        <InfoCallout icon={<WarningCircle aria-hidden="true" />}>기사는 현장 사실만 보고하며 금액을 입력하지 않아요.</InfoCallout>{error ? <p className="mt-3 text-sm font-bold text-danger-ink" role="alert">{apiErrorMessage(error)}</p> : null}
        <div className="app-fixed-action fixed inset-x-0 bottom-0 z-[var(--z-sticky)] mx-auto w-full max-w-[var(--shell-mobile)] bg-surface px-[var(--content-gutter)] pt-3"><Button className="w-full" disabled={!evidence.length || uploadMutation.isPending || !title.trim() || !description.trim() || issueMutation.isPending} onClick={() => issueMutation.mutate()} size="cta">{issueMutation.isPending ? "보고 중…" : "이슈 보고"}</Button></div>
    </div></SheetContent></Sheet>;
  }

  return <div className="space-y-5 px-[var(--content-gutter)] pb-28 pt-4">
    <section className="ui-card p-5 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-primary-50 text-primary-700"><ClipboardText aria-hidden="true" size="var(--icon-category)" weight="duotone" /></span><h2 className="mt-4 text-ui-section font-black">승인본과 다른 점이 있나요?</h2><p className="mt-2 text-sm leading-6 text-ink-600">현장 사실과 사진을 업체에 보내면 업체가 변경 범위와 금액을 제안해요.</p><Button className="mt-5 w-full" onClick={() => setFormOpen(true)} size="cta"><Camera aria-hidden="true" /> 새 현장 보고</Button></section>
      <section><h2 className="text-ui-section font-black">내가 보낸 보고 <span className="text-primary-700">{sentIssues.length}건</span></h2><div className="mt-3 ui-card overflow-hidden">{sentIssues.map((issue) => <button aria-label={`${issue.title} 상세 보기`} className="flex min-h-20 w-full items-center gap-3 border-b border-line px-4 text-left last:border-b-0 hover:bg-surface-muted" key={issue.field_issue_id} onClick={() => setSelectedIssueId(issue.field_issue_id)} type="button">{mockApiEnabled ? <img alt={`${issue.title} 현장 증거`} className="size-11 shrink-0 rounded-xl object-cover" src="/elevator-outage-evidence.png" /> : <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-warning-bg text-warning-ink"><WarningCircle aria-hidden="true" size="var(--icon-md)" /></span>}<span className="min-w-0 flex-1"><strong className="block truncate text-ui-support">{issue.title}</strong><span className="mt-1 block text-xs text-ink-600">증거 {issue.evidence_media_asset_ids.length}건 · {new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" }).format(new Date(issue.reported_at))}</span></span><span className="shrink-0 text-xs font-extrabold text-primary-700">{issueStatusLabel(issue.status)}</span><CaretRight aria-hidden="true" className="shrink-0 text-ink-400" size="var(--icon-sm)" /></button>)}</div></section>
      {selectedIssue ? <Sheet onOpenChange={(open) => { if (!open) setSelectedIssueId(null); }} open><SheetContent className="!bg-ink-900 [&>button]:bg-ink-900/70 [&>button]:text-white [&>button]:hover:bg-ink-900/90"><img alt={`${selectedIssue.title} 현장 증거`} className="aspect-[16/10] w-full object-cover" src="/elevator-outage-evidence.png" /><div className="bg-surface px-4 pt-5"><SheetHeader className="px-0 pb-4 pr-0"><SheetTitle>{selectedIssue.title}</SheetTitle><SheetDescription>{issueStatusLabel(selectedIssue.status)} · 증거 {selectedIssue.evidence_media_asset_ids.length}건</SheetDescription></SheetHeader><p className="pb-6 text-sm leading-6 text-ink-600">{selectedDescription}</p></div></SheetContent></Sheet> : null}
    {submitted ? <p className="flex items-center gap-2 rounded-xl bg-success-bg p-4 text-sm font-extrabold text-success-ink"><CheckCircle aria-hidden="true" weight="fill" /> 업체에 현장 이슈를 전송했습니다.</p> : null}
    <InfoCallout icon={<WarningCircle aria-hidden="true" />}>기사는 현장 사실만 보고하며 금액을 입력하지 않아요.</InfoCallout>
  </div>;
}
