"use client";

import { Box, Skeleton } from "@mui/material";

const SIDEBAR_BAR_WIDTHS = [120, 200, 160, 140];
const MAIN_BAR_WIDTHS: Array<number | string> = [300, 250, "100%", "100%", 200];

// Reprend la silhouette flex (sidebar + main) d'`OnboardingLayout` pour éviter
// le saut visuel quand les données arrivent.
export function OnboardingSkeleton() {
  return (
    <Box sx={{ display: "flex", minHeight: "calc(100vh - 200px)" }}>
      <Box sx={{ width: "35%", padding: "3.5rem 4rem" }}>
        {SIDEBAR_BAR_WIDTHS.map((w, i) => (
          <Skeleton key={i} animation="wave" variant="rectangular" width={w} height={16} sx={{ mb: 2 }} />
        ))}
      </Box>
      <Box sx={{ flex: 1, padding: "2.5rem 3rem" }}>
        <Skeleton animation="wave" variant="rectangular" width="70%" height={36} sx={{ mb: 4 }} />
        {MAIN_BAR_WIDTHS.map((w, i) => (
          <Skeleton key={i} animation="wave" variant="rectangular" width={w} height={44} sx={{ mb: 2 }} />
        ))}
      </Box>
    </Box>
  );
}
