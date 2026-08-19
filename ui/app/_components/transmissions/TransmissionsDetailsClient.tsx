"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EFFECTIFS_GROUP } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { PageHeader } from "@/app/_components/page-header/PageHeader";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { DataTable } from "@/app/_components/table/DataTable";
import { formatDate } from "@/app/_utils/date.utils";
import { PAGES } from "@/app/_utils/routes.utils";
import { _get } from "@/common/httpClient";
import { formatDateHourMinutesSecondsMs } from "@/common/utils/dateUtils";
import { useOrganisationOrganisme, useOrganisme } from "@/hooks/organismes";

import { EffectifQueueItemDetail } from "./EffectifQueueItemDetail";
import styles from "./transmissions.module.scss";
import { TransmissionsErrorSummary } from "./TransmissionsErrorSummary";

const ERROR_COLUMNS = [
  { label: "Apprenant", dataKey: "apprenant", width: "24%", sortable: false },
  { label: "Date de naissance", dataKey: "birthdate", sortable: false },
  { label: "Code Diplôme", dataKey: "code_diplome", sortable: false },
  { label: "RNCP", dataKey: "code_rncp", sortable: false },
  { label: "Heure d'envoi", dataKey: "processed_at", sortable: false },
  { label: "Erreurs", dataKey: "errors", sortable: false },
];

const SUCCESS_COLUMNS = [
  { label: "Nom de l'établissement", dataKey: "organisme_name", width: "30%", sortable: false },
  { label: "SIRET", dataKey: "organisme_siret", sortable: false },
  { label: "UAI", dataKey: "organisme_uai", sortable: false },
  { label: "Adresse", dataKey: "organisme_address", sortable: false },
  { label: "Effectifs", dataKey: "organisme_effectifs", sortable: false },
];

interface TransmissionsDetailsClientProps {
  date: string;
  modePublique?: boolean;
  organismeId?: string;
}

