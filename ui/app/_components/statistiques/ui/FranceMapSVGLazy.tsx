"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "./Skeleton";

const FranceMapSVG = dynamic(() => import("./FranceMapSVG").then((mod) => ({ default: mod.FranceMapSVG })), {
  loading: () => <Skeleton height="232px" width="228px" />,
  ssr: false,
});

export { FranceMapSVG };
