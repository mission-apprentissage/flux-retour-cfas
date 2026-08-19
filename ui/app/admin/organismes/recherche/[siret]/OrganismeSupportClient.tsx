"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { OrganismeSupportInfoJson, UAI_INCONNUE_TAG_FORMAT } from "shared";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";

import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { PAGES } from "@/app/_utils/routes.utils";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminUsersTable } from "@/app/admin/_components/AdminUsersTable";
import { _get } from "@/common/httpClient";

import { EtablissementComparison } from "../_components/EtablissementComparison";
import { FormationsTable } from "../_components/FormationsTable";
import { RelatedOrganismes } from "../_components/RelatedOrganismes";
import { FormationsCard, ReferentielCard, TdbCard, TransmissionCard } from "../_components/SourceCards";
import { TransmissionsTable } from "../_components/TransmissionsTable";

import styles from "./organisme-support.module.scss";

export default function OrganismeSupportClient({ siret }: { siret: string }) {
  const searchParams = useSearchParams();
  const uai = searchParams?.get("uai") ?? null;
  const query = searchParams?.get("q") ?? "";

  const {
    data: organismes,
    error,
    isLoading,
  } = useQuery<OrganismeSupportInfoJson[], any>(["admin", "organismes-support", siret], ({ signal }) =>
    _get(`/api/v1/admin/organismes/search/${encodeURIComponent(siret)}`, { signal })
  );

  const supportInfo = useMemo(() => {
    if (!organismes || organismes.length === 0) return null;
    return organismes.find((organisme) => (organisme.uai ?? null) === uai) ?? organismes[0];
  }, [organismes, uai]);

  const nom = supportInfo?.nom ?? "Organisme";

  useEffect(() => {
    if (!supportInfo) return;
    document.title = PAGES.dynamic.adminOrganismeSupport({ siret, nom }).getMetadata().title as string;
  }, [supportInfo, siret, nom]);

  const backLink = {
    href: query
      ? `${PAGES.static.adminOrganismesRecherche.getPath()}?q=${encodeURIComponent(query)}`
      : PAGES.static.adminOrganismesRecherche.getPath(),
    label: "Retour à la recherche",
  };

  if (error) {
    return (
      <>
        <AdminPageHeader backLink={backLink} title="Organisme introuvable" />
        <Alert
          severity="error"
          title="Impossible de charger cet organisme"
          description={`Les sources n’ont pas pu être interrogées pour le SIRET ${siret}. Veuillez réessayer ultérieurement.`}
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <AdminPageHeader backLink={backLink} title="Chargement de l’organisme" />
        <TableSkeleton />
      </>
    );
  }

  if (!supportInfo) {
    return (
      <>
        <AdminPageHeader backLink={backLink} title="Organisme introuvable" />
        <Alert
          severity="warning"
          title="Aucun organisme pour ce SIRET"
          description={`Aucune des quatre sources ne connaît le SIRET ${siret}.`}
        />
      </>
    );
  }

  const formations = supportInfo.formations as OffreFormation[];
  const identity = { siret: supportInfo.siret, uai: supportInfo.uai };
  const users = supportInfo.organisation?.users ?? [];
  const responsables = supportInfo.tdb?.organismesResponsables ?? [];
  const formateurs = supportInfo.tdb?.organismesFormateurs ?? [];

  return (
    <>
      <AdminPageHeader
        backLink={backLink}
        title={nom}
        intro={
          <>
            UAI : {supportInfo.uai ?? UAI_INCONNUE_TAG_FORMAT} — SIRET : {supportInfo.siret} — {supportInfo.effectifs}{" "}
            effectif{supportInfo.effectifs > 1 ? "s" : ""}
          </>
        }
        action={
          supportInfo.tdb?._id ? (
            <Button
              priority="secondary"
              linkProps={{ href: `/organismes/${supportInfo.tdb._id}` }}
              iconId="fr-icon-arrow-right-line"
              iconPosition="right"
            >
              Voir la fiche organisme
            </Button>
          ) : undefined
        }
      />

      <Tabs
        className={styles.tabs}
        tabs={[
          {
            label: "Général",
            content: (
              <div className={styles.section}>
                <EtablissementComparison supportInfo={supportInfo} />
                <div className={styles.cards}>
                  <TdbCard organisme={supportInfo.tdb} organisation={supportInfo.organisation} />
                  <TransmissionCard organisme={supportInfo.tdb} />
                  <ReferentielCard organisme={supportInfo.referentiel} />
                  <FormationsCard organisme={supportInfo.tdb} formations={formations} />
                </div>
              </div>
            ),
          },
          {
            label: `Utilisateurs (${users.length})`,
            content:
              users.length === 0 ? (
                <p>Aucun compte utilisateur n’est rattaché à cet organisme.</p>
              ) : (
                <AdminUsersTable users={users} caption={`${users.length} utilisateur${users.length > 1 ? "s" : ""}`} />
              ),
          },
          {
            label: `Responsables (${responsables.length})`,
            content: (
              <RelatedOrganismes
                organisme={identity}
                relatedOrganismes={responsables}
                formations={formations}
                type="responsables"
              />
            ),
          },
          {
            label: `Formateurs (${formateurs.length})`,
            content: (
              <RelatedOrganismes
                organisme={identity}
                relatedOrganismes={formateurs}
                formations={formations}
                type="formateurs"
              />
            ),
          },
          {
            label: `Formations (${formations.length})`,
            content: (
              <FormationsTable
                organisme={identity}
                formations={formations}
                tableLabel={`Formations de ${nom} au catalogue`}
              />
            ),
          },
          {
            label: `Transmissions (${supportInfo.transmissions.length})`,
            content: <TransmissionsTable organisme={identity} transmissions={supportInfo.transmissions} />,
          },
        ]}
      />
    </>
  );
}
