import {
  LinkIcon as Link2,
  ArrowClockwiseIcon as RefreshCw,
} from "@phosphor-icons/react";
import {
  WarningStatusIcon as AlertTriangle,
} from "@/components/icons";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useDemoFeedback } from "@/features/scope/model/demo-feedback-context";

interface DemoLinkStateProps {
  state: "link-expired" | "link-revoked" | "link-invalid";
  roleLabel: string;
}

const copy = {
  "link-expired": ["링크 사용 기간이 끝났어요", "작업 정보는 보여주지 않았어요. 링크를 보낸 사람에게 새 링크를 요청해 주세요."],
  "link-revoked": ["이 링크는 더 이상 사용할 수 없어요", "보안을 위해 폐기된 링크예요. 기존 링크로는 작업과 미디어에 접근할 수 없어요."],
  "link-invalid": ["올바른 작업 링크가 아니에요", "주소를 다시 확인하거나 초대를 보낸 사람에게 새 링크를 요청해 주세요."],
} as const;

export function DemoLinkState({ state, roleLabel }: DemoLinkStateProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const notify = useDemoFeedback();
  const [title, description] = copy[state];

  return (
    <div className="demo-screen-enter flex min-h-[832px] flex-col bg-canvas px-6 pb-8 pt-20 text-ink-900">
      <span className="demo-pop grid size-14 place-items-center rounded-2xl bg-warning-bg text-warning">
        <AlertTriangle size={28} />
      </span>
      <p className="mt-5 text-ui-support font-bold text-ink-400">{roleLabel} 링크 확인</p>
      <h1 className="mt-2 text-ui-title-lg font-extrabold leading-[32px]">{title}</h1>
      <p className="mt-3 text-lg leading-6 text-ink-600">{description}</p>
      <div className="mt-6 rounded-2xl bg-white p-4 text-ui-support leading-5 text-ink-400">
        <Link2 className="mr-2 inline" size={16} />
        만료·폐기·잘못된 링크에서는 고객명, 주소, 금액 같은 민감정보를 노출하지 않아요.
      </div>
      <div className="mt-auto space-y-3">
        <Button className="w-full" onClick={() => notify("새 링크 요청 방법을 안내했어요.")} size="cta">
          <RefreshCw size={17} /> 새 링크 요청 안내
        </Button>
        <Button className="w-full" onClick={() => navigate(pathname, { replace: true })} size="cta" variant="outline">
          처음 화면으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
