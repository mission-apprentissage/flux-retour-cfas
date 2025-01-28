import { Box, Text } from "@chakra-ui/react";

import Link from "@/components/Links/Link";
import Ribbons from "@/components/Ribbons/Ribbons";

interface BandeauDuplicatsEffectifsProps {
  totalItems: number;
}

const BandeauDuplicatsEffectifs: React.FC<BandeauDuplicatsEffectifsProps> = ({ totalItems }) => {
  if (totalItems <= 0) {
    return null;
  }

  return (
    <Ribbons variant="alert" mb={6}>
      <Box ml={3}>
        <Text color="grey.800" fontSize="1.1rem" fontWeight="bold" mr={6} mb={2}>
          Nous avons détecté {totalItems} effectif{totalItems > 1 ? "s" : ""} en duplicat.
        </Text>
        <Text color="grey.600" mr={6} mb={4}>
          Une action de suppression des doublons d&apos;effectifs est nécessaire.
        </Text>
        <Link variant="whiteBg" href="effectifs/doublons" plausibleGoal="clic_verifier_doublons_effectifs">
          Vérifier et supprimer
        </Link>
      </Box>
    </Ribbons>
  );
};

export default BandeauDuplicatsEffectifs;
