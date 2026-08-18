import { MagnifyingGlassIcon as MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";

import { Input } from "@/components/ui/input";

type PostcodeResult = {
  address: string;
  autoJibunAddress?: string;
  autoRoadAddress?: string;
  jibunAddress?: string;
  roadAddress?: string;
  userSelectedType?: "J" | "R";
};

type PostcodeConstructor = new (options: {
  oncomplete: (data: PostcodeResult) => void;
  onclose?: () => void;
}) => { open: () => void };

declare global {
  interface Window {
    kakao?: { Postcode?: PostcodeConstructor };
  }
}

const scriptId = "kakao-postcode-script";
const scriptSrc = "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

function loadPostcode() {
  if (window.kakao?.Postcode) return Promise.resolve(window.kakao.Postcode);
  return new Promise<PostcodeConstructor>((resolve, reject) => {
    const previous = document.getElementById(scriptId) as HTMLScriptElement | null;
    const script = previous ?? document.createElement("script");
    const complete = () => window.kakao?.Postcode ? resolve(window.kakao.Postcode) : reject(new Error("주소 검색을 불러오지 못했어요."));
    script.addEventListener("load", complete, { once: true });
    script.addEventListener("error", () => reject(new Error("주소 검색을 불러오지 못했어요.")), { once: true });
    if (!previous) {
      script.id = scriptId;
      script.src = scriptSrc;
      document.head.append(script);
    }
  });
}

export function AddressSearchInput({ id, onChange, value }: { id: string; onChange: (value: string) => void; value: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setLoading(true);
    setError(null);
    try {
      const Postcode = await loadPostcode();
      new Postcode({
        oncomplete: (data) => {
          const road = data.roadAddress || data.autoRoadAddress;
          const jibun = data.jibunAddress || data.autoJibunAddress;
          onChange((data.userSelectedType === "J" ? jibun : road) || road || jibun || data.address);
        },
      }).open();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "주소 검색을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  return <div>
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <Input autoComplete="street-address" id={id} onChange={(event) => onChange(event.target.value)} placeholder="도로명 또는 지번 주소" value={value} />
      <button className="inline-flex min-h-11 items-center justify-center gap-[var(--control-gap)] whitespace-nowrap rounded-[var(--radius-control)] border border-primary-400 bg-surface px-[var(--control-padding-x)] text-ui-control text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring" disabled={loading} onClick={search} type="button"><MagnifyingGlass aria-hidden="true" className="shrink-0" size="var(--icon-sm)" />{loading ? "불러오는 중" : "주소 검색"}</button>
    </div>
    {error ? <p className="mt-2 text-sm font-bold text-danger-ink" role="alert">{error} 직접 입력할 수도 있어요.</p> : null}
  </div>;
}
