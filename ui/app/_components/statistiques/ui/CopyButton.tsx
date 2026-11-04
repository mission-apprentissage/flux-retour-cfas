"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";

export function CopyButton({ value, title }: { value: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      priority="tertiary no outline"
      size="small"
      iconId={copied ? "ri-check-line" : "ri-file-copy-line"}
      title={copied ? "Copié" : title}
      onClick={handleCopy}
    />
  );
}
