import {
  CheckCircleIcon,
  InfoIcon,
  ShieldCheckIcon,
  WarningIcon,
  type Icon,
  type IconProps,
  type IconWeight,
} from "@phosphor-icons/react";
import { createElement, forwardRef } from "react";

export type AppIcon = Icon;

function withDefaultWeight(Component: Icon, defaultWeight: IconWeight) {
  return forwardRef<SVGSVGElement, IconProps>(function WeightedIcon({ weight = defaultWeight, ...props }, ref) {
    return createElement(Component, { ...props, ref, weight });
  });
}

export const WarningStatusIcon = withDefaultWeight(WarningIcon, "bold");
export const SecurityStatusIcon = withDefaultWeight(ShieldCheckIcon, "bold");
export const SuccessStatusIcon = withDefaultWeight(CheckCircleIcon, "bold");
export const InfoStatusIcon = withDefaultWeight(InfoIcon, "bold");
