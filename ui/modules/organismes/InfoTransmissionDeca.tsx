import { Box, HStack, Text } from "@chakra-ui/react";

import { Checkbox } from "@/theme/components/icons";

interface InfoTransmissionDecaProps {
  date: Date | null;
}
function InfoTransmissionDeca(props: InfoTransmissionDecaProps) {
  return (
    <HStack paddingX="1w" paddingY="2px" borderRadius={6} backgroundColor="#e1e0eb" color="#352E9A">
      <Checkbox />
      <Box>
        <Text fontSize="zeta" fontWeight="bold">
          Données DECA
        </Text>
        <Text fontSize="x-small">Dernière MAJ : {props.date ? props.date.toLocaleDateString("fr") : "- -"}</Text>
      </Box>
    </HStack>
  );
}

export default InfoTransmissionDeca;
