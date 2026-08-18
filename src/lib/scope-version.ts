// 범위 버전 용어는 "N차 확인서"로 통일한다.
// v3 같은 내부 표기를 화면에 그대로 노출하지 않는다.
export function scopeVersionLabel(version: string | null | undefined): string {
  if (!version) return "아직 없음";
  const round = /^v(\d+)$/i.exec(version.trim());
  return round ? `${round[1]}차 확인서` : version;
}
