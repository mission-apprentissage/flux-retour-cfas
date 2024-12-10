import { WarningTwoIcon } from "@chakra-ui/icons";
import { Text } from "@chakra-ui/react";

import Tag from "@/components/Tag/Tag";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";

function AlertDuplicatsEffectifs() {
  return (
    <Tag
      leftIcon={WarningTwoIcon}
      primaryText="Duplicats détectés"
      variant="badge"
      colorScheme="orange_tag"
      rightIcon={() => (
        <InfoTooltip
          headerComponent={() => <Text>Duplicats d’effectifs détectés</Text>}
          contentComponent={() => (
            <Text>
              Des effectifs sont en doublons et doivent être supprimés dans l’onglet “Mes effectifs”. Sans cette action,
              les doublons sont comptabilisés dans les effectifs globaux de l’établissement.
            </Text>
          )}
        />
      )}
    />
  );
}

export default AlertDuplicatsEffectifs;
