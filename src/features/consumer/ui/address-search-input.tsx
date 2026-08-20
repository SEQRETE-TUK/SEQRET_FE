import { MagnifyingGlassIcon as MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";

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
    <button aria-label={value ? `주소 검색: ${value}` : "주소 검색"} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[var(--radius-component)] border border-line bg-surface px-4 text-left text-ui-control text-ink-900 focus-visible:border-primary-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-wait disabled:opacity-70" disabled={loading} id={id} onClick={search} type="button">
      <span className={value ? "min-w-0 truncate text-ui-body" : "min-w-0 truncate text-ui-body text-ink-400"}>{loading ? "주소 불러오는 중" : value || "주소를 검색해 주세요"}</span>
      <MagnifyingGlass aria-hidden="true" className="shrink-0 text-primary-700" size="var(--icon-sm)" />
    </button>
    {error ? <p className="mt-2 text-sm font-bold text-danger-ink" role="alert">{error} 다시 시도해 주세요.</p> : null}
  </div>;
}
