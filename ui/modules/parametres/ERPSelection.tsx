import { Button, FormControl, FormLabel, HStack, Select, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useSetRecoilState } from "recoil";
import { EFF_ERREUR_ELEMENT_LINK, ERPS } from "shared";

import { _delete, _post, _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import SupportLink from "@/components/Links/SupportLink";
import { parametresNavigationAtom, ParametresNavigationStep } from "@/hooks/parametresAtoms";

interface ERPSelectionProps {
  organisme: Organisme;
  onERPSelected: () => void;
}
export const ERPSelection = ({ organisme, onERPSelected }: ERPSelectionProps) => {
  const [selectedERPId, setSelectedERPId] = useState("");
  const setNavigationStep = useSetRecoilState(parametresNavigationAtom);
  const [isConfirmationInProgress, setIsConfirmationInProgress] = useState(false);

  const onERPChange = (e) => {
    setSelectedERPId(e.target.value);
  };

  const onERPChoiceValidation = async () => {
    setIsConfirmationInProgress(true);
    await _put(`/api/v1/organismes/${organisme._id}/configure-erp`, {
      mode_de_transmission: "API",
      erps: [selectedERPId],
    });
    await onERPSelected();
    setIsConfirmationInProgress(false);
  };

  const onCancelChoice = () => {
    setNavigationStep(ParametresNavigationStep.TRANSMISSION_MODE);
  };

  return (
    <>
      <FormControl isRequired mb={4} w="fit-content" onChange={onERPChange}>
        <FormLabel>Sélectionnez votre ERP ou outil de gestion utilisé</FormLabel>
        <Select>
          {/* Déclenche un warning chakra mais obligé pour avoir un placeholder non sélectionnable */}
          <option selected hidden disabled value="">
            ERP...
          </option>
          {ERPS.map((erp) => (
            <option value={erp.id} key={erp.id}>
              {erp.name}
            </option>
          ))}
        </Select>
      </FormControl>
      <HStack gap={3}>
        <Button variant="secondary" px={6} onClick={onCancelChoice}>
          Revenir en arrière
        </Button>

        <Button
          variant="primary"
          px={6}
          isDisabled={!selectedERPId}
          isLoading={isConfirmationInProgress}
          onClick={onERPChoiceValidation}
        >
          Confirmer
        </Button>
      </HStack>
      <HStack mt={5}>
        <Text>{"Votre ERP n'est pas listé ci-dessus ?"}</Text>
        <SupportLink href={EFF_ERREUR_ELEMENT_LINK} label="Veuillez nous faire une demande "></SupportLink>
      </HStack>
    </>
  );
};

export default ERPSelection;
