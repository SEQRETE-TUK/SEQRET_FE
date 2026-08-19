import type { NotificationEventType } from "@/features/workflow/api/workflow-api";

export const notificationCopy: Record<NotificationEventType, { description: string; label: string; title: string }> = {
  "capture_submitted.v1": { label: "촬영 접수", title: "촬영 자료가 접수됐어요", description: "분석과 작업범위 초안을 준비하고 있어요." },
  "analysis_completed.v1": { label: "분석 완료", title: "촬영 분석이 완료됐어요", description: "분석 결과와 작업범위 초안을 확인해 주세요." },
  "analysis_failed.v1": { label: "분석 확인", title: "촬영 분석을 완료하지 못했어요", description: "촬영 자료를 확인하거나 직접 항목을 입력해 주세요." },
  "scope_locked.v1": { label: "범위 확정", title: "작업범위가 확정됐어요", description: "현장에서는 최신 승인본을 기준으로 작업해 주세요." },
  "change_requested.v1": { label: "현장 변경", title: "현장 변경 요청이 도착했어요", description: "증빙과 변경 내용을 확인해 주세요." },
  "dispatch_confirmed.v1": { label: "배차 확정", title: "배차가 확정됐어요", description: "일정과 현장 조건을 확인해 주세요." },
  "completion_media_submitted.v1": { label: "완료 사진", title: "완료 사진이 등록됐어요", description: "작업 후 상태를 확인할 수 있어요." },
  "completion_submitted.v1": { label: "완료 제출", title: "기사가 완료 내용을 제출했어요", description: "체크리스트와 완료 자료를 검토해 주세요." },
  "completion_requested.v1": { label: "완료 확인", title: "완료 확인 요청이 도착했어요", description: "완료 자료를 확인하고 응답해 주세요." },
  "completion_decided.v1": { label: "고객 응답", title: "고객이 완료 요청에 응답했어요", description: "완료 상태와 문제 신고 여부를 확인해 주세요." },
  "media_deleted.v1": { label: "자료 보관", title: "증빙 자료 보관이 종료됐어요", description: "정해진 보관기간이 끝난 자료입니다." },
};

export const notificationDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
