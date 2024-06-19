import { Box, HStack, Text } from "@chakra-ui/react";

import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { Checkbox } from "@/theme/components/icons";

interface InfoTransmissionDecaProps {
  date?: Date;
}
function InfoTransmissionDeca(props: InfoTransmissionDecaProps) {
  const Tooltip = () => (
    <>
      <Text fontWeight="bold" mb={2}>
        Effectifs affichés provenant de la source DECA
      </Text>
      <Text>
        Les effectifs affichés proviennent de la base DECA (DEpôts des Contrats d’Alternance). La date correspond à la
        dernière récupération brute de cette base. Pour une donnée plus fraîche, l’organisme doit transmettre lui-même
        ses effectifs.
      </Text>
    </>
  );
  return (
    <HStack paddingX="1w" paddingY="2px" borderRadius={6} backgroundColor="#e1e0eb" color="#352E9A">
      <Checkbox />
      <Box>
        <Text fontSize="zeta" fontWeight="bold">
          Données DECA
        </Text>
        {props.date && (
          <Text fontSize="x-small">Dernière MAJ : {props.date ? props.date.toLocaleDateString("fr") : "- -"}</Text>
        )}
      </Box>
      <InfoTooltip contentComponent={() => <Tooltip />} />
    </HStack>
  );
}

export default InfoTransmissionDeca;
