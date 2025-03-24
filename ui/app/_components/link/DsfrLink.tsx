import { fr } from "@codegouvfr/react-dsfr";
import { Link } from "@mui/material";
import type { LinkProps } from "next/link";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { publicConfig } from "@/config.public";

export function DsfrLink({
  children,
  arrow = "right",
  size = "md",
  external = "auto",
  className,
  ...props
}: {
  children: ReactNode;
  arrow?: "right" | "left" | "none";
  size?: "lg" | "sm" | "md";
  external?: "auto" | boolean;
  className?: string;
} & LinkProps) {
  const { href, ...rest } = props;

  const isExternal = useMemo(() => {
    if (typeof external === "boolean") return external;
    if (typeof href !== "string") return false;
    const url = new URL(href, publicConfig.baseUrl);
    if (url.protocol === "mailto:") return true;
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return new URL(href, publicConfig.baseUrl).hostname !== publicConfig.host;
  }, [href, external]);

  return (
    <Link
      component={NextLink}
      sx={{
        textUnderlinePosition: "under",
      }}
      href={href}
      rel={isExternal ? "noopener noreferrer" : undefined}
      target={isExternal ? "_blank" : undefined}
      className={`${fr.cx(`fr-text--${size}`, {
        "fr-link--sm": size === "sm",
        "fr-link--lg": size === "lg",
        "fr-link--icon-left": arrow === "left",
        "fr-icon-arrow-left-line": arrow === "left",
        "fr-icon-arrow-right-line": arrow === "right",
        "fr-link--icon-right": arrow === "right",
      })} ${className || ""}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
