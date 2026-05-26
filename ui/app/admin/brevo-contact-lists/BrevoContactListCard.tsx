"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { captureException } from "@sentry/nextjs";
import { useEffect, useMemo, useState } from "react";

import { _get, _post } from "@/common/httpClient";

import styles from "./brevo-contact-lists.module.scss";

export type SampleContact = { email: string; attributes: Record<string, unknown> };
type AttributesReport = {
  created: string[];
  skipped: string[];
  conflicts: Array<{ name: string; existingType: string; expectedType: string }>;
  casingMismatches: Array<{ codeName: string; brevoName: string }>;
};
type SyncResult = {
  dryRun: boolean;
  listId?: number;
  listName: string;
  count: number;
  sample?: SampleContact[];
  batches?: number;
  failedBatches?: number;
  attributes?: AttributesReport;
};
type ExistingList = { listId: number; listName: string; updated_at: string } | null;

export type ContactListSummary = { slug: string; label: string; description: string };

export type BrevoContactListCardProps = {
  contactList: ContactListSummary;
  onRequestSync: (contactList: ContactListSummary, run: () => Promise<void>) => void;
  onShowSampleDetails: (sample: SampleContact) => void;
};

export function BrevoContactListCard({ contactList, onRequestSync, onShowSampleDetails }: BrevoContactListCardProps) {
  const [existingList, setExistingList] = useState<ExistingList>(null);
  const [running, setRunning] = useState<null | "dryRun" | "sync">(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = (await _get(`/api/v1/admin/brevo-contact-lists/${contactList.slug}/list`)) as ExistingList;
        if (!cancelled) setExistingList(list);
      } catch (e) {
        captureException(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contactList.slug]);

  const callSync = async (dryRun: boolean) => {
    setRunning(dryRun ? "dryRun" : "sync");
    setError(null);
    try {
      const data = (await _post(`/api/v1/admin/brevo-contact-lists/${contactList.slug}/sync`, {
        dryRun,
      })) as SyncResult;
      setResult(data);
      if (!dryRun) {
        const list = (await _get(`/api/v1/admin/brevo-contact-lists/${contactList.slug}/list`)) as ExistingList;
        setExistingList(list);
      }
    } catch (e) {
      captureException(e);
      setError((e as Error).message ?? "Erreur lors de la synchronisation");
    } finally {
      setRunning(null);
    }
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
              📋 Dernière sync&nbsp;: <strong>{new Date(existingList.updated_at).toLocaleString("fr-FR")}</strong> —
              liste « {existingList.listName} » (id {existingList.listId})
            </p>
          ) : (
            <p className={styles.cardMeta}>Pas encore sync</p>
          )}
        </div>
        <div className={styles.cardActions}>
          <Button
            onClick={() => void callSync(true)}
            disabled={running !== null}
            iconId="ri-eye-line"
            iconPosition="left"
            priority="secondary"
          >
            {running === "dryRun" ? "Test en cours…" : "Tester"}
          </Button>
          <Button onClick={handleSync} disabled={running !== null} iconId="ri-send-plane-line" iconPosition="right">
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
                            onClick={() => onShowSampleDetails(c)}
                            title="Voir tous les attributs de ce contact"
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
