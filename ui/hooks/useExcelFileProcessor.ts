import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { CHAMPS_TELEVERSEMENT_PAR_CLE, TELEVERSEMENT_MAX_LIGNES } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { _post } from "@/common/httpClient";
import { reportError } from "@/common/reportError";
import { lireFichierEffectifs, type ResultatLecture } from "@/common/utils/lectureFichierEffectifs";
import {
  lireAvecUnWorker,
  messageFichierRefuse,
  verifierFichier,
  type AvertissementsVerification,
  type LigneVerifiee,
  type ReponseVerification,
} from "@/common/utils/televersement";

const FORMATS_ACCEPTES = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls", ".csv"],
  "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
  "text/csv": [".csv"],
};

export type ProcessedDataType = LigneVerifiee;

interface StateType {
  processedData: ProcessedDataType[];
  valeursAEnvoyer: Record<string, unknown>[];
  headers: string[];
  error: string | null;
  errorsCount: number;
  warnings: AvertissementsVerification;
  missingHeaders: string[];
  colonnesEnDouble: string[];
  columnsWithErrors: string[];
  showOnlyColumnsAndLinesWithErrors: boolean;
  status: "idle" | "processing" | "validation_success" | "validation_failure" | "import_success";
}

const initialState: StateType = {
  processedData: [],
  valeursAEnvoyer: [],
  headers: [],
  error: null,
  errorsCount: 0,
  warnings: {},
  missingHeaders: [],
  colonnesEnDouble: [],
  columnsWithErrors: [],
  showOnlyColumnsAndLinesWithErrors: false,
  status: "idle",
};

function lireDansUnWorker(contenu: ArrayBuffer, nomFichier: string, maximumLignes: number): Promise<ResultatLecture> {
  const lireIci = () => lireFichierEffectifs(contenu, nomFichier, { maximumLignes });
  if (typeof Worker === "undefined") {
    return Promise.resolve(lireIci());
  }
  return lireAvecUnWorker(
    () => new Worker(new URL("../common/utils/lectureFichierEffectifs.worker.ts", import.meta.url)),
    { contenu, nomFichier, maximumLignes },
    lireIci
  );
}

const useExcelFileProcessor = (organismeId: string) => {
  const [state, setState] = useState<StateType>(initialState);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const onDrop = async (acceptedFiles: File[]) => {
    setState({ ...initialState, status: "processing" });
    const resultat = await verifierFichier(acceptedFiles[0], {
      lire: async (fichier) => lireDansUnWorker(await fichier.arrayBuffer(), fichier.name, TELEVERSEMENT_MAX_LIGNES),
      verifier: (valeurs) =>
        _post<unknown, ReponseVerification>(`/api/v1/organismes/${organismeId}/upload/validate`, valeurs),
      suivre: (goal, props) => trackPlausibleEvent(goal, undefined, props),
      signaler: (error) => reportError(error, { action: "traitement-fichier-excel" }),
    });
    if (!resultat.succes) {
      setState({ ...initialState, error: resultat.message });
      return;
    }
    const {
      processedData,
      valeursAEnvoyer,
      errorsCount,
      warnings,
      missingHeaders,
      colonnesEnDouble,
      columnsWithErrors,
    } = resultat.verification;
    setState({
      ...initialState,
      processedData,
      valeursAEnvoyer,
      headers: Object.keys(CHAMPS_TELEVERSEMENT_PAR_CLE),
      errorsCount,
      warnings,
      missingHeaders,
      colonnesEnDouble,
      columnsWithErrors,
      status: errorsCount > 0 ? "validation_failure" : "validation_success",
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    accept: FORMATS_ACCEPTES,
    disabled: state.status === "processing",
    onDrop,
    onDropRejected: (rejections) => {
      setState({ ...initialState, error: messageFichierRefuse(rejections) });
    },
  });

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    processedData: state.processedData,
    valeursAEnvoyer: state.valeursAEnvoyer,
    headers: state.headers,
    error: state.error,
    errorsCount: state.errorsCount,
    warnings: state.warnings,
    missingHeaders: state.missingHeaders,
    colonnesEnDouble: state.colonnesEnDouble,
    columnsWithErrors: state.columnsWithErrors,
    showOnlyColumnsAndLinesWithErrors: state.showOnlyColumnsAndLinesWithErrors,
    setShowOnlyColumnsAndLinesWithErrors: (value: boolean) =>
      setState((prevState) => ({ ...prevState, showOnlyColumnsAndLinesWithErrors: value })),
    status: state.status,
    setStatus: (status: StateType["status"]) => setState((prevState) => ({ ...prevState, status })),
  };
};

export default useExcelFileProcessor;
