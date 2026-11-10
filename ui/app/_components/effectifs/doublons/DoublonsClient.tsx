"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  CRISP_FAQ,
  DuplicateEffectifDetail,
  DuplicateEffectifGroup,
  DuplicateEffectifGroupPagination,
  SUPPORT_PAGE_ACCUEIL,
} from "shared";

import { PageHeader } from "@/app/_components/page-header/PageHeader";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { PAGES } from "@/app/_utils/routes.utils";
import { _delete, _get } from "@/common/httpClient";
import { getApiErrorMessage } from "@/common/rateLimit";

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
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [message, setMessage] = useState<{ severite: "error" | "warning"; texte: string } | null>(null);
  const zoneMessage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message) {
      zoneMessage.current?.focus();
    }
  }, [message]);

  const { data: duplicates, isLoading } = useQuery<DuplicateEffectifGroup[]>({
    queryKey: [`duplicates-effectifs`, organismeId, page, pageSize],
    queryFn: async () => {
      const response = await _get<DuplicateEffectifGroupPagination>(`/api/v1/organismes/${organismeId}/duplicates`, {
        params: { page, limit: pageSize },
      });
      setTotalCount(response.totalItems);
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const lastPage = Math.max(1, Math.ceil(totalCount / pageSize));

  const onRequestDelete = (duplicate: DuplicateEffectifDetail) => {
    setDuplicateToDelete(duplicate);
    deleteDoublonModal.open();
  };

  const confirmDeleteDuplicate = async () => {
    if (!duplicateToDelete || suppressionEnCours) return;
    setSuppressionEnCours(true);
    setMessage(null);
    try {
      await _delete(`/api/v1/effectif/${duplicateToDelete.id}`);
      trackPlausibleEvent("suppression_doublons_effectifs");
    } catch (error) {
      setMessage({ severite: "error", texte: getApiErrorMessage(error, "Le doublon n'a pas pu être supprimé.") });
    } finally {
      setSuppressionEnCours(false);
      queryClient.invalidateQueries({ queryKey: ["duplicates-effectifs"] });
      deleteDoublonModal.close();
      setDuplicateToDelete(null);
    }
  };

  const confirmDeleteAll = async () => {
    if (suppressionEnCours) return;
    setSuppressionEnCours(true);
    setMessage(null);
    try {
      const { supprimes, refuses } = await _delete<{ supprimes: number; refuses: number }>(
        `/api/v1/organismes/${organismeId}/duplicates`
      );
      trackPlausibleEvent("suppression_doublons_effectifs_en_lot", undefined, {
        nb_doublons_supprimes_lot: supprimes,
      });
      if (refuses > 0) {
        setMessage({
          severite: "warning",
          texte: `${refuses} ${refuses > 1 ? "doublons n'ont pas été supprimés : leur dossier" : "doublon n'a pas été supprimé : son dossier"} Mission Locale ne peut pas être reporté sur l'effectif conservé.`,
        });
      }
    } catch (error) {
      setMessage({
        severite: "error",
        texte: getApiErrorMessage(error, "Les doublons n'ont pas pu être supprimés."),
      });
    } finally {
      setSuppressionEnCours(false);
      queryClient.invalidateQueries({ queryKey: ["duplicates-effectifs"] });
      deleteAllDoublonsModal.close();
    }
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div>
      <PageHeader
        title={isMine ? "Mes duplicats d'effectifs" : "Ses duplicats d'effectifs"}
        backLink={{
          href: isMine ? PAGES.static.effectifs.getPath() : `/organismes/${organismeId}/effectifs`,
          label: "Retour au tableau des effectifs",
        }}
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
            Les effectifs ci-dessous ont les mêmes nom, prénom et date de naissance, mais des identifiants différents :
            le même apprenant a été transmis deux fois, par exemple par votre ERP et par un fichier.
          </p>
          <p>
            Les informations qui diffèrent d&apos;un effectif à l&apos;autre, par exemple un code RNCP ou un numéro de
            téléphone, sont signalées en <span className={styles.rougeSignal}>rouge</span>. Vérifiez-les en dépliant
            chaque ligne et supprimez le ou les doublons incorrects.
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

      <div ref={zoneMessage} tabIndex={-1} aria-live="polite">
        {message && (
          <Alert severity={message.severite} title={message.texte} description="" small closable className="fr-mb-3w" />
        )}
      </div>

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
        <p className="fr-text--bold fr-mb-0">
          L&apos;effectif supprimé est archivé, et ses dossiers Mission Locale sont reportés sur l&apos;effectif
          conservé.
        </p>
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
        <p className="fr-text--bold fr-mb-0">
          Pour chaque apprenant, l&apos;effectif transmis par un ERP est conservé, sinon le dernier transmis.
        </p>
        <p>
          Les autres effectifs sont archivés, et leurs dossiers Mission Locale sont reportés sur l&apos;effectif
          conservé.
        </p>
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
