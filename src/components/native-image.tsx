import type { ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "sizes"> & {
  fill?: boolean;
  sizes?: string;
};

export default function Image({ fill, className = "", ...props }: Props) {
  return (
    <img
      className={`${fill ? "absolute inset-0 h-full w-full" : ""} ${className}`}
      decoding="async"
      height={fill ? 1 : props.height}
      loading={props.loading ?? "lazy"}
      width={fill ? 1 : props.width}
      {...props}
    />
  );
}
