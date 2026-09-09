"use client";

import { useFormikContext } from "formik";
import { CFA_RISQUE_RUPTURE_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import { RISQUE_RUPTURE_DESCRIPTIONS, RISQUE_RUPTURE_LABELS } from "@/app/_components/ruptures/shared/constants";

import { FormValues } from "../../types";
import { RadioCardGroup } from "../RadioCardGroup";
import styles from "../Tunnel.module.css";

const RISQUE_OPTIONS = [
  CFA_RISQUE_RUPTURE_ENUM.INEVITABLE,
  CFA_RISQUE_RUPTURE_ENUM.TRES_ELEVE,
  CFA_RISQUE_RUPTURE_ENUM.MODERE,
  CFA_RISQUE_RUPTURE_ENUM.FAIBLE,
];

export function Step1RisqueRupture() {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  return (
    <>
      <p className={styles.question}>Selon vous, le risque de rupture pour ce jeune est :</p>
      <RadioCardGroup
        name="risque_rupture"
        value={values.risque_rupture}
        onChange={(value) => setFieldValue("risque_rupture", value)}
        options={RISQUE_OPTIONS.map((risque) => ({
          value: risque,
          label: (
            <>
              <strong>{RISQUE_RUPTURE_LABELS[risque]}</strong>, {RISQUE_RUPTURE_DESCRIPTIONS[risque]}
            </>
          ),
        }))}
      />
    </>
  );
}
