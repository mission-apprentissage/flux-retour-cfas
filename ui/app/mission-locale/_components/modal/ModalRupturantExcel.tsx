import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import mime from "mime";
import qs from "qs";
import React, { useEffect, useState } from "react";
import { API_EFFECTIF_LISTE } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { _getBlob } from "@/common/httpClient";
import { downloadObject } from "@/common/utils/browser";

const modal = createModal({
  id: "telechargement-rupturant-modal",
  isOpenedByDefault: false,
});

export function ModalRupturantExcel() {
  const [selectedType, setSelectedType] = useState<Array<string>>([]);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const { data, refetch, isFetching } = useQuery(
    ["excel-rupturant-telechargement"],
    () => {
      return _getBlob(`/api/v1/organisation/mission-locale/export/effectifs`, {
        params: { type: selectedType },
        paramsSerializer: (params) => {
          return qs.stringify(params, { arrayFormat: "brackets" });
        },
      });
    },
    { enabled: false }
  );

  useEffect(() => {
    const fileName = `Rupturants_TBA_${new Date().toISOString().split("T")[0]}.xlsx`;
    trackPlausibleEvent("telechargement_mission_locale_liste");
    downloadObject(data, fileName, mime.getType("xlsx") ?? "text/plain");
    setSelectedType([]);
  }, [data]);

  const onRadioSelected = ({ value, checked }: { value: string; checked: boolean }) => {
    setSelectedType(checked ? [...selectedType, value] : selectedType.filter((x) => x !== value));
  };

  const onDownload = async () => {
    refetch();
  };

  return (
    <>
      <Button
        nativeButtonProps={modal.buttonProps}
        disabled={isFetching}
        iconId="ri-arrow-right-line"
        iconPosition="right"
      >
        {isFetching && <CircularProgress size="1em" sx={{ mr: 1 }} />}
        Télécharger la liste
      </Button>
      <modal.Component
        title="Veuillez choisir quels types de dossiers vous souhaitez télécharger."
        buttons={[
          {
            onClick: onDownload,
            children: "Télécharger",
            disabled: !selectedType.length,
          },
        ]}
      >
        <Checkbox
          options={[
            {
              label: "A traiter",
              nativeInputProps: {
                name: API_EFFECTIF_LISTE.A_TRAITER,
                value: API_EFFECTIF_LISTE.A_TRAITER,
                onChange: ({ target }) => onRadioSelected(target),
                checked: selectedType.includes(API_EFFECTIF_LISTE.A_TRAITER),
              },
            },
            {
              label: "Contactés sans réponse",
              nativeInputProps: {
                name: API_EFFECTIF_LISTE.INJOIGNABLE,
                value: API_EFFECTIF_LISTE.INJOIGNABLE,
                onChange: ({ target }) => onRadioSelected(target),
                checked: selectedType.includes(API_EFFECTIF_LISTE.INJOIGNABLE),
              },
            },
            {
              label: "Déjà traités",
              nativeInputProps: {
                name: API_EFFECTIF_LISTE.TRAITE,
                value: API_EFFECTIF_LISTE.TRAITE,
                onChange: ({ target }) => onRadioSelected(target),
                checked: selectedType.includes(API_EFFECTIF_LISTE.TRAITE),
              },
            },
          ]}
          state="default"
        />
      </modal.Component>
    </>
  );
}
