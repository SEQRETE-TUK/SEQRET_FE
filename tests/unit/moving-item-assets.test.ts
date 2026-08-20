import assert from "node:assert/strict";
import { test } from "node:test";

import {
  movingItemAssetForName,
  movingItemCategoryForName,
} from "../../src/components/moving-item-assets.ts";

test("maps English AI inventory names to visible assets and categories", () => {
  const examples = [
    ["Bed", "/moving-items/bed.png", "가구"],
    ["Moving Box", "/moving-items/moving-box.png", "기타"],
    ["Chest Freezer", "/moving-items/fridge.png", "가전"],
    ["Sofa", "/moving-items/sofa.png", "가구"],
    ["Television with Stand", "/moving-items/tv.png", "가전"],
    ["Washing Machine", "/moving-items/washing-machine.png", "가전"],
  ] as const;

  for (const [name, asset, category] of examples) {
    assert.equal(movingItemAssetForName(name), asset);
    assert.equal(movingItemCategoryForName(name), category);
  }
});
