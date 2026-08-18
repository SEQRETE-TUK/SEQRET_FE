import { movingItemAssetForName } from "@/components/moving-item-assets";

export function MovingItemIcon({ className = "size-8 object-contain", name }: { className?: string; name: string }) {
  const src = movingItemAssetForName(name);
  return src ? <img alt="" aria-hidden="true" className={className} src={src} /> : null;
}
