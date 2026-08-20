import type { MovingItemCategory } from "@/components/moving-item-assets";

export const movingItemCatalog: Array<{
  category: MovingItemCategory;
  icon: string;
  label: string;
}> = [
  { category: "가구", icon: "/moving-items/bed.png", label: "침대" },
  { category: "가구", icon: "/moving-items/sofa.png", label: "소파" },
  { category: "가구", icon: "/moving-items/wardrobe.png", label: "옷장" },
  { category: "가구", icon: "/moving-items/cabinet.png", label: "신발장" },
  { category: "가구", icon: "/moving-items/drawer.png", label: "서랍장" },
  { category: "가구", icon: "/moving-items/bookshelf.png", label: "책장" },
  { category: "가구", icon: "/moving-items/desk.png", label: "책상" },
  { category: "가구", icon: "/moving-items/table.png", label: "테이블" },
  { category: "가구", icon: "/moving-items/chair.png", label: "의자" },
  { category: "가구", icon: "/moving-items/office-chair.png", label: "사무용 의자" },
  { category: "가구", icon: "/moving-items/lamp.png", label: "스탠드" },
  { category: "가전", icon: "/moving-items/tv.png", label: "TV" },
  { category: "가전", icon: "/moving-items/washing-machine.png", label: "세탁기" },
  { category: "가전", icon: "/moving-items/microwave.png", label: "전자레인지" },
  { category: "가전", icon: "/moving-items/fan.png", label: "선풍기" },
  { category: "가전", icon: "/moving-items/kitchen.png", label: "주방 가전" },
  { category: "기타", icon: "/moving-items/moving-box.png", label: "이사 박스" },
  { category: "기타", icon: "/moving-items/book.png", label: "책" },
];
