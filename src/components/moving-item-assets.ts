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

export type MovingItemCategory = "가구" | "가전" | "기타";

function includesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

export function movingItemCategoryForName(name: string): MovingItemCategory {
  const normalized = name.toLocaleLowerCase("ko-KR");
  if (includesAny(normalized, ["침대", "매트리스", "소파", "옷장", "서랍", "책장", "책상", "테이블", "식탁", "의자", "스탠드", "조명", "bed", "mattress", "sofa", "couch", "wardrobe", "closet", "drawer", "dresser", "bookshelf", "bookcase", "desk", "table", "chair", "lamp"])) return "가구";
  if (includesAny(normalized, ["tv", "텔레비전", "세탁기", "전자레인지", "선풍기", "냉장고", "주방 가전", "television", "washing machine", "washer", "microwave", "fan", "fridge", "refrigerator", "freezer", "kitchen appliance"])) return "가전";
  return "기타";
}

export function movingItemAssetForName(name: string) {
  const normalized = name.toLocaleLowerCase("ko-KR");

  if (includesAny(normalized, ["침대", "매트리스", "bed", "mattress"])) return movingItemAssets.bed;
  if (includesAny(normalized, ["소파", "sofa", "couch"])) return movingItemAssets.sofa;
  if (includesAny(normalized, ["옷장", "wardrobe", "closet"])) return movingItemAssets.wardrobe;
  if (includesAny(normalized, ["서랍", "drawer", "dresser"])) return movingItemAssets.drawer;
  if (includesAny(normalized, ["책장", "bookshelf", "bookcase"])) return movingItemAssets.bookshelf;
  if (includesAny(normalized, ["책상", "desk"])) return movingItemAssets.desk;
  if (includesAny(normalized, ["테이블", "식탁", "table"])) return movingItemAssets.table;
  if (includesAny(normalized, ["사무용 의자", "office chair"])) return movingItemAssets.officeChair;
  if (includesAny(normalized, ["의자", "chair"])) return movingItemAssets.chair;
  if (includesAny(normalized, ["스탠드", "조명", "lamp"])) return movingItemAssets.lamp;
  if (includesAny(normalized, ["tv", "텔레비전", "television"])) return movingItemAssets.tv;
  if (includesAny(normalized, ["세탁기", "washing machine", "washer"])) return movingItemAssets.washingMachine;
  if (includesAny(normalized, ["전자레인지", "microwave"])) return movingItemAssets.microwave;
  if (includesAny(normalized, ["선풍기", "fan"])) return movingItemAssets.fan;
  if (includesAny(normalized, ["냉장고", "fridge", "refrigerator", "freezer"])) return movingItemAssets.fridge;
  if (includesAny(normalized, ["신발장", "cabinet"])) return movingItemAssets.cabinet;
  if (includesAny(normalized, ["주방 가전", "kitchen appliance"])) return movingItemAssets.kitchen;
  if (includesAny(normalized, ["이사 박스", "박스", "moving box", "carton"])) return movingItemAssets.movingBox;
  if (includesAny(normalized, ["책", "book"])) return movingItemAssets.book;
  return null;
}
