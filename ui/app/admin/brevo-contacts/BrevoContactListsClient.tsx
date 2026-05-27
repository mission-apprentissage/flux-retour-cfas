"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useCallback, useState } from "react";

import styles from "./brevo-contacts.module.scss";
import { BrevoContactListCard } from "./BrevoContactListCard";
import { BrevoHealthBanner } from "./BrevoHealthBanner";
import { type ContactListSummary, useBrevoContactLists } from "./hooks/useBrevoContactLists";
import { type SampleContact } from "./hooks/useBrevoContactListSync";

const syncConfirmModal = createModal({ id: "brevo-contacts-sync-confirm", isOpenedByDefault: false });
const sampleDetailsModal = createModal({ id: "brevo-contacts-sample-details", isOpenedByDefault: false });

type PendingSync = {
  contactList: ContactListSummary;
  run: () => Promise<void>;
};

const formatValue = (v: unknown): React.ReactNode => {
  if (v === null) return <em className={styles.detailsMuted}>null</em>;
  if (v === undefined) return <em className={styles.detailsMuted}>(non envoyé)</em>;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") return v === "" ? <em className={styles.detailsMuted}>(vide)</em> : v;
  if (typeof v === "number") return String(v);
  return <code className={styles.detailsCode}>{JSON.stringify(v)}</code>;
};

export default function BrevoContactListsClient() {
  const { data: contactLists, error, isLoading } = useBrevoContactLists();
  const [pendingSync, setPendingSync] = useState<PendingSync | null>(null);
  const [sampleDetails, setSampleDetails] = useState<SampleContact | null>(null);

  const handleRequestSync = useCallback((contactList: ContactListSummary, run: () => Promise<void>) => {
    setPendingSync({ contactList, run });
    syncConfirmModal.open();
  }, []);

  const handleConfirmSync = useCallback(async () => {
    syncConfirmModal.close();
    if (pendingSync) {
      await pendingSync.run();
      setPendingSync(null);
    }
  }, [pendingSync]);

  const handleShowSampleDetails = useCallback((sample: SampleContact) => {
    setSampleDetails(sample);
    sampleDetailsModal.open();
  }, []);

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Listes de contacts Brevo</h1>
      <p className={styles.intro}>Génération et synchronisation des utilisateurs vers les contacts Brevo.</p>

      <BrevoHealthBanner />

      {error ? (
        <div className={styles.errorBanner}>
          Erreur&nbsp;: {error instanceof Error ? error.message : "Erreur de chargement"}
        </div>
      ) : null}
      {isLoading && <div className={styles.loading}>Chargement…</div>}

      {contactLists && (
        <div className={styles.list}>
          {contactLists.length === 0 && <div className={styles.empty}>Aucune liste de contacts déclarée.</div>}
          {contactLists.map((contactList) => (
            <BrevoContactListCard
              key={contactList.slug}
              contactList={contactList}
              onRequestSync={handleRequestSync}
              onShowSampleDetails={handleShowSampleDetails}
            />
          ))}
        </div>
      )}

      <syncConfirmModal.Component
        title="Confirmer la synchronisation Brevo"
        buttons={[
          { children: "Annuler", priority: "secondary" as const, doClosesModal: true },
          { children: "Je confirme, synchroniser", onClick: handleConfirmSync },
        ]}
      >
        {pendingSync && (
          <div className={styles.confirmModal}>
            <p>
              Vous êtes sur le point de synchroniser la liste <strong>« {pendingSync.contactList.label} »</strong> vers
              Brevo. Cette action a plusieurs implications :
            </p>

            <ul className={styles.confirmList}>
              <li>
                <strong>La liste Brevo sera actualisée.</strong> Tout segment Brevo basé sur cette liste sera recalculé.
              </li>
              <li>
                <strong>Les contacts Brevo sont globaux au compte.</strong> Pour les contacts déjà existants dans Brevo
                (ex. présents dans d&apos;autres listes), les <em>attributs partagés</em> (PRENOM, NOM, TELEPHONE,
                NOM_ORGANISME, etc.) seront <strong>mis à jour</strong> avec les valeurs de la base actuelle.
              </li>
              <li>
                <strong>Aucun mail n&apos;est envoyé par cette action.</strong> L&apos;envoi de la campagne reste à
                déclencher manuellement depuis le dashboard Brevo.
              </li>
              <li>
                <strong>L&apos;import est asynchrone côté Brevo.</strong> Une fois la sync lancée, Brevo traite les
                contacts par batches en arrière-plan (~5–15 min pour ~5 000 contacts). La liste se remplit
                progressivement — l&apos;avancement est visible dans Brevo &gt; Contacts &gt; Historique des imports.
              </li>
            </ul>

            <p className={styles.confirmHint}>
              Pour juste vérifier le contenu sans toucher à Brevo, utilisez plutôt le bouton{" "}
              <strong>« Tester (dry-run) »</strong>.
            </p>
          </div>
        )}
      </syncConfirmModal.Component>

      <sampleDetailsModal.Component
        title={sampleDetails ? `Contact : ${sampleDetails.email}` : "Détail du contact"}
        size="large"
        buttons={[{ children: "Fermer", priority: "secondary" as const, doClosesModal: true }]}
      >
        {sampleDetails && (
          <div className={styles.detailsWrapper}>
            <table className={styles.detailsTable}>
              <thead>
                <tr>
                  <th>Attribut</th>
                  <th>Valeur</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sampleDetails.attributes)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([k, v]) => (
                    <tr key={k}>
                      <td className={styles.detailsKey}>{k}</td>
                      <td className={styles.detailsValue}>{formatValue(v)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </sampleDetailsModal.Component>
    </section>
  );
}
