import { Box, Link, SystemProps, Text } from "@chakra-ui/react";

import { NATURE_ORGANISME } from "@/common/constants/organismes";
import Tag from "@/components/Tag/Tag";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";

interface NatureOrganismeTagProps extends SystemProps {
  nature: keyof typeof NATURE_ORGANISME;
}

const natureToTagColor: Record<keyof typeof NATURE_ORGANISME, string> = {
  formateur: "#FCEEAC",
  responsable: "#E3E3FD",
  responsable_formateur: "#E6FEDA",
  lieu_formation: "#FFE8E5",
  inconnue: "#FFE8E5",
};

function NatureOrganismeTag({ nature, ...props }: NatureOrganismeTagProps) {
  const tagColor = natureToTagColor[nature] ?? natureToTagColor.inconnue;
  const isUnknown = nature === "inconnue";

  return (
    <Tag
      bg={tagColor}
      maxWidth="min-content"
      whiteSpace={isUnknown ? "nowrap" : "normal"}
      colorScheme={isUnknown ? "redlight_tag" : "grey_tag"}
      rightIcon={
        isUnknown
          ? () => (
              <InfoTooltip
                headerComponent={() => "Nature de l’organisme de formation"}
                contentComponent={() => (
                  <Box>
                    <Text as="p">
                      Une nature “inconnue” signifie que l’organisme n’a pas déclaré (ou de manière incomplète) son
                      offre de formation dans la base de son Carif-Oref : l’organisme doit référencer ses formations en
                      apprentissage auprès du{" "}
                      <Link
                        isExternal
                        href="https://www.intercariforef.org/referencer-son-offre-de-formation"
                        textDecoration="underLine"
                        display="inline"
                      >
                        Carif-Oref régional{" "}
                      </Link>{" "}
                      ou se rapprocher du{" "}
                      <Link isExternal href="/pdf/Carif-Oref-contacts.pdf" textDecoration="underLine" display="inline">
                        service dédié aux formations
                      </Link>
                      .
                    </Text>
                  </Box>
                )}
              />
            )
          : undefined
      }
      primaryText={NATURE_ORGANISME[nature] ?? NATURE_ORGANISME.inconnue}
      borderRadius="full"
      size="md"
      {...props}
    />
  );
}

export default NatureOrganismeTag;
