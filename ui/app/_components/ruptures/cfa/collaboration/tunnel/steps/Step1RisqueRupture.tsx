"use client";

import { useFormikContext } from "formik";
import { CFA_RISQUE_RUPTURE_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import { FormValues } from "../../types";
import { RadioCardGroup } from "../RadioCardGroup";
import styles from "../Tunnel.module.css";

export function Step1RisqueRupture() {
  const { values, setFieldValue } = useFormikContext<FormValues>();

  return (
    <>
      <p className={styles.question}>Selon vous, le risque de rupture pour ce jeune est :</p>
      <RadioCardGroup
        name="risque_rupture"
        value={values.risque_rupture}
        onChange={(value) => setFieldValue("risque_rupture", value)}
        options={[
          {
            value: CFA_RISQUE_RUPTURE_ENUM.INEVITABLE,
            label: (
              <>
                <strong>Inévitable</strong>, la rupture est prévue dans un futur proche
              </>
            ),
          },
          {
            value: CFA_RISQUE_RUPTURE_ENUM.TRES_ELEVE,
            label: (
              <>
                <strong>Très élevé</strong>, le jeune va certainement connaître une rupture de contrat
              </>
            ),
          },
          {
            value: CFA_RISQUE_RUPTURE_ENUM.MODERE,
            label: (
              <>
                <strong>Modéré</strong>, la rupture peut être évitée si des solutions sont trouvées
              </>
            ),
          },
          {
            value: CFA_RISQUE_RUPTURE_ENUM.FAIBLE,
            label: (
              <>
                <strong>Faible</strong>, pas de rupture en vue, mais ce jeune a besoin d&apos;un accompagnement
              </>
            ),
          },
        ]}
      />
    </>
  );
}