export default function TransmissionsDetailsClient({
  date,
  modePublique = false,
  organismeId,
}: TransmissionsDetailsClientProps) {
  const [errorPage, setErrorPage] = useState(1);
  const [errorLimit, setErrorLimit] = useState(20);
  const [successPage, setSuccessPage] = useState(1);
  const [successLimit, setSuccessLimit] = useState(20);

  const { organisme: organisationOrganisme, error: organisationError } = useOrganisationOrganisme(!modePublique);
  const { organisme: organismePublique, error: organismeError } = useOrganisme(modePublique ? organismeId : null);

  const organisme = modePublique ? organismePublique : organisationOrganisme;
  const organismeLoadError = modePublique ? organismeError : organisationError;

  const errorsQuery = useQuery<any, any>(
    ["transmissions-details", organisme?._id, date, errorPage, errorLimit],
    ({ signal }) =>
      _get(`/api/v1/organismes/${organisme?._id}/transmission/${date}/error`, {
        params: { page: errorPage, limit: errorLimit },
        signal,
      }),
    { enabled: !!organisme }
  );

  const successQuery = useQuery<any, any>(
    ["transmissions-details-success", organisme?._id, date, successPage, successLimit],
    ({ signal }) =>
      _get(`/api/v1/organismes/${organisme?._id}/transmission/${date}/success`, {
        params: { page: successPage, limit: successLimit },
        signal,
      }),
    { enabled: !!organisme }
  );

  const errorCount = errorsQuery.data?.pagination?.total ?? 0;
  const successCount = successQuery.data?.totalEffectifs ?? 0;

  const backHref =
    modePublique && organismeId
      ? PAGES.dynamic.organismeTransmissions({ organismeId }).getPath()
      : PAGES.static.transmissions.getPath();

  if (organismeLoadError) {
    return (
      <Alert
        severity="error"
        title="Accès refusé"
        description="Vous ne disposez pas des droits nécessaires pour visualiser cette page."
      />
    );
  }

  const errorRows = (errorsQuery.data?.data ?? []).map((item: any) => ({
    rawData: item,
    element: {
      apprenant: `${item.prenom_apprenant} ${item.nom_apprenant}`,
      birthdate: formatDate(item.date_de_naissance_apprenant),
      code_diplome: item.formation_cfd,
      code_rncp: item.formation_rncp,
      processed_at: formatDateHourMinutesSecondsMs(item.processed_at),
      errors: (item.validation_errors?.length || 0) + (item.error && item.error.trim().length > 0 ? 1 : 0),
    },
  }));

  const successRows = (successQuery.data?.data ?? []).map((item: any) => ({
    rawData: item,
    element: {
      organisme_name: (
        <DsfrLink href={`/organismes/${item.id}`} arrow="none">
          {item.name}
        </DsfrLink>
      ),
      organisme_siret: item.siret,
      organisme_uai: item.uai,
      organisme_address: item.adresse,
      organisme_effectifs: item.effectifCount,
    },
  }));

  return (
    <div>
      <PageHeader
        backLink={{ href: backHref, label: "Retour au tableau des rapports" }}
        title={`Rapport du ${formatDate(date)}`}
        intro={`Mes erreurs de transmissions du ${formatDate(date)}`}
      />

      <Tabs
        tabs={[
          {
            label: `Effectifs en échec (${errorCount})`,
            content: errorsQuery.error ? (
              <Alert
                severity="error"
                title="Impossible de charger les effectifs en échec"
                description="Une erreur est survenue lors du chargement. Veuillez réessayer ultérieurement."
              />
            ) : !organisme || errorsQuery.isLoading ? (
              <TableSkeleton />
            ) : (
              <>
                <TransmissionsErrorSummary
                  summary={errorsQuery.data?.summary ?? {}}
                  isLoading={errorsQuery.isFetching}
                />
                <p className="fr-my-3w">Cliquez sur une ligne d’apprenant pour identifier les données en erreur.</p>
                <DataTable
                  data={errorRows}
                  columns={ERROR_COLUMNS}
                  tableLabel="Effectifs en échec"
                  pagination={errorsQuery.data?.pagination ?? null}
                  onPageChange={setErrorPage}
                  onPageSizeChange={setErrorLimit}
                  pageSize={errorLimit}
                  emptyMessage="Aucun effectif en échec pour cette journée"
                  expandMode="single"
                  renderSubComponent={(rowData) => <EffectifQueueItemDetail effectifQueueItem={rowData} />}
                />
              </>
            ),
          },
          {
            label: `Effectifs transmis (${successCount})`,
            content: successQuery.error ? (
              <Alert
                severity="error"
                title="Impossible de charger les effectifs transmis"
                description="Une erreur est survenue lors du chargement. Veuillez réessayer ultérieurement."
              />
            ) : !organisme || successQuery.isLoading ? (
              <TableSkeleton />
            ) : (
              <>
                <div className="fr-my-3w">
                  <p>Identifiez les organismes vers lesquels les effectifs ont été transmis et affectés.</p>
                  <p className={styles.detailNotice}>
                    <i className="fr-icon-info-fill fr-icon--sm" aria-hidden="true" /> Les établissements ci-dessous
                    sont rattachés aux vôtres. Si vous avez une question, ou constatez une anomalie, veuillez{" "}
                    <a href={EFFECTIFS_GROUP} target="_blank" rel="noopener noreferrer" className="fr-link">
                      nous contacter
                    </a>
                    .
                  </p>
                </div>
                <DataTable
                  data={successRows}
                  columns={SUCCESS_COLUMNS}
                  tableLabel="Effectifs transmis"
                  pagination={successQuery.data?.pagination ?? null}
                  onPageChange={setSuccessPage}
                  onPageSizeChange={setSuccessLimit}
                  pageSize={successLimit}
                  emptyMessage="Aucun effectif transmis pour cette journée"
                />
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
