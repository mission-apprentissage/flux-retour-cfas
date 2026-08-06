"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import type { FrIconClassName } from "@codegouvfr/react-dsfr/fr/generatedFromCss/classNames";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { IOrganisationCreate } from "shared";

import { InscriptionFranceTravail } from "@/app/_components/inscription/InscriptionFranceTravail";
import { InscriptionOperateurPublic } from "@/app/_components/inscription/InscriptionOperateurPublic";
import { OrganismeSearchForm } from "@/app/_components/inscription/OrganismeSearchForm";
import { PAGES } from "@/app/_utils/routes.utils";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { _post } from "@/common/httpClient";
import { getApiErrorMessage } from "@/common/rateLimit";

import { ARMLSelect } from "./ARMLSelect";
import { CarifOrefForm } from "./CarifOrefForm";
import styles from "./impostures.module.scss";
import { MissionLocaleSearch } from "./MissionLocaleSearch";
import { ReseauSelect } from "./ReseauSelect";

type FamilyId =
  | "organisme-formation"
  | "operateur-public"
  | "carif-oref"
  | "tete-de-reseau"
  | "mission-locale"
  | "arml"
  | "france-travail";

type Family = { id: FamilyId; label: string; icon: FrIconClassName; hint: string };

const FAMILIES: Family[] = [
  {
    id: "organisme-formation",
    label: "Organisme de formation",
    icon: "fr-icon-building-line",
    hint: "Recherchez un organisme par son SIRET, puis confirmez l’établissement à imposter.",
  },
  {
    id: "operateur-public",
    label: "Opérateur public",
    icon: "fr-icon-government-line",
    hint: "D(R)(I)EETS, DDETS, académie, ainsi que les quatre types décommissionnés.",
  },
  {
    id: "carif-oref",
    label: "CARIF OREF",
    icon: "fr-icon-book-2-line",
    hint: "Le réseau national INTERCARIFOREF ou un CARIF OREF régional.",
  },
  {
    id: "tete-de-reseau",
    label: "Tête de réseau",
    icon: "fr-icon-links-line",
    hint: "La tête d’un réseau d’organismes de formation.",
  },
  {
    id: "mission-locale",
    label: "Mission Locale",
    icon: "fr-icon-map-pin-user-line",
    hint: "Recherchez une mission locale par son nom, sa ville ou son code postal.",
  },
  {
    id: "arml",
    label: "ARML",
    icon: "fr-icon-team-line",
    hint: "Une association régionale des missions locales.",
  },
  {
    id: "france-travail",
    label: "France Travail",
    icon: "fr-icon-briefcase-line",
    hint: "Une structure régionale France Travail.",
  },
];

const isFamilyId = (value: string | null | undefined): value is FamilyId =>
  FAMILIES.some((family) => family.id === value);

export default function ImposturesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams?.get("type");
  const activeId: FamilyId = isFamilyId(requested) ? requested : FAMILIES[0].id;
  const activeFamily = FAMILIES.find((family) => family.id === activeId) as Family;

  const [organisation, setOrganisation] = useState<IOrganisationCreate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organisation) {
      return;
    }
    setError(null);
    _post<IOrganisationCreate>("/api/v1/admin/impersonate", organisation)
      .then(() => {
        window.location.href = "/";
      })
      .catch((err: any) => {
        setError(getApiErrorMessage(err));
        setOrganisation(null);
      });
  }, [organisation]);

  const selectFamily = (id: FamilyId) => {
    setOrganisation(null);
    setError(null);
    router.replace(`${PAGES.static.adminImpostures.getPath()}?type=${id}`, { scroll: false });
  };

  const renderForm = (id: FamilyId) => {
    switch (id) {
      case "organisme-formation":
        return (
          <>
            <p className={styles.formLead}>
              Pour trouver des SIRET d’OFA, consultez le{" "}
              <a
                className={fr.cx("fr-link")}
                href="https://referentiel.apprentissage.onisep.fr/organismes?uais=true"
                target="_blank"
                rel="noopener noreferrer"
              >
                référentiel de l’apprentissage
              </a>
              .
            </p>
            <OrganismeSearchForm kind="siret" organisation={organisation} setOrganisation={setOrganisation} />
          </>
        );
      case "operateur-public":
        return <InscriptionOperateurPublic setOrganisation={setOrganisation} showDecommissioned />;
      case "carif-oref":
        return <CarifOrefForm setOrganisation={setOrganisation} />;
      case "tete-de-reseau":
        return <ReseauSelect setOrganisation={setOrganisation} />;
      case "mission-locale":
        return <MissionLocaleSearch setOrganisation={setOrganisation} />;
      case "arml":
        return <ARMLSelect setOrganisation={setOrganisation} />;
      case "france-travail":
        return <InscriptionFranceTravail setOrganisation={setOrganisation} />;
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Impostures"
        intro="Se faire passer pour un membre d’une organisation, à des fins de test. Dès qu’une organisation est sélectionnée, le tableau de bord s’ouvre sous son identité."
      />

      {error && (
        <div className={styles.notice}>
          <Alert severity="error" title="L’imposture a échoué" description={error} />
        </div>
      )}

      {organisation && !error && (
        <div className={styles.notice}>
          <Alert severity="info" title="Imposture en cours" description="Ouverture du tableau de bord…" />
        </div>
      )}

      <div className={styles.layout}>
        <nav aria-label="Type d’organisation">
          <p className={styles.familiesTitle}>Type d’organisation</p>
          <ul className={styles.familiesList}>
            {FAMILIES.map((family) => (
              <li key={family.id}>
                <button
                  type="button"
                  className={styles.familyButton}
                  aria-current={family.id === activeId ? "true" : undefined}
                  onClick={() => selectFamily(family.id)}
                >
                  <i className={fr.cx(family.icon)} aria-hidden />
                  <span>{family.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className={styles.panel} aria-labelledby="impostures-panel-title">
          <h2 id="impostures-panel-title" className={styles.panelTitle}>
            {activeFamily.label}
          </h2>
          <p className={styles.panelHint}>{activeFamily.hint}</p>
          <div key={activeId}>{renderForm(activeId)}</div>
        </section>
      </div>
    </>
  );
}
