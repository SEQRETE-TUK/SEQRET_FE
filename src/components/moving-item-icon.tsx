const movingItemAssets = {
  bed: "/moving-items/bed.png",
  book: "/moving-items/book.png",
  bookshelf: "/moving-items/bookshelf.png",
  cabinet: "/moving-items/cabinet.png",
  chair: "/moving-items/chair.png",
  desk: "/moving-items/desk.png",
  drawer: "/moving-items/drawer.png",
  fan: "/moving-items/fan.png",
  fridge: "/moving-items/fridge.png",
  kitchen: "/moving-items/kitchen.png",
  lamp: "/moving-items/lamp.png",
  microwave: "/moving-items/microwave.png",
  movingBox: "/moving-items/moving-box.png",
  officeChair: "/moving-items/office-chair.png",
  sofa: "/moving-items/sofa.png",
  table: "/moving-items/table.png",
  tv: "/moving-items/tv.png",
  wardrobe: "/moving-items/wardrobe.png",
  washingMachine: "/moving-items/washing-machine.png",
} as const;

export function movingItemAssetForName(name: string) {
  const normalized = name.toLocaleLowerCase("ko-KR");

  if (normalized.includes("침대") || normalized.includes("매트리스")) return movingItemAssets.bed;
  if (normalized.includes("소파")) return movingItemAssets.sofa;
  if (normalized.includes("옷장")) return movingItemAssets.wardrobe;
  if (normalized.includes("서랍")) return movingItemAssets.drawer;
  if (normalized.includes("책장")) return movingItemAssets.bookshelf;
  if (normalized.includes("책상")) return movingItemAssets.desk;
  if (normalized.includes("테이블") || normalized.includes("식탁")) return movingItemAssets.table;
  if (normalized.includes("사무용 의자")) return movingItemAssets.officeChair;
  if (normalized.includes("의자")) return movingItemAssets.chair;
  if (normalized.includes("스탠드") || normalized.includes("조명")) return movingItemAssets.lamp;
  if (normalized.includes("tv") || normalized.includes("텔레비전")) return movingItemAssets.tv;
  if (normalized.includes("세탁기")) return movingItemAssets.washingMachine;
  if (normalized.includes("전자레인지")) return movingItemAssets.microwave;
  if (normalized.includes("선풍기")) return movingItemAssets.fan;
  if (normalized.includes("냉장고")) return movingItemAssets.fridge;
  if (normalized.includes("신발장")) return movingItemAssets.cabinet;
  if (normalized.includes("주방 가전")) return movingItemAssets.kitchen;
  if (normalized.includes("이사 박스") || normalized.includes("박스")) return movingItemAssets.movingBox;
  if (normalized.includes("책")) return movingItemAssets.book;
  return null;
}

export function MovingItemIcon({ className = "size-8 object-contain", name }: { className?: string; name: string }) {
  const src = movingItemAssetForName(name);
  return src ? <img alt="" aria-hidden="true" className={className} src={src} /> : null;
}
