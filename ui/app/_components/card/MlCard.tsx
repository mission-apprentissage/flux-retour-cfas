import { Box, Stack, Typography } from "@mui/material";
import React, { ReactNode } from "react";

export interface MlCardProps {
  title: string;
  subtitle?: string;
  body?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}

export function MlCard({ title, subtitle, body, imageSrc, imageAlt }: MlCardProps) {
  return (
    <Stack
      px={16}
      py={12}
      spacing={4}
      sx={{
        border: "1px solid var(--border-default-grey)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <Typography
        variant="h3"
        sx={{
          marginBottom: "8px",
          color: "var(--text-title-blue-france)",
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography variant="h6" sx={{ marginBottom: "16px", fontWeight: 400 }}>
          {subtitle}
        </Typography>
      )}

      {imageSrc && (
        <Box
          component="img"
          src={imageSrc}
          alt={imageAlt || ""}
          sx={{
            width: "350px",
            height: "auto",
            userSelect: "none",
            marginBottom: "16px",
          }}
        />
      )}

      {body && <Box sx={{ marginBottom: "16px" }}>{body}</Box>}
    </Stack>
  );
}
