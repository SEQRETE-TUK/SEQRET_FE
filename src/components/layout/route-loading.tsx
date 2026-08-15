export function RouteLoading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid min-h-dvh place-items-center bg-canvas px-6 text-center text-ink-900"
      role="status"
    >
      <div>
        <span
          aria-hidden="true"
          className="mx-auto block size-9 animate-spin rounded-full border-4 border-primary-100 border-t-primary-700"
        />
        <p className="mt-4 text-[14px] font-bold">화면을 준비하고 있어요</p>
      </div>
    </div>
  );
}
