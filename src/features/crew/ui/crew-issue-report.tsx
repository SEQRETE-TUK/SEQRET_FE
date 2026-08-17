import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CameraIcon as Camera,
  CheckCircleIcon as CheckCircle,
  LockIcon as Lock,
  WarningCircleIcon as WarningCircle,
} from "@phosphor-icons/react";
import { useRef, useState, type ChangeEvent } from "react";

import { mockApiEnabled } from "@/api/mock-api";
import { InfoCallout } from "@/components/layout/app-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  asSupportedContentType,
  completeMediaUpload,
  createCaptureSession,
  createMediaUpload,
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

export function CrewIssueReport({ brief, connection }: { brief: FieldBrief | undefined; connection: Connection }) {
  const queryClient = useQueryClient();
  const reference = useRef(crypto.randomUUID());
  const [checkKeys, setCheckKeys] = useState<string[]>([]);
  const [issueType, setIssueType] = useState<FieldIssue["issue_type"]>("site_blocker");
  const [title, setTitle] = useState(mockApiEnabled ? "엘리베이터 운행 중단" : "");
  const [description, setDescription] = useState(mockApiEnabled ? "점검 중이라 5층까지 계단 운반이 필요합니다." : "");
  const [evidenceId, setEvidenceId] = useState<string | null>(mockApiEnabled ? "mock-elevator-evidence" : null);
  const [submitted, setSubmitted] = useState(false);
  const jobQuery = useQuery({ queryKey: [...workflowKeys.root(connection.jobId), "job"], queryFn: () => getMoveJob(connection) });
  const refreshBrief = () => queryClient.invalidateQueries({ queryKey: workflowKeys.brief(connection.jobId) });
  const checkInMutation = useMutation({
    mutationFn: () => checkIn(connection, brief!.dispatch_id, checkKeys),
    onError: async (error) => { if (shouldRecoverState(error)) await refreshBrief(); },
    onSuccess: refreshBrief,
  });
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const roomZoneId = jobQuery.data?.locations.flatMap((location) => location.room_zones)[0]?.id;
      if (!roomZoneId) throw new Error("증거를 연결할 공간이 없습니다.");
      const capture = await createCaptureSession(connection);
      const target = await createMediaUpload({ ...connection, captureSessionId: capture.id, contentLength: file.size, contentType: asSupportedContentType(file), mediaPurpose: "change_evidence", roomZoneId });
      await uploadCaptureFile(target, file);
      return completeMediaUpload({ ...connection, captureSessionId: capture.id, mediaAssetId: target.asset.id });
    },
    onSuccess: (asset) => setEvidenceId(asset.id),
  });
  const issueMutation = useMutation({
    mutationFn: () => createFieldIssue(connection, {
      client_reference: reference.current,
      base_scope_version_id: brief!.scope_version_id,
      issue_type: issueType,
      title: title.trim(),
      description: description.trim(),
      evidence_media_asset_ids: [evidenceId!],
    }),
    onError: async (error) => { if (shouldRecoverState(error)) await queryClient.invalidateQueries({ queryKey: workflowKeys.fieldIssues(connection.jobId) }); },
    onSuccess: async () => { setSubmitted(true); await queryClient.invalidateQueries({ queryKey: workflowKeys.fieldIssues(connection.jobId) }); },
  });
  const allChecked = Boolean(brief && brief.check_in_items.every((item) => item.confirmed || checkKeys.includes(item.key)));
  const pickEvidence = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    event.target.value = "";
  };
  const error = checkInMutation.error ?? uploadMutation.error ?? issueMutation.error;

  return (
    <div className="px-[var(--content-gutter)] pb-28 pt-5">
      {!brief?.checked_in_at ? <section className="ui-card ui-card-pad mb-5">
        <p className="text-sm font-extrabold text-primary-700">현장 도착 확인</p>
        <h3 className="mt-2 text-xl font-extrabold">보고 전 체크인이 필요해요</h3>
        <div className="mt-4 space-y-2">{brief?.check_in_items.map((item) => <label className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3" key={item.key}><input checked={item.confirmed || checkKeys.includes(item.key)} onChange={(event) => setCheckKeys((current) => event.target.checked ? [...current, item.key] : current.filter((key) => key !== item.key))} type="checkbox" /><span className="text-sm font-bold">{item.label}</span></label>)}</div>
        <Button className="mt-4 w-full" disabled={!allChecked || checkInMutation.isPending} onClick={() => checkInMutation.mutate()}>현장 도착 체크인</Button>
      </section> : null}

      <section className="ui-card ui-card-pad">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-4 py-3"><span className="flex items-center gap-2 font-extrabold"><Lock aria-hidden="true" /> 기준 승인본 {brief?.scope_version_label ?? "–"}</span><span className="text-sm font-bold text-primary-700">내용 보기</span></div>
        <div className="mt-5"><h2 className="text-xl font-black">현장 사실과 증거를 남겨주세요</h2><p className="mt-1 text-sm leading-5 text-ink-600">업체가 보고 내용을 검토한 뒤 작업 범위와 금액을 고객에게 제안합니다.</p></div>
        <fieldset className="mt-6"><legend className="text-sm font-extrabold">어떤 문제인가요?</legend><div className="mt-2 grid grid-cols-3 overflow-hidden rounded-xl border border-line">{([
          ["out_of_scope", "범위 밖 작업"], ["site_blocker", "현장 장애"], ["damage_risk", "파손 위험"],
        ] as const).map(([id, label]) => <button aria-pressed={issueType === id} className={`min-h-12 border-r border-line px-1 text-xs font-extrabold last:border-r-0 ${issueType === id ? "bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-400" : "text-ink-600"}`} key={id} onClick={() => setIssueType(id)} type="button">{label}</button>)}</div></fieldset>
        <Label className="mt-5 block text-sm font-extrabold" htmlFor="issue-title">제목</Label>
        <Input aria-required="true" className="mt-2" id="issue-title" maxLength={100} onChange={(event) => setTitle(event.target.value)} placeholder="예: 엘리베이터 운행 중단" value={title} />
        <Label className="mt-5 block text-sm font-extrabold" htmlFor="issue-description">현장 설명</Label>
        <Textarea aria-required="true" className="mt-2 min-h-28" id="issue-description" maxLength={200} onChange={(event) => setDescription(event.target.value)} placeholder="무엇이 달라졌고 작업에 어떤 영향이 있는지 적어주세요." value={description} />
        <p className="mt-1 text-right text-xs text-ink-400">{description.length}/200</p>
        <h3 className="mt-5 text-sm font-extrabold">현장 증거</h3>
        {mockApiEnabled || evidenceId ? <img alt="엘리베이터 운행 중단 현장 증거" className="mt-2 aspect-[16/10] w-full rounded-[var(--radius-card)] object-cover" src="/elevator-outage-evidence.png" /> : <div className="mt-2 grid aspect-[16/10] place-items-center rounded-[var(--radius-card)] bg-surface-muted text-sm text-ink-600">현장 사진을 촬영해 주세요.</div>}
        <Label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-400 text-sm font-extrabold text-primary-700"><Camera aria-hidden="true" /> {uploadMutation.isPending ? "업로드 중…" : evidenceId ? "증거 다시 촬영" : "사진·영상 촬영"}<input accept="image/jpeg,image/png,video/mp4" className="sr-only" disabled={uploadMutation.isPending} onChange={pickEvidence} type="file" /></Label>
        <InfoCallout icon={<WarningCircle aria-hidden="true" />}>기사는 현장 사실만 보고하며 금액을 정하지 않아요.</InfoCallout>
        {error ? <p className="mt-3 text-sm font-bold text-danger">{apiErrorMessage(error)}</p> : null}
        {submitted ? <p className="mt-4 flex items-center gap-2 rounded-xl bg-success-bg p-4 text-sm font-extrabold text-success-ink"><CheckCircle aria-hidden="true" weight="fill" /> 업체에 현장 이슈를 전송했습니다.</p> : null}
        <Button className="mt-5 w-full whitespace-nowrap" disabled={!brief?.checked_in_at || !evidenceId || !title.trim() || !description.trim() || issueMutation.isPending || submitted} onClick={() => issueMutation.mutate()} size="cta"><Camera aria-hidden="true" /> {issueMutation.isPending ? "보고 중…" : "증거와 함께 업체에 보고"}</Button>
      </section>
    </div>
  );
}
