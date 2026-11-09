import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { CHAMPS_TELEVERSEMENT_PAR_CLE, ERREURS_TELEVERSEMENT, TELEVERSEMENT_MAX_LIGNES } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { _post } from "@/common/httpClient";
import { getErrorStatusCode, getServerErrorMessage } from "@/common/rateLimit";
import { reportError } from "@/common/reportError";
import { lireFichierEffectifs, type ResultatLecture } from "@/common/utils/lectureFichierEffectifs";
import { evenementVerification, messageFichierRefuse, toEffectifsQueue } from "@/common/utils/televersement";

const FORMATS_ACCEPTES = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls", ".csv"],
  "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
  "text/csv": [".csv"],
};

export interface ProcessedDataType {
  [key: string]: unknown;
  numero: number;
  errors: { key: string; message: string }[];
}

interface ValidationIssue {
  path: Array<string | number>;
  message: string;
  code?: string;
}

export interface AvertissementsVerification {
  contratCount?: number;
  nouveaux?: number;
  misAJour?: number;
  contratsEffaces?: { nom: string; prenom: string; ligne: number }[];
}

interface StateType {
  processedData: ProcessedDataType[];
  valeursAEnvoyer: Record<string, unknown>[];
  headers: string[];
  error: string | null;
  errorsCount: number;
  warnings: AvertissementsVerification;
  missingHeaders: string[];
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
  columnsWithErrors: [],
  showOnlyColumnsAndLinesWithErrors: false,
  status: "idle",
};

function lireDansUnWorker(contenu: ArrayBuffer, nomFichier: string, maximumLignes: number): Promise<ResultatLecture> {
  const lireIci = () => lireFichierEffectifs(contenu, nomFichier, { maximumLignes });
  if (typeof Worker === "undefined") {
    return Promise.resolve(lireIci());
  }
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("../common/utils/lectureFichierEffectifs.worker.ts", import.meta.url));
    } catch {
      resolve(lireIci());
      return;
    }
    worker.onmessage = (event: MessageEvent<ResultatLecture>) => {
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = () => {
      worker.terminate();
      resolve(lireIci());
    };
    worker.postMessage({ contenu, nomFichier, maximumLignes });
  });
}

const useExcelFileProcessor = (organismeId: string) => {
  const [state, setState] = useState<StateType>(initialState);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const onDrop = async (acceptedFiles: File[]) => {
    setState({ ...initialState, status: "processing" });
    const file = acceptedFiles[0];
    if (!file) {
      setState({ ...initialState, error: ERREURS_TELEVERSEMENT.aucun_fichier() });
      return;
    }
    trackPlausibleEvent("televersement_fichier_depose");

    try {
      const lecture = await lireDansUnWorker(await file.arrayBuffer(), file.name, TELEVERSEMENT_MAX_LIGNES);
      if (!lecture.succes) {
        setState({ ...initialState, error: lecture.message });
        return;
      }

      const valeursAEnvoyer = toEffectifsQueue(
        lecture.lignes.map(({ valeurs, numero }) => ({ ...valeurs, ligne_fichier: numero }))
      );
      const res = await _post<unknown, { error?: { issues?: ValidationIssue[] }; warnings?: StateType["warnings"] }>(
        `/api/v1/organismes/${organismeId}/upload/validate`,
        valeursAEnvoyer
      );

      const erreursServeurParLigne = (res.error?.issues ?? []).reduce<Record<number, ProcessedDataType["errors"]>>(
        (acc, issue) => {
          const index = Number(issue.path[0]);
          acc[index] = [...(acc[index] ?? []), { key: String(issue.path[1]), message: issue.message }];
          return acc;
        },
        {}
      );

      const processedData: ProcessedDataType[] = lecture.lignes.map((ligne, index) => ({
        ...ligne.valeurs,
        numero: ligne.numero,
        errors: [
          ...ligne.erreurs.map(({ cle, message }) => ({ key: cle, message })),
          ...(erreursServeurParLigne[index] ?? []).filter(({ key }) => !ligne.erreurs.some(({ cle }) => cle === key)),
        ],
      }));
      const erreursDeLignes = processedData.flatMap(({ errors }) => errors);
      const errorsCount = erreursDeLignes.length + lecture.colonnesObligatoiresAbsentes.length;
      const codesErreurs = new Set<string>(lecture.lignes.flatMap(({ erreurs }) => erreurs.map(({ code }) => code)));
      if (lecture.colonnesObligatoiresAbsentes.length > 0) {
        codesErreurs.add("colonne_absente");
      }

      setState({
        ...initialState,
        processedData,
        valeursAEnvoyer,
        headers: Object.keys(CHAMPS_TELEVERSEMENT_PAR_CLE),
        errorsCount,
        warnings: res.warnings ?? {},
        missingHeaders: lecture.colonnesObligatoiresAbsentes,
        columnsWithErrors: Array.from(new Set(erreursDeLignes.map(({ key }) => key))),
        status: errorsCount > 0 ? "validation_failure" : "validation_success",
      });
      trackPlausibleEvent(evenementVerification(errorsCount), undefined, {
        codes: [...codesErreurs].sort().join(","),
      });
    } catch (error) {
      if (getErrorStatusCode(error) === 503) {
        setState({ ...initialState, error: getServerErrorMessage(error, "Erreur de traitement du fichier") });
        return;
      }
      reportError(error, { action: "traitement-fichier-excel" });
      setState({ ...initialState, error: "Erreur de traitement du fichier" });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    accept: FORMATS_ACCEPTES,
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
    columnsWithErrors: state.columnsWithErrors,
    showOnlyColumnsAndLinesWithErrors: state.showOnlyColumnsAndLinesWithErrors,
    setShowOnlyColumnsAndLinesWithErrors: (value: boolean) =>
      setState((prevState) => ({ ...prevState, showOnlyColumnsAndLinesWithErrors: value })),
    status: state.status,
    setStatus: (status: StateType["status"]) => setState((prevState) => ({ ...prevState, status })),
  };
};

export default useExcelFileProcessor;
