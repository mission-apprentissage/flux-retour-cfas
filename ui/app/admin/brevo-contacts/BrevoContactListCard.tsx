"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { useMemo, useState } from "react";

import styles from "./brevo-contacts.module.scss";
import { useBrevoContactListExisting } from "./hooks/useBrevoContactListExisting";
import { type ContactListSummary } from "./hooks/useBrevoContactLists";
import { type SampleContact, useBrevoContactListSync } from "./hooks/useBrevoContactListSync";
import { useBrevoHealth } from "./hooks/useBrevoHealth";
import { useTbaContactsExport } from "./hooks/useTbaContactsExport";

export type BrevoContactListCardProps = {
  contactList: ContactListSummary;
  onRequestSync: (contactList: ContactListSummary, run: () => Promise<void>) => void;
  onShowSampleDetails: (sample: SampleContact) => void;
};

export function BrevoContactListCard({ contactList, onRequestSync, onShowSampleDetails }: BrevoContactListCardProps) {
  const { data: existingList } = useBrevoContactListExisting(contactList.slug);
  const { data: health } = useBrevoHealth();
  const syncMutation = useBrevoContactListSync(contactList.slug);
  const [exportError, setExportError] = useState<string | null>(null);

  // Sync réelle bloquée si Brevo injoignable. Le dry-run et l'export n'appellent
  // pas Brevo (juste l'agrégation Mongo + sérialisation), donc restent actifs.
  const canSync = Boolean(
    health && health.apiKey.ok && (!health.tbaContactsList.configured || health.tbaContactsList.ok)
  );
  const syncDisabledReason = !health
    ? "Vérification de la configuration Brevo en cours…"
    : !health.apiKey.ok
      ? `Sync impossible — ${health.apiKey.detail}`
      : !health.tbaContactsList.ok && health.tbaContactsList.configured
        ? `Sync impossible — ${health.tbaContactsList.detail}`
        : null;
  const { exportData, isExporting } = useTbaContactsExport({
    slug: contactList.slug,
    onError: (e) => setExportError(e.message),
    onSuccess: () => setExportError(null),
  });

  // mutation.isLoading + variables.dryRun = état "Test en cours" vs "Sync en cours".
  const running: null | "dryRun" | "sync" = syncMutation.isLoading
    ? syncMutation.variables?.dryRun
      ? "dryRun"
      : "sync"
    : null;

  const result = syncMutation.data ?? null;
  const error =
    exportError ?? (syncMutation.error ? (syncMutation.error.message ?? "Erreur lors de la synchronisation") : null);

  const callSync = async (dryRun: boolean) => {
    setExportError(null);
    await syncMutation.mutateAsync({ dryRun });
  };

  const handleSync = () => {
    onRequestSync(contactList, () => callSync(false));
  };

  const sampleColumns = useMemo(() => {
    if (!result?.sample?.length) return [];
    return Object.keys(result.sample[0].attributes);
  }, [result]);

  const expanded = Boolean(result || error || running);

  return (
    <article className={styles.card} aria-expanded={expanded}>
      <header className={styles.cardHeader}>
        <div className={styles.cardInfo}>
          <h2 className={styles.cardTitle}>{contactList.label}</h2>
          <p className={styles.cardDesc}>{contactList.description}</p>
          {existingList?.updated_at ? (
            <p className={styles.cardMeta}>
              Dernière sync&nbsp;: <strong>{new Date(existingList.updated_at).toLocaleString("fr-FR")}</strong> — liste
              « {existingList.listName} » (id {existingList.listId})
            </p>
          ) : (
            <p className={styles.cardMeta}>Pas encore sync</p>
          )}
        </div>
        <div className={styles.cardActions}>
          <Button
            onClick={() => void callSync(true)}
            disabled={running !== null || isExporting}
            iconId="ri-eye-line"
            iconPosition="left"
            priority="secondary"
          >
            {running === "dryRun" ? "Test en cours…" : "Tester"}
          </Button>
          <Button
            onClick={() => void exportData()}
            disabled={running !== null || isExporting}
            iconId="fr-icon-download-line"
            iconPosition="left"
            priority="secondary"
          >
            {isExporting ? "Export en cours…" : "Exporter (Excel)"}
          </Button>
          <Button
            onClick={handleSync}
            disabled={running !== null || isExporting || !canSync}
            iconId="ri-send-plane-line"
            iconPosition="right"
            title={syncDisabledReason ?? undefined}
          >
            {running === "sync" ? "Synchronisation…" : "Lancer la sync"}
          </Button>
        </div>
      </header>

      {expanded && (
        <div className={styles.cardBody}>
          {error && <div className={styles.errorBanner}>Erreur&nbsp;: {error}</div>}

          {result && (
            <>
              <div className={styles.resultHeader}>
                <span className={`${styles.chip} ${result.dryRun ? "" : styles.chipSuccess}`}>
                  {result.dryRun ? "Dry-run (aucun appel Brevo)" : "Sync réelle effectuée"}
                </span>
                <span className={styles.count}>
                  {result.count} contact{result.count > 1 ? "s" : ""}
                </span>
                <span className={styles.targetList}>
                  Liste cible&nbsp;: <strong>{result.listName}</strong>
                  {result.listId !== undefined && ` (id ${result.listId})`}
                </span>
              </div>

              {result.failedBatches !== undefined && result.failedBatches > 0 && (
                <div className={styles.warningBanner}>
                  {result.failedBatches} batch(s) d&apos;import Brevo en échec sur {result.batches}. Voir Sentry.
                </div>
              )}

              {result.attributes && (
                <div className={styles.attributesReport}>
                  <h3 className={styles.sampleTitle}>Schéma Brevo</h3>
                  {result.attributes.created.length === 0 ? (
                    <p className={styles.attributesLine}>
                      Aucun nouvel attribut à créer — les {result.attributes.skipped.length} attributs du schéma
                      existaient déjà côté Brevo.
                    </p>
                  ) : (
                    <p className={styles.attributesLine}>
                      ✨ <strong>{result.attributes.created.length} attribut(s) créé(s)</strong> côté Brevo&nbsp;:{" "}
                      <code className={styles.attributesCode}>{result.attributes.created.join(", ")}</code>
                      {result.attributes.skipped.length > 0 && (
                        <>
                          {" "}
                          <span className={styles.attributesMuted}>
                            ({result.attributes.skipped.length} déjà existants, conservés)
                          </span>
                        </>
                      )}
                    </p>
                  )}

                  {result.attributes.casingMismatches.length > 0 && (
                    <p className={styles.attributesLine}>
                      ⚠️{" "}
                      <strong>{result.attributes.casingMismatches.length} attribut(s) avec une casse différente</strong>{" "}
                      en Brevo&nbsp;:{" "}
                      <code className={styles.attributesCode}>
                        {result.attributes.casingMismatches.map((m) => `${m.codeName} ↔ ${m.brevoName}`).join(", ")}
                      </code>
                      <span className={styles.attributesMuted}> — Brevo conserve l&apos;existant, pas bloquant.</span>
                    </p>
                  )}

                  {result.attributes.conflicts.length > 0 && (
                    <div className={styles.warningBanner}>
                      🔴 <strong>{result.attributes.conflicts.length} conflit(s) de type</strong>&nbsp;:{" "}
                      {result.attributes.conflicts
                        .map((c) => `${c.name} (Brevo=${c.existingType}, code=${c.expectedType})`)
                        .join(", ")}
                      . L&apos;existant côté Brevo est conservé — modifier le type manuellement ou aligner le code.
                    </div>
                  )}
                </div>
              )}

              {result.sample && result.sample.length > 0 && (
                <>
                  <h3 className={styles.sampleTitle}>Aperçu (10 premiers contacts)</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.sampleTable}>
                      <thead>
                        <tr>
                          <th>Email</th>
                          {sampleColumns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.sample.map((c, i) => (
                          <tr
                            key={`${c.email}-${i}`}
                            className={styles.sampleRow}
                            role="button"
                            tabIndex={0}
                            aria-label={`Voir tous les attributs du contact ${c.email}`}
                            onClick={() => onShowSampleDetails(c)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onShowSampleDetails(c);
                              }
                            }}
                          >
                            <td>{c.email}</td>
                            {sampleColumns.map((col) => (
                              <td key={col}>{String(c.attributes[col] ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}
