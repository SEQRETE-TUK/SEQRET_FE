import {
  FileMagnifyingGlassIcon as FileQuestion,
} from "@phosphor-icons/react";
import { ButtonLink } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <main className="mobile-stage" id="main-content">
      <div className="mobile-frame px-5">
        <header className="app-safe-header pb-3"><strong className="text-lg font-black tracking-[-0.04em] text-primary-800">SEQRET</strong></header>
        <section className="pt-14">
          <span className="grid size-12 place-items-center rounded-full bg-primary-50 text-primary-700"><FileQuestion aria-hidden="true" className="size-6" /></span>
          <p className="mt-6 text-sm font-bold text-primary-700">오류 404</p>
          <h1 className="mt-2 max-w-[18rem] text-[28px] leading-9 font-extrabold tracking-[-0.04em]">페이지를 찾을 수 없어요</h1>
          <p className="mt-3 max-w-[21rem] text-base leading-6 text-ink-600">주소가 바뀌었거나 현재 역할에서 열 수 없는 화면입니다.</p>
        <ButtonLink className="mt-8 w-full" href="/" size="cta">
          역할 선택으로 이동
        </ButtonLink>
        </section>
      </div>
    </main>
  );
}
