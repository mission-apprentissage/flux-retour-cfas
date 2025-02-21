import { Select } from "@chakra-ui/react";
import { IMissionLocaleEffectif, SITUATION_ENUM, SITUATION_LABEL_ENUM } from "shared";

import { _post } from "@/common/httpClient";
import useToaster from "@/hooks/useToaster";

interface ApprenantsSituationSelectProps {
  effectifId: string;
  situation?: SITUATION_ENUM;
  updateSituationState: (effectifId: string, newSituation: Partial<IMissionLocaleEffectif>) => void;
}

const ApprenantsSituationSelect: React.FC<ApprenantsSituationSelectProps> = ({
  effectifId,
  situation,
  updateSituationState,
}) => {
  const { toastError } = useToaster();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as SITUATION_ENUM | "";

    updateSituationState(effectifId, { situation: newValue as SITUATION_ENUM, situation_updated_at: new Date() });

    try {
      const payload = {
        effectif_id: effectifId,
        situation: newValue || null,
      };

      await _post(`/api/v1/organisation/mission-locale/effectif`, payload);
    } catch (error: unknown) {
      console.error("Erreur de mise à jour :", error);
      toastError("Impossible de mettre à jour la situation de l'apprenant. Veuillez réessayer.");
      updateSituationState(effectifId, { situation });
    }
  };

  return (
    <Select fontSize="sm" onClick={(e) => e.stopPropagation()} onChange={handleChange} value={situation || ""}>
      {Object.entries(SITUATION_ENUM).map(([key, value]) => (
        <option key={value} value={value}>
          {SITUATION_LABEL_ENUM[key as keyof typeof SITUATION_LABEL_ENUM]}
        </option>
      ))}
      <option value="">Non traité</option>
    </Select>
  );
};

export default ApprenantsSituationSelect;
