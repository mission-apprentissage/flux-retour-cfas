"use client";

import { ErrorMessage, useField, useFormikContext } from "formik";
import { RQTH_DECLARE_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { dePrenom } from "@/app/_utils/ruptures.utils";

import { ReferentSection } from "../../sections/ReferentSection";
import { FormValues } from "../../types";
import styles from "../Tunnel.module.css";

function TextField({
  name,
  label,
  hint,
  placeholder,
  required,
  type = "text",
  onEdited,
}: {
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  onEdited?: () => void;
}) {
  const [field, meta] = useField(name);

  return (
    <div className={styles.fieldGroup}>
      <label className="fr-label" htmlFor={name}>
        {label}
        {required && " *"}
        {hint && <span className="fr-hint-text">{hint}</span>}
      </label>
      <input
        {...field}
        id={name}
        type={type}
        placeholder={placeholder}
        className={`fr-input ${meta.touched && meta.error ? "fr-input--error" : ""}`}
        onBlur={(e) => {
          field.onBlur(e);
          onEdited?.();
        }}
      />
      <ErrorMessage name={name} component="p" className="fr-error-text" />
    </div>
  );
}

interface Step3ContactProps {
  prenom: string;
  nom: string;
  isMineur: boolean;
}

export function Step3Contact({ prenom, nom, isMineur }: Step3ContactProps) {
  const { values, setFieldValue } = useFormikContext<FormValues>();
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const trackCoordonnees = (champ: string) => () =>
    trackPlausibleEvent("cfa_form_coordonnees_modifiees", undefined, { champ });

  return (
    <div className={styles.fields}>
      <div className={styles.minorBanner}>
        <span aria-hidden="true">💡</span>
        <span>
          <strong>Merci de vérifier si les coordonnées du jeune sont correctes.</strong> Sinon, merci de les corriger
          afin que la Mission Locale puisse contacter le jeune dans les plus brefs délais.
        </span>
      </div>

      <p className={styles.blockTitle}>Informations {dePrenom(`${prenom} ${nom}`)}</p>

      <TextField
        name="verified_info.telephone"
        label="N° de téléphone du jeune"
        required
        onEdited={trackCoordonnees("telephone")}
      />
      <TextField name="verified_info.courriel" label="Courriel du jeune" onEdited={trackCoordonnees("courriel")} />
      <TextField
        name="verified_info.adresse_rue"
        label="Adresse postale du jeune"
        required
        hint="Si vous ne disposez pas de l'adresse complète du jeune, saisissez uniquement le code postal et sélectionnez la commune."
        onEdited={trackCoordonnees("adresse")}
      />
      <TextField name="verified_info.adresse_code_postal" label="Code postal" required />
      <TextField name="verified_info.adresse_commune" label="Commune" required />

      <div className={styles.fieldGroup}>
        <label className="fr-label" htmlFor="rqth_declare">
          Statut RQTH <em>Travailleur handicapé</em>
          <span className="fr-hint-text">
            Cette information est facultative. Toutefois, sachez que les jeunes reconnus RQTH bénéficient de dispositifs
            et d&apos;aides spécifiques auprès du service public à l&apos;emploi et des Missions Locales.
          </span>
        </label>
        <select
          id="rqth_declare"
          className="fr-select"
          value={values.rqth_declare}
          onChange={(e) => setFieldValue("rqth_declare", e.target.value)}
        >
          <option value={RQTH_DECLARE_ENUM.NON_RENSEIGNE}>- Non renseigné -</option>
          <option value={RQTH_DECLARE_ENUM.OUI}>Oui</option>
          <option value={RQTH_DECLARE_ENUM.NON}>Non</option>
        </select>
      </div>

      {isMineur && (
        <>
          <p className={styles.blockTitle}>Coordonnées des responsables légaux du jeune</p>
          <div className={styles.minorBanner}>
            <span aria-hidden="true">💡</span>
            <span>
              <strong>
                {prenom} {nom} a moins de 18 ans. Si vous les connaissez, renseignez les coordonnées de ses responsables
                légaux.
              </strong>{" "}
              Si le jeune n&apos;est pas joignable, la Mission Locale pourra contacter ses responsables légaux.
            </span>
          </div>
          <TextField
            name="responsable_legal.nom"
            label="Nom complet du responsable légal"
            hint="Prénom et Nom de famille"
            placeholder="Nom complet"
          />
          <TextField
            name="responsable_legal.telephone"
            label="Téléphone responsable légal"
            placeholder="06 00 00 00 00"
          />
          <TextField
            name="responsable_legal.courriel"
            label="Courriel responsable légal"
            placeholder="adresse courriel"
          />
        </>
      )}

      <ReferentSection prenom={prenom} />
    </div>
  );
}
