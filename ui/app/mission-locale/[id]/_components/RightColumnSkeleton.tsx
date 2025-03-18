"use client";

import { Stack, Skeleton } from "@mui/material";

export function RightColumnSkeleton() {
  return (
    <Stack direction="column" spacing={2} py={6}>
      <Stack direction="row" spacing={2}>
        <Skeleton variant="rectangular" width={80} height={28} />
        <Skeleton variant="rectangular" width={100} height={28} />
      </Stack>
      <Skeleton variant="text" width="30%" height={50} />
      <Skeleton variant="rectangular" width="100%" height={256} />
      <Skeleton variant="rectangular" width="100%" height={482} />
      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Skeleton variant="rectangular" width={130} height={36} />
        <Skeleton variant="rectangular" width={180} height={36} />
      </Stack>
    </Stack>
  );
}
