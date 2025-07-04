"use client";

import { useEffect } from "react";
import { IOrganisationMissionLocale } from "shared";

import ARMLIndicateurGlobal from "@/app/_components/arml/ARMLIndicateurGlobal";
import CustomBreadcrumb from "@/app/_components/Breadcrumb";

interface MissionLocaleDetailsContentProps {
  ml: IOrganisationMissionLocale;
}

export default function MissionLocaleDetailsContent({ ml }: MissionLocaleDetailsContentProps) {
  useEffect(() => {
    if (ml?.nom) {
      document.title = `Mission Locale ${ml.nom} | Tableau de bord de l'apprentissage`;
    }
  }, [ml?.nom]);

  return (
    <>
      <CustomBreadcrumb path={`/arml/missions-locales/[mlId]`} name={ml.nom} />
      <h3 className="fr-h3" style={{ marginBottom: "2rem", color: "var(--text-title-blue-france)" }}>
        Mission Locale {ml.nom}
      </h3>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-md-6 fr-col-12" style={{ marginBottom: "2rem" }}>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-4">
              <p style={{ textAlign: "left", fontWeight: "bold", marginBottom: "0.5rem" }}>Siret</p>
            </div>
            <div className="fr-col-8">
              <p style={{ textAlign: "left", marginBottom: "0.5rem" }}>{ml.siret ?? "--"}</p>
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-4">
              <p style={{ textAlign: "left", fontWeight: "bold", marginBottom: "0.5rem" }}>Adresse</p>
            </div>
            <div className="fr-col-8">
              <p style={{ textAlign: "left", marginBottom: "0.5rem" }}>
                {ml.adresse ? `${ml.adresse.commune}, ${ml.adresse.code_postal}` : "--"}
              </p>
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-4">
              <p style={{ textAlign: "left", fontWeight: "bold", marginBottom: "0.5rem" }}>Courriel</p>
            </div>
            <div className="fr-col-8">
              <p style={{ textAlign: "left", marginBottom: "0.5rem" }}>{ml.email ?? "--"}</p>
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-4">
              <p style={{ textAlign: "left", fontWeight: "bold", marginBottom: "0.5rem" }}>Site internet</p>
            </div>
            <div className="fr-col-8">
              <p style={{ textAlign: "left", marginBottom: "0.5rem" }}>
                {ml.site_web ? (
                  <a href={ml.site_web} target="_blank" rel="noopener noreferrer" className="fr-link">
                    {ml.site_web}
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
              <p style={{ textAlign: "left", marginBottom: "0.5rem" }}>{ml.telephone ?? "--"}</p>
            </div>
          </div>
        </div>
        <div className="fr-col-12">
          <ARMLIndicateurGlobal armls={[ml]} />
        </div>
      </div>
    </>
  );
}
