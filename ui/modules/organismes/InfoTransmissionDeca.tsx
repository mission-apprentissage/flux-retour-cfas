import { Text } from "@chakra-ui/react";
import { IndicateursEffectifs } from "shared";

import Tag from "@/components/Tag/Tag";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { Checkbox } from "@/theme/components/icons";

interface InfoTransmissionDecaProps {
  date?: Date;
  indicateursEffectifs?: IndicateursEffectifs;
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

  return props.indicateursEffectifs?.apprenants ? (
    <Tag
      leftIcon={Checkbox}
      primaryText="Données DECA"
      secondaryText={props.date ? `Dernière MAJ: ${props.date.toLocaleDateString("fr")}` : ""}
      variant="badge"
      colorScheme="blue_tag"
      rightIcon={() => <InfoTooltip contentComponent={() => <Tooltip />} />}
    />
  ) : null;
}

export default InfoTransmissionDeca;
