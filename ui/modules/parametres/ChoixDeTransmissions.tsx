import { InfoIcon } from "@chakra-ui/icons";
import { Button, HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useSetRecoilState } from "recoil";

import { _put } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { parametresNavigationAtom, ParametresNavigationStep } from "@/hooks/parametresAtoms";

interface ChoixDeTransmissionProps {
  organisme: Organisme;
  onERPSelected: () => void;
}
export const ChoixDeTransmission = ({ organisme, onERPSelected }: ChoixDeTransmissionProps) => {
  const setNavigationStep = useSetRecoilState(parametresNavigationAtom);
  const [isNoErpConfigurationLoading, setIsNoErpConfigurationLoading] = useState(false);

  const onManualTransmissionSelected = async () => {
    setIsNoErpConfigurationLoading(true);
    await _put(`/api/v1/organismes/${organisme._id}/configure-erp`, {
      mode_de_transmission: "MANUEL",
    });
    await onERPSelected();
    setIsNoErpConfigurationLoading(false);
  };

  return (
    <>
      <HStack gap={7} mt={6}>
        <VStack
          p={6}
          borderWidth="1px"
          borderColor="dgalt"
          borderBottomWidth="4px"
          borderBottomColor="bluefrance"
          alignItems="start"
        >
          <Heading as="h4" fontSize="gamma">
            Vous avez un ERP ?
          </Heading>
          <Text pb={6}>Liez votre ou vos ERP au tableau de bord</Text>
          <Button
            variant="secondary"
            onClick={() => {
              setNavigationStep(ParametresNavigationStep.ERP_SELECTION);
            }}
          >
            Choisir cette méthode
          </Button>
        </VStack>

        <VStack
          p={6}
          borderWidth="1px"
          borderColor="dgalt"
          borderBottomWidth="4px"
          borderBottomColor="bluefrance"
          alignItems="start"
        >
          <Heading as="h4" fontSize="gamma">
            Vous n’avez pas d’ERP ?
          </Heading>
          <Text pb={6}>Importez vos effectifs avec un fichier Excel</Text>
          <Button isLoading={isNoErpConfigurationLoading} variant="secondary" onClick={onManualTransmissionSelected}>
            Choisir cette méthode
          </Button>
        </VStack>
      </HStack>
      <HStack alignItems="start" color="mgalt" mt={8}>
        <InfoIcon />
        <Text>
          Un outil de gestion / ERP (Enterprise Ressource Planning ou PGI pour Progiciel de Gestion Intégré) est une
          solution logicielle permettant d’unifier le système d’information d’une entreprise autour d’une base de
          données unique.
        </Text>
      </HStack>
    </>
  );
};

export default ChoixDeTransmission;
