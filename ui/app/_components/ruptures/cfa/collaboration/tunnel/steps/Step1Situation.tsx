"use client";

import { useFormikContext } from "formik";
import { CFA_SITUATION_TYPE_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import { FormValues } from "../../types";
import { RadioCardGroup } from "../RadioCardGroup";
import styles from "../Tunnel.module.css";

interface Step1SituationProps {
  onChange: (situationType: CFA_SITUATION_TYPE_ENUM) => void;
}

export function Step1Situation({ onChange }: Step1SituationProps) {
  const { values } = useFormikContext<FormValues>();

  return (
    <>
      <p className={styles.question}>Le jeune est-il en contrat avec une entreprise actuellement ?</p>
      <RadioCardGroup
        name="situation_type"
        value={values.situation_type}
        onChange={onChange}
        options={[
          { value: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT, label: "Oui, le jeune est en contrat actuellement" },
          {
            value: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
            label: "Non, le jeune est en rupture ou a quitté le CFA",
          },
          {
            value: CFA_SITUATION_TYPE_ENUM.SANS_CONTRAT,
            label: "Non, le jeune a fait sa rentrée au CFA sans contrat en entreprise",
            hint: "Pour les jeunes inscrits à la rentrée dans votre CFA sans contrat d'apprentissage",
          },
        ]}
      />
    </>
  );
}
