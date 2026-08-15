import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="text-sm font-bold text-primary-600">404</p>
        <h1 className="mt-2 text-2xl font-extrabold">페이지를 찾을 수 없어요</h1>
        <Link
          className="mt-6 inline-flex h-12 items-center rounded-2xl bg-primary-600 px-5 font-bold text-white hover:bg-primary-700"
          to="/"
        >
          고객 화면으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
