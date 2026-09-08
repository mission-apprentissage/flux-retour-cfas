"use client";

import { Box, Skeleton, Stack } from "@mui/material";

/** Reprend le layout réel de la vue pour éviter le saut de mise en page au chargement. */
export function MlListeSkeleton({ nbOnglets = 1 }: { nbOnglets?: number }) {
  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={2} sx={{ my: 3 }}>
        <Skeleton animation="wave" variant="rectangular" height={40} sx={{ maxWidth: 544 }} />
        <Stack direction="row" spacing={2}>
          <Skeleton animation="wave" variant="rectangular" width={99} height={40} />
          <Skeleton animation="wave" variant="rectangular" width={181} height={40} />
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 0 }}>
        {[...Array(nbOnglets)].map((_, i) => (
          <Skeleton key={i} animation="wave" variant="rectangular" width={264} height={40} />
        ))}
      </Stack>

      <Box sx={{ p: 3, background: "var(--background-default-grey)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Skeleton animation="wave" variant="rectangular" width="40%" height={32} />
          <Skeleton animation="wave" variant="rectangular" width={200} height={32} />
        </Stack>
        <Skeleton animation="wave" variant="rectangular" height={58} sx={{ mb: 1 }} />
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} animation="wave" variant="rectangular" height={84} sx={{ mb: 1 }} />
        ))}
      </Box>
    </Box>
  );
}
