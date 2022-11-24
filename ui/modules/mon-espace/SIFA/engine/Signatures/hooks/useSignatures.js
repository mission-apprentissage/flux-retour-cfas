import { useCallback } from "react";
import { useRecoilState } from "recoil";

import { apiService } from "../../services/api.service";
import { dossierAtom } from "../../atoms";
import { _put } from "../../../../common/httpClient";

export function useSignatures() {
  const [dossier, setDossier] = useRecoilState(dossierAtom);

  const onSubmittedSignataireDetails = useCallback(
    async (data, path) => {
      try {
        const [, type, detail] = path.match(/^signataire\.(.+)\.(.+)$/);

        let signataires = {
          employeur: {
            ...dossier.signataires.employeur,
          },
          apprenti: {
            ...dossier.signataires.apprenti,
          },
          cfa: {
            ...dossier.signataires.cfa,
          },
          ...(dossier.signataires.legal
            ? {
                legal: {
                  ...dossier.signataires.legal,
                },
              }
            : {}),
        };

        signataires[type][detail] = data;

        const newDossier = await _put(`/api/v1/dossier/entity/${dossier._id}/signataires`, {
          dossierId: dossier._id,
          signataires,
        });

        setDossier(newDossier);
      } catch (e) {
        console.error(e);
      }
    },
    [dossier, setDossier]
  );

  const onSubmitted = useCallback(
    async (lieu, date) => {
      try {
        await apiService.saveCerfa({
          dossierId: dossier?._id,
          cerfaId: dossier.cerfaId,
          data: {
            contrat: {
              lieuSignatureContrat: lieu,
              dateConclusion: date,
            },
          },
          inputNames: ["contrat.lieuSignatureContrat", "contrat.dateConclusion"],
        });
      } catch (e) {
        console.error(e);
      }
    },
    [dossier]
  );

  return { onSubmitted, onSubmittedSignataireDetails };
}
