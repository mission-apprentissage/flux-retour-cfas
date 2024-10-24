import { useState } from "react";
import { useDropzone } from "react-dropzone";
import XLSX from "xlsx";

import { FieldConfig, televersementHeaders } from "@/common/constants/televersementHeaders";
import { _post } from "@/common/httpClient";
import parseExcelBoolean from "@/common/utils/parseExcelBoolean";
import parseExcelDate from "@/common/utils/parseExcelDate";
import { toEffectifsQueue } from "@/common/utils/televersement";

import useToaster from "./useToaster";

const POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH = 2000;

interface ProcessedDataType {
  [key: string]: any;
  errors: { key: string; message: string }[];
}

interface StateType {
  processedData: ProcessedDataType[];
  headers: string[];
  error: string | null;
  errorsCount: number;
  warnings: { contratCount?: number };
  missingHeaders: string[];
  columnsWithErrors: string[];
  showOnlyColumnsAndLinesWithErrors: boolean;
  status: "idle" | "processing" | "validation_success" | "validation_failure" | "import_success" | "import_failure";
}

const initialState: StateType = {
  processedData: [],
  headers: [],
  error: null,
  errorsCount: 0,
  warnings: {},
  missingHeaders: [],
  columnsWithErrors: [],
  showOnlyColumnsAndLinesWithErrors: false,
  status: "idle",
};

const useExcelFileProcessor = (organismeId: string) => {
  const { toastError } = useToaster();
  const [state, setState] = useState<StateType>(initialState);

  const resetState = () => {
    setState(initialState);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    resetState();
    setState((prevState) => ({ ...prevState, status: "processing" }));
    const file = acceptedFiles[0];
    if (!file) {
      const errorMsg = "No file provided";
      toastError(errorMsg);
      setState((prevState) => ({ ...prevState, error: errorMsg, status: "idle" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target?.result) {
        const errorMsg = "Erreur lors de la lecture du fichier, veuillez réessayer.";
        toastError(errorMsg);
        setState((prevState) => ({ ...prevState, error: errorMsg, status: "idle" }));
        return;
      }

      try {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheetName = workbook.SheetNames[0];
        if (!worksheetName) {
          toastError("Impossible de charger la première feuille du fichier Excel");
          setState((prevState) => ({ ...prevState, status: "idle" }));
          return;
        }
        const worksheet = workbook.Sheets[worksheetName];
        const rawJsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 }) as unknown[][];

        const filteredJsonData = rawJsonData.filter((row: any[]) =>
          row.some((cell) => typeof cell === "string" && cell.trim() !== "")
        );

        if (filteredJsonData.length - 1 > POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH) {
          const errorMsg = `Pour des raisons techniques et de sécurité, votre fichier ne doit pas dépasser ${POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH} lignes. Veuillez téléverser un premier fichier de ${POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH} lignes/effectifs et renouveler l'opération avec un deuxième fichier comprenant le nombre de lignes restantes.`;
          toastError(errorMsg);
          setState((prevState) => ({ ...prevState, error: errorMsg, status: "idle" }));
          return;
        }

        const rawHeaders = filteredJsonData[0] as string[];
        const cleanHeaders = rawHeaders.map((header) =>
          typeof header === "string" ? header.toLowerCase().replace(/\*/g, "").trim() : ""
        );

        const validHeaders = Object.keys(televersementHeaders);
        setState((prevState) => ({ ...prevState, headers: validHeaders }));

        const headerMap: Record<string, number> = {};
        cleanHeaders.forEach((header, index) => {
          if (validHeaders.includes(header)) {
            headerMap[header] = index;
          }
        });

        if (Object.keys(headerMap).length === 0) {
          const errorMsg =
            "Le format de votre fichier n'est pas conforme. Veuillez respecter celui du fichier-modèle Excel téléchargeable.";
          toastError(errorMsg);
          setState((prevState) => ({ ...prevState, error: errorMsg, status: "idle" }));
          return;
        }

        const jsonData: ProcessedDataType[] = filteredJsonData.slice(1).map((row) => {
          const rowObject: ProcessedDataType = { errors: [] };

          validHeaders.forEach((header) => {
            const index = headerMap[header];
            if (index !== undefined) {
              const config = televersementHeaders[header];
              const cellValue = (row as any[])[index];

              if (config) {
                if (config.type === "date") {
                  rowObject[header] = parseExcelDate(cellValue);
                } else if (config.type === "boolean") {
                  rowObject[header] = parseExcelBoolean(cellValue);
                } else {
                  rowObject[header] = cellValue || null;
                }

                if (config.mandatory && !rowObject[header]) {
                  rowObject.errors.push({ key: header, message: `${header} est requis` });
                }
              }
            } else {
              rowObject[header] = null;
            }
          });

          return rowObject;
        });

        const res = await _post(`/api/v1/organismes/${organismeId}/upload/validate`, toEffectifsQueue(jsonData));

        const errors = res.error?.issues || [];
        setState((prevState) => ({
          ...prevState,
          errorsCount: errors.length,
          warnings: res.warnings || {},
          missingHeaders: validHeaders.filter((header) => !cleanHeaders.includes(header)),
        }));

        const mandatoryHeaders = getMandatoryHeaders(televersementHeaders);
        const missingMandatoryHeaders = filterMissingHeaders(state.missingHeaders, mandatoryHeaders);

        setState((prevState) => ({
          ...prevState,
          missingHeaders: missingMandatoryHeaders,
        }));

        const errorsByRow = errors.reduce((acc: Record<number, { message: string; key: string }[]>, error: any) => {
          const row = error.path[0];
          let message = error.message;

          if (error.code === "invalid_type") {
            message = "Format invalide";
          }

          if (!acc[row]) acc[row] = [];
          acc[row].push({
            message,
            key: error.path[1],
          });
          return acc;
        }, {});

        const columnsWithErrorsArray = errors.map((e: any) => e.path[1]);
        const uniqueColumnsWithErrors = Array.from(new Set(columnsWithErrorsArray));

        const rows = jsonData.map((row: any, index: number) => {
          const rowErrors = errorsByRow[index] || [];
          return { ...row, errors: rowErrors };
        });

        setState((prevState) => ({
          ...prevState,
          processedData: rows,
          columnsWithErrors: uniqueColumnsWithErrors as string[],
          status: errors.length ? "validation_failure" : "validation_success",
        }));
      } catch (error) {
        console.error("Erreur de traitement du fichier:", error);
        const errorMsg = "Erreur de traitement du fichier";
        toastError(errorMsg);
        setState((prevState) => ({ ...prevState, error: errorMsg, status: "idle" }));
      }
    };

    reader.onerror = () => {
      const errorMsg = "Erreur de lecture du fichier";
      toastError(errorMsg);
      setState((prevState) => ({ ...prevState, error: errorMsg, status: "idle" }));
    };

    reader.readAsArrayBuffer(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    onDrop,
    onDropRejected: (rejections) => {
      toastError(`Ce fichier ne peut pas être déposé : ${rejections?.[0]?.errors?.[0]?.message}`);
      setState((prevState) => ({ ...prevState, status: "idle" }));
    },
  });

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    processedData: state.processedData,
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

function getMandatoryHeaders(headers: Record<string, FieldConfig>) {
  return Object.keys(headers).filter((header) => headers[header].mandatory);
}

function filterMissingHeaders(missingHeaders: string[], mandatoryHeaders: string[]) {
  return missingHeaders.filter((header) => mandatoryHeaders.includes(header));
}

export default useExcelFileProcessor;
