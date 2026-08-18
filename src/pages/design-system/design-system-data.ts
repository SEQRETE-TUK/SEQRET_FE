export type DesignSystemNavigationGroup = {
  id: string;
  label: string;
  items: ReadonlyArray<{
    id: string;
    label: string;
  }>;
};

/**
 * /design-system의 정보 구조 원본입니다.
 * 토큰 값은 tokens.css, 컴포넌트 동작은 각 실제 컴포넌트가 소유합니다.
 */
export const designSystemNavigation: ReadonlyArray<DesignSystemNavigationGroup> = [
  {
    id: "principles",
    label: "사용 원칙",
    items: [
      { id: "system-connection", label: "문서와 구현" },
      { id: "product-principles", label: "제품 원칙" },
    ],
  },
  {
    id: "foundations",
    label: "기초",
    items: [
      { id: "color-roles", label: "색상" },
      { id: "typography-scale", label: "타이포그래피" },
      { id: "spacing-and-shape", label: "간격과 형태" },
      { id: "token-inventory", label: "전체 토큰" },
    ],
  },
  {
    id: "components",
    label: "컴포넌트",
    items: [
      { id: "icon-standard", label: "아이콘" },
      { id: "button-standard", label: "버튼" },
      { id: "filter-chip-standard", label: "필터 칩" },
      { id: "selection-standard", label: "선택과 상태" },
      { id: "input-standard", label: "입력" },
      { id: "list-standard", label: "목록" },
    ],
  },
  {
    id: "patterns",
    label: "조합 규칙",
    items: [{ id: "screen-order", label: "화면 유형별 순서" }],
  },
];
