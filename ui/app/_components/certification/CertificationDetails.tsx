"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";

import { CfdDetails } from "./CfdDetails";
import { RncpDetails } from "./RncpDetails";

interface CertificationDetailsProps {
  rncp_code: string | null;
  cfd_code: string | null;
}

export function CertificationDetails({ rncp_code, cfd_code }: CertificationDetailsProps) {
  return (
    <Tabs
      tabs={[
        { label: "RNCP", content: <RncpDetails code={rncp_code} />, isDefault: true },
        { label: "CFD", content: <CfdDetails code={cfd_code} /> },
      ]}
    />
  );
}
