"use client";

import { Stack, Skeleton, Box } from "@mui/material";

export function RightColumnSkeleton() {
  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p={2}
        sx={{ border: "1px solid var(--border-default-grey)" }}
      >
        <Skeleton animation="wave" variant="text" width={100} />
        <Skeleton animation="wave" variant="text" width={200} />
        <Skeleton animation="wave" variant="text" width={100} />
      </Box>
      <Stack direction="column" spacing={2} py={6}>
        <Stack direction="row" spacing={2}>
          <Skeleton animation="wave" variant="rectangular" width={80} height={28} />
          <Skeleton animation="wave" variant="rectangular" width={100} height={28} />
        </Stack>
        <Skeleton animation="wave" variant="text" width="30%" height={50} />
        <Skeleton animation="wave" variant="rectangular" width="100%" height={256} />
        <Skeleton animation="wave" variant="rectangular" width="100%" height={482} />
        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Skeleton animation="wave" variant="rectangular" width={130} height={36} />
          <Skeleton animation="wave" variant="rectangular" width={180} height={36} />
        </Stack>
      </Stack>
    </>
  );
}
