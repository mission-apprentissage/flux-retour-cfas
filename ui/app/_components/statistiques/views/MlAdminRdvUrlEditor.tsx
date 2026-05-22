"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useState } from "react";
import { z } from "zod";

import useToaster from "@/hooks/useToaster";

import { useUpdateMlParametresAdmin } from "../hooks/useStatsQueries";

interface Props {
  mlId: string;
  rdvUrl: string | null | undefined;
}

const rdvUrlSchema = z
  .string()
  .url("Format d'URL invalide")
  .max(2000)
  .refine(
    (s) => {
      try {
        return ["http:", "https:"].includes(new URL(s).protocol);
      } catch {
        return false;
      }
    },
    { message: "L'URL doit commencer par http:// ou https://" }
  )
  .or(z.literal(""));

export function MlAdminRdvUrlEditor({ mlId, rdvUrl }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(rdvUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const { toastSuccess, toastError } = useToaster();
  const { mutateAsync, isLoading } = useUpdateMlParametresAdmin(mlId);

  const handleSave = async () => {
    const parsed = rdvUrlSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "URL invalide");
      return;
    }
    try {
      await mutateAsync({ rdv_url: value === "" ? null : value });
      toastSuccess("Lien RDV enregistré.");
      setEditing(false);
      setError(null);
    } catch (err: any) {
      toastError(err?.json?.data?.message || err?.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleCancel = () => {
    setValue(rdvUrl ?? "");
    setError(null);
    setEditing(false);
  };

  if (!editing) {
    return (
      <>
        {rdvUrl ? (
          <a href={rdvUrl} target="_blank" rel="noopener noreferrer" className="fr-link">
            {rdvUrl}
          </a>
        ) : (
          "—"
        )}{" "}
        <Button priority="tertiary no outline" size="small" onClick={() => setEditing(true)}>
          Modifier
        </Button>
      </>
    );
  }

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <Input
        label=""
        state={error ? "error" : "default"}
        stateRelatedMessage={error ?? " "}
        nativeInputProps={{
          type: "url",
          placeholder: "https://www.ma-mission-locale.fr/prise-de-rdv",
          value,
          onChange: (e) => {
            setValue(e.target.value);
            if (error) setError(null);
          },
        }}
      />
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <Button priority="primary" size="small" onClick={handleSave} disabled={isLoading}>
          Enregistrer
        </Button>
        <Button priority="secondary" size="small" onClick={handleCancel} disabled={isLoading}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
