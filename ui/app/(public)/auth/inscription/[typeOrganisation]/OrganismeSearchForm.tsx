"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Field, Form, Formik } from "formik";
import { useState } from "react";
import { natureOrganismeDeFormationLabel, SUPPORT_PAGE_ACCUEIL, type IOrganisme } from "shared";

import { siretRegex } from "@/common/domain/siret";
import { UAI_REGEX } from "@/common/domain/uai";
import { _post } from "@/common/httpClient";
import { getApiErrorMessage } from "@/common/rateLimit";
import { sleep } from "@/common/utils/misc";

import styles from "./inscription-organisation.module.scss";
import type { InscriptionFormProps } from "./types";

export type OrganismeSearchKind = "uai" | "siret";

type SearchConfig = {
  label: string;
  hint: string;
  placeholder: string;
  regex: RegExp;
  formatError: string;
  requiredError: string;
  endpoint: string;
  notFoundLead: string;
  multipleResults: string;
};

const SEARCH_CONFIG: Record<OrganismeSearchKind, SearchConfig> = {
  uai: {
    label: "UAI de votre organisme",
    hint: "Une UAI au format valide est composée de 7 chiffres et 1 lettre",
    placeholder: "Exemple : 1234567A",
    regex: UAI_REGEX,
    formatError: "UAI invalide",
    requiredError: "L'UAI est obligatoire",
    endpoint: "/api/v1/organismes/search-by-uai",
    notFoundLead: "Ce code UAI n’a pas été trouvé dans le",
    multipleResults: "Plusieurs SIRET sont identifiés pour cette UAI. Choisissez votre établissement.",
  },
  siret: {
    label: "SIRET de votre organisme",
    hint: "Un SIRET au format valide est composé de 14 chiffres",
    placeholder: "Exemple : 98765432400019",
    regex: siretRegex,
    formatError: "SIRET invalide",
    requiredError: "Le SIRET est obligatoire",
    endpoint: "/api/v1/organismes/search-by-siret",
    notFoundLead: "Ce SIRET n’a pas été trouvé dans le",
    multipleResults: "Plusieurs UAI sont identifiés pour ce SIRET. Choisissez votre établissement.",
  },
};

type SearchedOrganisme = Pick<
  IOrganisme,
  "siret" | "uai" | "enseigne" | "raison_sociale" | "ferme" | "nature" | "adresse"
>;

function OrganismeDetails({ organisme }: { organisme: SearchedOrganisme }) {
  return (
    <div className={styles.organismeDetails}>
      <p>
        UAI : <b>{organisme.uai || "Inconnu"}</b>
      </p>
      <p>
        Nature : <b>{(organisme.nature && natureOrganismeDeFormationLabel[organisme.nature]) || "Inconnue"}</b>
      </p>
      <p>
        SIRET :{" "}
        <b>
          {organisme.siret} ({organisme.ferme ? "fermé" : "en activité"})
        </b>
      </p>
      <p>
        Raison sociale : <b>{organisme.enseigne || organisme.raison_sociale}</b>
      </p>
      <p>
        Adresse : <b>{organisme.adresse?.complete}</b>
      </p>
      {organisme.ferme && (
        <p className={styles.organismeClosed}>Le SIRET {organisme.siret} est un établissement fermé.</p>
      )}
    </div>
  );
}

function NotFoundMessage({ lead }: { lead: string }) {
  return (
    <span>
      {lead}{" "}
      <a
        className={fr.cx("fr-link")}
        href="https://referentiel.apprentissage.onisep.fr/"
        target="_blank"
        rel="noopener noreferrer"
      >
        référentiel de l’apprentissage
      </a>
      .
      <br />
      Si vous pensez que c’est une erreur, veuillez nous contacter :{" "}
      <a className={fr.cx("fr-link")} href={SUPPORT_PAGE_ACCUEIL} target="_blank" rel="noopener noreferrer">
        contactez-nous
      </a>
      .
    </span>
  );
}

export function OrganismeSearchForm({
  kind,
  organisation,
  setOrganisation,
}: InscriptionFormProps & { kind: OrganismeSearchKind }) {
  const config = SEARCH_CONFIG[kind];
  const [organismes, setOrganismes] = useState<SearchedOrganisme[] | null>(null);

  const selectOrganisme = (organisme: SearchedOrganisme) =>
    setOrganisation({
      type: "ORGANISME_FORMATION",
      siret: organisme.siret,
      uai: organisme.uai || null,
    });

  return (
    <Formik
      initialValues={{ [kind]: "" } as Record<string, string>}
      validateOnBlur={false}
      validate={(values) => {
        const value = values[kind];
        if (!value) return { [kind]: config.requiredError };
        if (!config.regex.test(value)) return { [kind]: config.formatError };
        return {};
      }}
      onSubmit={async (values, actions) => {
        try {
          const found = await _post(config.endpoint, { [kind]: values[kind] });
          await sleep(500); // attente pour ne pas paraitre trop instantané...
          setOrganismes(found);
        } catch (err) {
          actions.setFieldError(kind, getApiErrorMessage(err));
        } finally {
          actions.setSubmitting(false);
        }
      }}
    >
      {(form) => (
        <Form noValidate>
          <Field name={kind}>
            {({ field, meta }: any) => (
              <Input
                label={
                  <>
                    {config.label} <span className={styles.requiredMark}>*</span>
                  </>
                }
                hintText={config.hint}
                state={meta.error && meta.touched ? "error" : "default"}
                stateRelatedMessage={
                  meta.error === "Aucun organisme trouvé" ? <NotFoundMessage lead={config.notFoundLead} /> : meta.error
                }
                nativeInputProps={{
                  id: field.name,
                  name: field.name,
                  value: field.value,
                  placeholder: config.placeholder,
                  disabled: form.isSubmitting,
                  onBlur: field.onBlur,
                  onChange: (event) => {
                    field.onChange(event);
                    // reset results and selection
                    setOrganisation(null);
                    setOrganismes([]);

                    // try to submit the form
                    setTimeout(() => {
                      form.submitForm();
                    });
                  },
                }}
              />
            )}
          </Field>

          {form.isSubmitting && (
            <p className={styles.searchStatus} role="status">
              Recherche en cours…
            </p>
          )}

          {organismes && organismes.length === 1 && (
            <>
              <div className={styles.organismeFound}>
                <p className={styles.organismeFoundTitle}>Organisme de formation identifié :</p>
                <OrganismeDetails organisme={organismes[0]} />
              </div>
              <Button
                className={styles.selectOrganismeButton}
                type="button"
                disabled={Boolean(organismes[0].ferme || organisation)}
                onClick={() => selectOrganisme(organismes[0])}
              >
                Ceci est mon organisme
              </Button>
            </>
          )}

          {organismes && organismes.length >= 2 && (
            <>
              <p className={styles.searchStatus}>
                <i className={fr.cx("fr-icon-warning-fill")} aria-hidden />
                &nbsp;{config.multipleResults}
              </p>
              {organismes.map((organisme, index) => (
                <Accordion key={index} label={organisme.raison_sociale || organisme.enseigne || organisme.siret}>
                  <OrganismeDetails organisme={organisme} />
                  <Button
                    className={styles.selectOrganismeButton}
                    type="button"
                    disabled={Boolean(organisme.ferme)}
                    onClick={() => selectOrganisme(organisme)}
                  >
                    Ceci est mon organisme
                  </Button>
                </Accordion>
              ))}
            </>
          )}
        </Form>
      )}
    </Formik>
  );
}
