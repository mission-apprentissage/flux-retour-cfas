"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CRISP_FAQ, DuplicateEffectifDetail, DuplicateEffectifGroup, SUPPORT_PAGE_ACCUEIL } from "shared";

import { PageHeader } from "@/app/_components/page-header/PageHeader";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { _delete, _get } from "@/common/httpClient";

import styles from "./doublons.module.scss";
import { DoublonsList } from "./DoublonsList";

const deleteDoublonModal = createModal({
  id: "doublon-delete",
  isOpenedByDefault: false,
});

const deleteAllDoublonsModal = createModal({
  id: "doublons-delete-all",
  isOpenedByDefault: false,
});

export default function DoublonsClient({ organismeId, isMine }: { organismeId: string; isMine: boolean }) {
  const queryClient = useQueryClient();
  const { trackPlausibleEvent } = usePlausibleAppTracking();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [duplicateToDelete, setDuplicateToDelete] = useState<DuplicateEffectifDetail | null>(null);

  const { data: duplicates, isLoading } = useQuery<DuplicateEffectifGroup[]>(
    [`duplicates-effectifs`, organismeId, page, pageSize],
    async () => {
      const response = await _get(`/api/v1/organismes/${organismeId}/duplicates`, {
        params: { page, limit: pageSize },
      });
      setTotalCount(response.totalItems);
      return response.data;
    },
    { keepPreviousData: true }
  );

  const lastPage = Math.max(1, Math.ceil(totalCount / pageSize));

  const onRequestDelete = (duplicate: DuplicateEffectifDetail) => {
    setDuplicateToDelete(duplicate);
    deleteDoublonModal.open();
  };

  const confirmDeleteDuplicate = async () => {
    if (!duplicateToDelete) return;
    trackPlausibleEvent("suppression_doublons_effectifs");
    await _delete(`/api/v1/effectif/${duplicateToDelete.id}`);
    queryClient.invalidateQueries(["duplicates-effectifs"]);
    deleteDoublonModal.close();
    setDuplicateToDelete(null);
  };

  const confirmDeleteAll = async () => {
    trackPlausibleEvent("suppression_doublons_effectifs_en_lot", undefined, {
      nb_doublons_supprimes_lot: totalCount,
    });
    await _delete(`/api/v1/organismes/${organismeId}/duplicates`);
    queryClient.invalidateQueries(["duplicates-effectifs"]);
    deleteAllDoublonsModal.close();
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <PageHeader
        title={isMine ? "Mes duplicats d'effectifs" : "Ses duplicats d'effectifs"}
        backLink={{ href: `/organismes/${organismeId}/effectifs`, label: "Retour au tableau des effectifs" }}
        action={
          <Button priority="secondary" iconId="fr-icon-delete-line" onClick={() => deleteAllDoublonsModal.open()}>
            Supprimer en lot
          </Button>
        }
      />

      {isMine && (
        <div className={styles.intro}>
          <p className={styles.introTitle}>
            Vérifiez {duplicates?.length === 1 ? "le duplicat" : `les ${duplicates?.length} duplicats`}
            &nbsp;d&apos;effectifs. Pour chacun, supprimez celui avec les informations incorrectes.
          </p>
          <p>
            Les effectifs ci-dessous apparaissent en doublons car une ou plusieurs données ont été modifiées sur chacun
            d’entre eux.
          </p>
          <p>
            Ces dernières sont signalées en <span className={styles.rougeSignal}>rouge</span>.
          </p>
          <p>
            Par exemple, un code RNCP a été rajouté ou un numéro de téléphone a été modifié. Vérifiez les informations
            en dépliant chaque ligne et supprimez le(s) doublon(s) incorrect(s).
          </p>
          <p>
            En cas de difficulté, lisez la{" "}
            <a href={CRISP_FAQ} target="_blank" rel="noopener noreferrer" className="fr-link">
              FAQ dédiée
            </a>{" "}
            ou{" "}
            <a href={SUPPORT_PAGE_ACCUEIL} target="_blank" rel="noopener noreferrer" className="fr-link">
              contactez-nous
            </a>
            .
          </p>
        </div>
      )}

      <DoublonsList
        data={duplicates || []}
        pagination={{ total: totalCount, page, limit: pageSize, lastPage }}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSize={pageSize}
        onRequestDelete={onRequestDelete}
      />

      <deleteDoublonModal.Component
        title={`Suppression du duplicat d'apprenant ${duplicateToDelete?.apprenant?.nom ?? ""} ${duplicateToDelete?.apprenant?.prenom ?? ""}`}
        buttons={[
          { children: "Annuler", doClosesModal: true, priority: "secondary" },
          {
            children: "Supprimer",
            priority: "primary",
            doClosesModal: false,
            nativeButtonProps: { type: "button" },
            onClick: confirmDeleteDuplicate,
          },
        ]}
      >
        <p className="fr-text--bold fr-mb-0">Cette opération est irréversible.</p>
        <p>Êtes-vous sûr.e de vouloir supprimer ce duplicat d&apos;apprenant ?</p>
        <Alert
          severity="warning"
          title="Attention, veuillez vérifier que ce doublon n‘existe pas déjà dans votre système ERP pour éviter des erreurs de synchronisation des données."
          description=""
          className="fr-mt-3w"
        />
      </deleteDoublonModal.Component>

      <deleteAllDoublonsModal.Component
        title={`Suppression des ${totalCount} duplicats d'apprenant`}
        buttons={[
          { children: "Annuler", doClosesModal: true, priority: "secondary" },
          {
            children: "Supprimer",
            priority: "primary",
            doClosesModal: false,
            nativeButtonProps: { type: "button" },
            onClick: confirmDeleteAll,
          },
        ]}
      >
        <p className="fr-text--bold fr-mb-0">Seuls les duplicats les plus anciens seront supprimés.</p>
        <p>Cette opération est irréversible.</p>
        <Alert
          severity="warning"
          title="Attention, veuillez vérifier que ce doublon n‘existe pas déjà dans votre système ERP pour éviter des erreurs de synchronisation des données."
          description=""
          className="fr-mt-3w"
        />
      </deleteAllDoublonsModal.Component>
    </div>
  );
}
