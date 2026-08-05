"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { FullTable } from "@/app/_components/table/FullTable";
import { NATURE_ORGANISME } from "@/common/constants/organismes";
import { _get, _post } from "@/common/httpClient";

import styles from "./fusion-organismes.module.scss";

interface DuplicateOrganisme {
  id: string;
  uai?: string;
  siret: string;
  nom: string;
  raison_sociale?: string;
  enseigne?: string;
  nature: keyof typeof NATURE_ORGANISME;
  ferme: boolean;
  last_transmission_date?: string;
  created_at: string;
  effectifs_count: number;
}

interface DuplicateGroup {
  _id: { siret: string };
  duplicates: DuplicateOrganisme[];
}

const PAGE_SIZE = 5;

const DUPLICATES_COLUMNS = [{ label: "Organismes en duplicat", dataKey: "nom", sortable: false }];

const detailModal = createModal({ id: "admin-fusion-organismes-detail", isOpenedByDefault: false });
const confirmModal = createModal({ id: "admin-fusion-organismes-confirm", isOpenedByDefault: false });

function DuplicateDetails({ duplicates }: { duplicates: DuplicateOrganisme[] }) {
  return (
    <div className={styles.duplicates}>
      {duplicates.map((organisme) => (
        <div key={organisme.id}>
          <p className={styles.duplicateName}>{organisme.raison_sociale || organisme.enseigne || organisme.nom}</p>
          <p className={styles.duplicateFields}>
            <span className={organisme.uai ? undefined : styles.missingValue}>UAI : {organisme.uai ?? "Inconnu"}</span>
            <span>SIRET : {organisme.siret}</span>
            <span className={organisme.effectifs_count > 0 ? undefined : styles.missingValue}>
              Effectifs : {organisme.effectifs_count > 0 ? organisme.effectifs_count : "Non déclaré"}
            </span>
            {!organisme.uai && (
              <span className={styles.unreliable}>
                <i className={fr.cx("fr-icon-warning-fill", "fr-icon--sm")} aria-hidden="true" />
                Non fiable
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

function ComparisonRow({ label, values }: { label: string; values: [string, string] }) {
  return (
    <tr>
      <td>{label}</td>
      <td>{values[0]}</td>
      <td>{values[1]}</td>
    </tr>
  );
}

export default function FusionOrganismesClient() {
  const [page, setPage] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateOrganisme[] | null>(null);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; description: string } | null>(null);

  const {
    data: groups,
    error,
    isLoading,
    refetch,
  } = useQuery<DuplicateGroup[], any>(["admin", "organismes-duplicates"], ({ signal }) =>
    _get("/api/v1/admin/organismes-duplicates", { signal })
  );

  const { mutateAsync: mergeOrganismes, isLoading: isMerging } = useMutation(
    async ({ organismeFiableId, organismeSansUaiId }: { organismeFiableId: string; organismeSansUaiId: string }) =>
      _post("/api/v1/admin/fusion-organismes", { organismeFiableId, organismeSansUaiId })
  );

  const handleMerge = useCallback(async () => {
    if (!selectedGroup) return;
    const [first, second] = selectedGroup;
    const { organismeFiableId, organismeSansUaiId } = first.uai
      ? { organismeFiableId: first.id, organismeSansUaiId: second.id }
      : { organismeFiableId: second.id, organismeSansUaiId: first.id };

    try {
      await mergeOrganismes({ organismeFiableId, organismeSansUaiId });
      setFeedback({ severity: "success", description: "Les organismes ont bien été fusionnés." });
      await refetch();
      setSelectedGroup(null);
      confirmModal.close();
    } catch {
      setFeedback({ severity: "error", description: "Une erreur est survenue lors de la fusion des organismes." });
    }
  }, [mergeOrganismes, refetch, selectedGroup]);

  const allGroups = groups ?? [];
  const lastPage = Math.max(1, Math.ceil(allGroups.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);
  const pageGroups = allGroups.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const tableData = pageGroups.map((group) => ({
    _id: group._id.siret,
    rawData: {
      nom: group.duplicates[0]?.nom ?? "",
      duplicates: [...group.duplicates].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
      siret: group._id.siret,
    },
    element: {
      nom: (
        <>
          <span className={styles.groupName}>
            {Array.from(new Set(group.duplicates.map((organisme) => organisme.nom))).join(" ou ")}
          </span>
          <DsfrLink
            href={`https://referentiel.apprentissage.onisep.fr/organismes?text=${group._id.siret}`}
            size="sm"
            arrow="none"
          >
            Voir dans le référentiel
          </DsfrLink>
        </>
      ),
    },
  }));

  return (
    <>
      <h1 className={styles.title}>
        {allGroups.length > 0
          ? `Vérifier les ${allGroups.length} duplicats d’organisme`
          : "Vérifier les duplicats d’organisme"}
      </h1>

      {feedback && (
        <Alert
          severity={feedback.severity}
          small
          description={feedback.description}
          closable
          onClose={() => setFeedback(null)}
          className={fr.cx("fr-mb-3w")}
        />
      )}

      {error ? (
        <Alert
          severity="error"
          title="Impossible de charger les duplicats"
          description="Une erreur est survenue lors du chargement des organismes en duplicat. Veuillez réessayer ultérieurement."
        />
      ) : isLoading ? (
        <TableSkeleton />
      ) : (
        <div className={styles.tableWrapper}>
          <FullTable
            data={tableData}
            columns={DUPLICATES_COLUMNS}
            pagination={{ total: allGroups.length, page: currentPage, limit: PAGE_SIZE, lastPage }}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            expandColumnLabel="Détail des duplicats"
            getRowCanExpand={() => true}
            renderSubComponent={(rowData) => (
              <>
                <DuplicateDetails duplicates={rowData.duplicates} />
                {rowData.duplicates.length === 2 ? (
                  <Button
                    priority="secondary"
                    iconId="ri-eye-line"
                    iconPosition="left"
                    onClick={() => {
                      setSelectedGroup(rowData.duplicates);
                      detailModal.open();
                    }}
                  >
                    Voir les détails
                  </Button>
                ) : (
                  <Alert
                    severity="warning"
                    small
                    description="Attention il y a plus de 2 organismes en duplicat, analyse complémentaire nécessaire."
                  />
                )}
              </>
            )}
            emptyMessage="Aucun duplicat d’organisme à vérifier"
          />
        </div>
      )}

      <detailModal.Component
        title="Visualiser les duplicats"
        size="large"
        buttons={[
          { children: "Ignorer", priority: "secondary" as const, doClosesModal: true },
          {
            children: "Fusionner les organismes",
            onClick: () => confirmModal.open(),
            doClosesModal: true,
          },
        ]}
      >
        {selectedGroup && selectedGroup.length === 2 && (
          <table className={styles.comparison}>
            <thead>
              <tr>
                <th scope="col">Informations</th>
                <th scope="col">Organisme 1</th>
                <th scope="col">Organisme 2</th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow
                label="Raison sociale"
                values={[selectedGroup[0].raison_sociale ?? "", selectedGroup[1].raison_sociale ?? ""]}
              />
              <ComparisonRow label="UAI" values={[selectedGroup[0].uai ?? "", selectedGroup[1].uai ?? ""]} />
              <ComparisonRow label="SIRET" values={[selectedGroup[0].siret, selectedGroup[1].siret]} />
              <ComparisonRow
                label="Nature"
                values={[
                  NATURE_ORGANISME[selectedGroup[0].nature] ?? NATURE_ORGANISME.inconnue,
                  NATURE_ORGANISME[selectedGroup[1].nature] ?? NATURE_ORGANISME.inconnue,
                ]}
              />
              <ComparisonRow
                label="État"
                values={[selectedGroup[0].ferme ? "Fermé" : "Ouvert", selectedGroup[1].ferme ? "Fermé" : "Ouvert"]}
              />
              <ComparisonRow
                label="Transmission au tableau de bord"
                values={[
                  selectedGroup[0].last_transmission_date ? "Transmet" : "Ne transmet pas",
                  selectedGroup[1].last_transmission_date ? "Transmet" : "Ne transmet pas",
                ]}
              />
              <ComparisonRow
                label="Fiabilisation"
                values={[
                  selectedGroup[0].uai ? "Fiable" : "Non fiable",
                  selectedGroup[1].uai ? "Fiable" : "Non fiable",
                ]}
              />
            </tbody>
          </table>
        )}
      </detailModal.Component>

      <confirmModal.Component
        title="Fusionner les organismes"
        buttons={[
          { children: "Annuler", priority: "secondary" as const, doClosesModal: true },
          { children: "Confirmer", onClick: handleMerge, disabled: isMerging, doClosesModal: false },
        ]}
      >
        <p>
          En choisissant de fusionner les organismes, les informations qui les concernent seront regroupées en un seul
          organisme.
        </p>
        <p>Cela concerne les informations suivantes :</p>
        <ul>
          <li>effectifs</li>
          <li>paramétrage du ou des ERP</li>
          <li>comptes utilisateurs</li>
        </ul>
        <p className={styles.mergeWarning}>Cette action est irréversible.</p>
      </confirmModal.Component>
    </>
  );
}
