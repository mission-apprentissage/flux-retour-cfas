"use client";

import { Skeleton, Stack, Box } from "@mui/material";
import Grid from "@mui/material/Grid2";

export function TableSkeleton() {
  return (
    <Box sx={{ width: "100%", mb: 4 }}>
      <Skeleton animation="wave" variant="rectangular" width="40%" height={28} sx={{ mb: 2 }} />
      <Skeleton animation="wave" variant="rectangular" width="100%" height={52} sx={{ mb: 1 }} />
      {[...Array(5)].map((_, i) => (
        <Skeleton animation="wave" key={i} variant="rectangular" width="100%" height={52} sx={{ mb: 1 }} />
      ))}
    </Box>
  );
}

export function PageWithSidebarSkeleton() {
  return (
    <Grid container spacing={2}>
      <Grid size={3}>
        <Skeleton animation="wave" variant="rectangular" width="100%" height={400} />
      </Grid>
      <Grid size={9}>
        <Stack spacing={3}>
          <Skeleton animation="wave" variant="rectangular" width="100%" height={60} />
          <Skeleton animation="wave" variant="rectangular" width="100%" height={200} />
          <Skeleton animation="wave" variant="rectangular" width="100%" height={300} />
        </Stack>
      </Grid>
    </Grid>
  );
}
