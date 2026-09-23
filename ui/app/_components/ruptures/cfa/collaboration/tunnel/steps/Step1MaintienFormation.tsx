"use client";

import { useFormikContext } from "formik";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";

import { FormValues } from "../../types";
import { RadioCardGroup } from "../RadioCardGroup";
import styles from "../Tunnel.module.css";

export function Step1MaintienFormation() {
  const { values, setFieldValue } = useFormikContext<FormValues>();
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  return (
    <>
      <p className={styles.question}>Le jeune est-il maintenu en formation au CFA ?</p>
      <RadioCardGroup
        name="still_at_cfa"
        value={values.still_at_cfa}
        onChange={(value) => {
          setFieldValue("still_at_cfa", value);
          trackPlausibleEvent("cfa_form_statut_cfa_renseigne", undefined, { valeur: value ? "oui" : "non" });
        }}
        options={[
          { value: true, label: "Le jeune est en rupture, mais est maintenu en formation" },
          { value: false, label: "Le jeune a quitté le CFA" },
        ]}
      />
    </>
  );
}
