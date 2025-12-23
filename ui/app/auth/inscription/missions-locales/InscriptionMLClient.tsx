"use client";

import ProConnectButton from "@codegouvfr/react-dsfr/ProConnectButton";

import { _get } from "@/common/httpClient";

export default function InscriptionMLClient() {
  async function onProConnect() {
    //window.location.href = "http://localhost:5001/api/v1/auth/proconnect/login";
    window.location.href = "/api/v1/auth/proconnect/login";
  }

  return <ProConnectButton onClick={onProConnect} />;
}
