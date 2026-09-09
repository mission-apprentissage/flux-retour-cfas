"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useQuery } from "@tanstack/react-query";
import type { IMissionLocale } from "api-alternance-sdk";
import { useEffect, useRef, useState } from "react";
import { IOrganisationMissionLocale } from "shared";
import { z } from "zod";

import { _get, _post } from "@/common/httpClient";

import styles from "./InviteMissionLocaleSection.module.css";

const emailSchema = z.string().email("L'email n'est pas au bon format");

type MissionLocaleEntry = { organisation: IOrganisationMissionLocale; externalML: IMissionLocale };

export function InviteMissionLocaleSection() {
  const { data: missionLocales, isLoading } = useQuery<MissionLocaleEntry[]>({
    queryKey: ["mission-locale"],
    queryFn: () => _get("/api/v1/admin/mission-locale"),
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [selectedMl, setSelectedMl] = useState<{ label: string; mlId: number } | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);

  const filteredLocales = (missionLocales ?? [])
    .filter((ml) =>
      `${ml.externalML.nom} ${ml.externalML.localisation.ville} ${ml.externalML.localisation.cp}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.externalML.localisation.ville.localeCompare(b.externalML.localisation.ville));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (entry: MissionLocaleEntry) => {
    setSelectedMl({
      label: `${entry.externalML.nom} (${entry.externalML.localisation.ville} - ${entry.externalML.localisation.cp})`,
      mlId: entry.organisation.ml_id,
    });
    setSearchTerm("");
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredLocales.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filteredLocales.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredLocales[highlightIndex]);
    }
  };

  const handleSubmit = async () => {
    const parsed = emailSchema.safeParse(email.trim().toLowerCase());
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? "L'email n'est pas au bon format");
      return;
    }
    if (!selectedMl) return;
    setEmailError(null);
    setFeedback(null);
    setIsSubmitting(true);
    try {
      await _post("/api/v1/admin/users/mission-locale/membre", {
        email: parsed.data,
        mission_locale_id: selectedMl.mlId,
      });
      setEmail("");
      setFeedback({ severity: "success", message: "Un email d'invitation a été envoyé au destinataire." });
    } catch (err: any) {
      setFeedback({
        severity: "error",
        message: err?.json?.data?.message || "Oups, une erreur est survenue, merci de réessayer plus tard",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Inviter un membre dans une mission locale</h2>
      {feedback && (
        <Alert
          severity={feedback.severity}
          title={feedback.message}
          description=""
          small
          closable
          onClose={() => setFeedback(null)}
          className="fr-mb-2w"
        />
      )}
      <div ref={containerRef} className={styles.autocomplete}>
        <Input
          label="Mission locale"
          hintText={selectedMl ? `Sélectionnée : ${selectedMl.label}` : "Rechercher par nom, ville ou code postal"}
          nativeInputProps={{
            type: "search",
            value: searchTerm,
            placeholder: isLoading ? "Chargement des missions locales…" : "Rechercher une mission locale...",
            disabled: isLoading,
            onChange: (e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              setHighlightIndex(-1);
            },
            onFocus: () => setIsOpen(true),
            onKeyDown: handleKeyDown,
          }}
        />
        {isOpen && searchTerm && (
          <ul className={styles.results} role="listbox">
            {filteredLocales.length === 0 && <li className={styles.emptyResult}>Aucune mission locale trouvée</li>}
            {filteredLocales.slice(0, 50).map((ml, index) => (
              <li key={ml.organisation.ml_id} role="option" aria-selected={index === highlightIndex}>
                <button
                  type="button"
                  className={`${styles.resultButton} ${index === highlightIndex ? styles.resultButtonActive : ""}`}
                  onClick={() => handleSelect(ml)}
                  onMouseEnter={() => setHighlightIndex(index)}
                >
                  {ml.externalML.nom} ({ml.externalML.localisation.ville} - {ml.externalML.localisation.cp})
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.emailRow}>
        <div className={styles.emailInput}>
          <Input
            label="Adresse email professionnelle"
            state={emailError ? "error" : "default"}
            stateRelatedMessage={emailError ?? undefined}
            nativeInputProps={{
              type: "email",
              value: email,
              placeholder: "Renseigner un courriel",
              onChange: (e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              },
            }}
          />
        </div>
        <Button onClick={handleSubmit} disabled={!email || !selectedMl || isSubmitting}>
          Inviter
        </Button>
      </div>
    </section>
  );
}
