"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { IOrganisationMissionLocale } from "shared";

import ARMLIndicateurGlobal from "@/app/_components/arml/ARMLIndicateurGlobal";
import CustomBreadcrumb from "@/app/_components/Breadcrumb";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";

function MissionLocaleContent({ mlId }: { mlId: string }) {
  const { data: ml } = useQuery<IOrganisationMissionLocale>(
    ["ml", mlId],
    async () => {
      const data = await _get(`/api/v1/organisation/arml/mls/${mlId}`);
      return data;
    },
    {
      suspense: true,
    }
  );

  return (
    <>
      <CustomBreadcrumb path={`/arml/missions-locales/[mlId]`} name={ml!.nom} />
      <h3 className="fr-h3" style={{ marginBottom: "2rem", color: "var(--text-title-blue-france)" }}>
        Mission Locale {ml!.nom}
      </h3>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-md-6 fr-col-12" style={{ marginBottom: "2rem" }}>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-4">
              <p style={{ textAlign: "left", fontWeight: "bold", marginBottom: "0.5rem" }}>Siret</p>
            </div>
            <div className="fr-col-8">
              <p style={{ textAlign: "left", marginBottom: "0.5rem" }}>{ml!.siret ?? "--"}</p>
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-4">
              <p style={{ textAlign: "left", fontWeight: "bold", marginBottom: "0.5rem" }}>Adresse</p>
            </div>
            <div className="fr-col-8">
              <p style={{ textAlign: "left", marginBottom: "0.5rem" }}>
                {ml!.adresse ? `${ml!.adresse.commune}, ${ml!.adresse.code_postal}` : "--"}
              </p>
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-4">
              <p style={{ textAlign: "left", fontWeight: "bold", marginBottom: "0.5rem" }}>Courriel</p>
            </div>
            <div className="fr-col-8">
              <p style={{ textAlign: "left", marginBottom: "0.5rem" }}>{ml!.email ?? "--"}</p>
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-4">
              <p style={{ textAlign: "left", fontWeight: "bold", marginBottom: "0.5rem" }}>Site internet</p>
            </div>
            <div className="fr-col-8">
              <p style={{ textAlign: "left", marginBottom: "0.5rem" }}>
                {ml!.site_web ? (
                  <a href={ml!.site_web} target="_blank" rel="noopener noreferrer" className="fr-link">
                    {ml!.site_web}
                  </a>
                ) : (
                  "--"
                )}
              </p>
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-4">
              <p style={{ textAlign: "left", fontWeight: "bold", marginBottom: "0.5rem" }}>Téléphone</p>
            </div>
            <div className="fr-col-8">
              <p style={{ textAlign: "left", marginBottom: "0.5rem" }}>{ml!.telephone ?? "--"}</p>
            </div>
          </div>
        </div>
        <div className="fr-col-12">
          <ARMLIndicateurGlobal armls={[ml!]} />
        </div>
      </div>
    </>
  );
}

export default function AMLRMissionLocaleDetailsPage({ params }: { params: Promise<{ mlId: string }> }) {
  const { mlId } = use(params);

  return (
    <SuspenseWrapper fallback={<TableSkeleton />}>
      <MissionLocaleContent mlId={mlId} />
    </SuspenseWrapper>
  );
}
