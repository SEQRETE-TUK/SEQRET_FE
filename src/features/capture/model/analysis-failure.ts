import type { CaptureAnalysis } from "@/features/capture/api/capture-api";

export interface AnalysisFailureCopy {
  description: string;
  title: string;
}

const preservedVideo = "촬영 영상은 보존됐어요.";

export function analysisFailureCopy(analysis: CaptureAnalysis): AnalysisFailureCopy {
  if (
    analysis.failure_stage === "parse" ||
    analysis.failure_detail_code === "schema_validation" ||
    analysis.failure_detail_code === "empty_response"
  ) {
    return {
      title: "AI 짐 목록 형식을 확인하지 못했어요",
      description: `AI가 만든 짐 목록 일부가 필수 형식에 맞지 않아 초안을 저장하지 못했어요. ${preservedVideo} 아래에서 직접 짐을 선택해 계속할 수 있어요.`,
    };
  }

  if (analysis.failure_stage === "source_map") {
    return {
      title: "촬영 영상과 AI 결과를 연결하지 못했어요",
      description: `AI 결과가 어느 촬영에서 나온 항목인지 확인하지 못했어요. ${preservedVideo} 아래에서 직접 짐을 선택해 계속할 수 있어요.`,
    };
  }

  if (analysis.failure_stage === "scope_import") {
    return {
      title: "AI 초안을 저장하지 못했어요",
      description: `AI 분석은 끝났지만 작업범위 초안으로 저장하는 과정에서 문제가 생겼어요. ${preservedVideo} 아래에서 직접 짐을 선택해 계속할 수 있어요.`,
    };
  }

  if (
    analysis.failure_detail_code === "provider_timeout" ||
    analysis.failure_detail_code === "provider_unavailable" ||
    analysis.retryable === true
  ) {
    return {
      title: "AI 서비스가 잠시 응답하지 않았어요",
      description: `${preservedVideo} 잠시 후 다시 시도하거나 아래에서 직접 짐을 선택해 계속해 주세요.`,
    };
  }

  if (
    analysis.failure_stage === "provider_call" ||
    analysis.failure_detail_code === "provider_rejected"
  ) {
    return {
      title: "AI 서비스가 영상을 처리하지 못했어요",
      description: `${preservedVideo} 같은 영상의 반복 전송보다 다시 촬영하거나 아래에서 직접 짐을 선택해 주세요.`,
    };
  }

  if (
    analysis.failure_stage === "input_lookup" ||
    analysis.failure_detail_code === "no_ready_media"
  ) {
    return {
      title: "분석할 촬영 영상을 찾지 못했어요",
      description: "영상 전송 상태를 확인하지 못했어요. 촬영 화면으로 돌아가 영상을 다시 선택해 주세요.",
    };
  }

  if (analysis.failure_stage === "result_load") {
    return {
      title: "AI 분석 결과를 불러오지 못했어요",
      description: `${preservedVideo} 아래에서 직접 짐을 선택해 계속할 수 있어요.`,
    };
  }

  return {
    title: "AI 분석을 완료하지 못했어요",
    description: `${preservedVideo} 다시 시도하거나 아래에서 직접 짐을 선택해 계속해 주세요.`,
  };
}
