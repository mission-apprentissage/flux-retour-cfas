import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { ErrorMessage, useField, useFormikContext } from "formik";
import { useState } from "react";
import { ACC_CONJOINT_MOTIF_ENUM } from "shared";

import { MOTIF_EMOJIS, MOTIF_LABELS } from "@/app/_components/ruptures/shared/constants";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import styles from "../CollaborationForm.module.css";
import { FREINS_MOTIFS } from "../constants";
import { FormValues } from "../types";

interface ObjectifsSectionProps {
  prenom: string;
}

function MotifCommentaire({
  motif,
  placeholder,
  rows,
}: {
  motif: ACC_CONJOINT_MOTIF_ENUM;
  placeholder: string;
  rows: number;
}) {
  const [field, meta] = useField(`commentaires_par_motif.${motif}`);
  return (
    <>
      <textarea
        {...field}
        value={field.value ?? ""}
        className={`fr-input ${meta.touched && meta.error ? "fr-input--error" : ""}`}
        placeholder={placeholder}
        rows={rows}
      />
      <ErrorMessage name={`commentaires_par_motif.${motif}`} component="p" className="fr-error-text" />
    </>
  );
}

export function ObjectifsSection({ prenom }: ObjectifsSectionProps) {
  const { values, setFieldValue } = useFormikContext<FormValues>();
  const [freinsOpen, setFreinsOpen] = useState(false);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const hasRecherche = values.motifs.includes(ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI);
  const hasReorientation = values.motifs.includes(ACC_CONJOINT_MOTIF_ENUM.REORIENTATION);
  const showFreinsSection = freinsOpen || values.motifs.some((m) => FREINS_MOTIFS.includes(m));

  const toggleMotif = (motif: ACC_CONJOINT_MOTIF_ENUM, checked: boolean) => {
    if (checked) {
      setFieldValue("motifs", [...values.motifs, motif]);
      if (FREINS_MOTIFS.includes(motif)) {
        trackPlausibleEvent("cfa_form_frein_selectionne", undefined, { frein: motif });
      } else if (motif === ACC_CONJOINT_MOTIF_ENUM.REORIENTATION) {
        trackPlausibleEvent("cfa_form_reorientation_selectionnee");
      } else {
        trackPlausibleEvent("cfa_form_objectif_selectionne", undefined, { objectif: motif });
      }
      if (
        FREINS_MOTIFS.includes(motif) ||
        motif === ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI ||
        motif === ACC_CONJOINT_MOTIF_ENUM.REORIENTATION
      ) {
        setFieldValue(`commentaires_par_motif.${motif}`, values.commentaires_par_motif[motif] ?? "");
      }
    } else {
      const { [motif]: _removed, ...restCommentaires } = values.commentaires_par_motif;
      setFieldValue(
        "motifs",
        values.motifs.filter((m) => m !== motif)
      );
      setFieldValue("commentaires_par_motif", restCommentaires);
    }
  };

  const toggleFreinsSection = (checked: boolean) => {
    if (checked) {
      setFreinsOpen(true);
      return;
    }
    setFreinsOpen(false);
    const restCommentaires = { ...values.commentaires_par_motif };
    FREINS_MOTIFS.forEach((m) => delete restCommentaires[m]);
    setFieldValue(
      "motifs",
      values.motifs.filter((m) => !FREINS_MOTIFS.includes(m))
    );
    setFieldValue("commentaires_par_motif", restCommentaires);
  };

  return (
    <div className={styles.sectionInner}>
      <p className={styles.sectionLabel}>
        Quel est l&apos;objectif de l&apos;accompagnement de {prenom} ?<span className={styles.required}>*</span>
      </p>

      <div className={`${styles.objectifCard} ${hasRecherche ? styles.objectifCardActive : ""}`}>
        <Checkbox
          legend="Objectif recherche d'entreprise"
          options={[
            {
              label: `L'aider dans sa recherche d'entreprise ${MOTIF_EMOJIS[ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI]}`,
              hintText: "(Aide au CV, appui sur la recherche d'entreprise...)",
              nativeInputProps: {
                checked: hasRecherche,
                onChange: (e) => toggleMotif(ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI, e.target.checked),
              },
            },
          ]}
        />
        {hasRecherche && (
          <div className={styles.subSection}>
            <p className={styles.subSectionLabel}>
              Précisez votre demande d&apos;aide et décrivez ce qui a déjà été mis en place
              <span className={styles.required}>*</span>
            </p>
            <MotifCommentaire
              motif={ACC_CONJOINT_MOTIF_ENUM.RECHERCHE_EMPLOI}
              placeholder={"Le jeune a-t-il déjà des pistes ?\nQuel accompagnement a déjà été apporté au CFA ?"}
              rows={4}
            />
          </div>
        )}
      </div>

      <div className={`${styles.objectifCard} ${showFreinsSection ? styles.objectifCardActive : ""}`}>
        <Checkbox
          legend="Objectif freins périphériques"
          options={[
            {
              label: "L'accompagner pour lever des freins périphériques connus \uD83D\uDDC2\uFE0F",
              hintText:
                "(Problématique de mobilité ? De logement ? De santé ? De maîtrise du Français ? Problèmes administratifs ?)",
              nativeInputProps: {
                checked: showFreinsSection,
                onChange: (e) => toggleFreinsSection(e.target.checked),
              },
            },
          ]}
        />
        {showFreinsSection && (
          <div className={styles.freinsList}>
            {FREINS_MOTIFS.map((motif) => {
              const isChecked = values.motifs.includes(motif);
              return (
                <div key={motif} className={`${styles.freinItemRow} ${isChecked ? styles.freinItemRowActive : ""}`}>
                  <div className={styles.freinItemCheck}>
                    <div className="fr-checkbox-group">
                      <input
                        type="checkbox"
                        id={`frein-${motif}`}
                        className="fr-checkbox-group__input"
                        checked={isChecked}
                        onChange={(e) => toggleMotif(motif, e.target.checked)}
                      />
                      <label className="fr-label" htmlFor={`frein-${motif}`}>
                        {MOTIF_LABELS[motif]} {MOTIF_EMOJIS[motif] || ""}
                      </label>
                    </div>
                  </div>
                  {isChecked && (
                    <div className={styles.freinItemTextarea}>
                      <MotifCommentaire
                        motif={motif}
                        placeholder="Précisez le contexte pour la Mission Locale (requis)"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`${styles.objectifCard} ${hasReorientation ? styles.objectifCardActive : ""}`}>
        <Checkbox
          legend="Objectif réorientation"
          options={[
            {
              label: `L'aider dans sa réorientation ${MOTIF_EMOJIS[ACC_CONJOINT_MOTIF_ENUM.REORIENTATION]}`,
              hintText: "(Le jeune semble avoir quitté le CFA ou a formulé un souhait de se réorienter)",
              nativeInputProps: {
                checked: hasReorientation,
                onChange: (e) => toggleMotif(ACC_CONJOINT_MOTIF_ENUM.REORIENTATION, e.target.checked),
              },
            },
          ]}
        />
        {hasReorientation && (
          <div className={styles.subSection}>
            <p className={styles.subSectionLabel}>
              Le jeune a quitté le CFA ou souhaite se réorienter ? Précisez la situation actuelle en quelques mots
              <span className={styles.required}>*</span>
            </p>
            <MotifCommentaire
              motif={ACC_CONJOINT_MOTIF_ENUM.REORIENTATION}
              placeholder="Précisez la situation actuelle en quelques mots"
              rows={3}
            />
          </div>
        )}
      </div>

      <ErrorMessage name="motifs" component="p" className="fr-error-text" />
    </div>
  );
}
