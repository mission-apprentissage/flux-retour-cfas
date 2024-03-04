import { Box, Text, UnorderedList, ListItem, HStack } from "@chakra-ui/react";

import Ribbons from "@/components/Ribbons/Ribbons";

interface TransmissionsErrorSummaryProps {
  summary: any;
  isLoading: boolean;
}

const TransmissionsErrorSummary = (props: TransmissionsErrorSummaryProps) => {
  if (!props.summary.numberErrors || props.isLoading) {
    return;
  }

  return (
    <Ribbons variant="error" w="full">
      <Box color="black">
        <HStack mb={2}>
          <Text fontWeight={"bold"}>{props.summary.numberErrors?.total} erreurs ont été détéctées.</Text>
        </HStack>
        <UnorderedList p={2}>
          {props.summary.lieu?.map(({ uai, siret, effectifCount }) => (
            <ListItem key={`lieu${uai}${siret}`}>
              <Text>
                <b>
                  Couple UAI {uai} / SIRET {siret} du lieu de formation
                </b>{" "}
                n&apos;est pas reconnu : {effectifCount} effectifs en erreur
              </Text>
            </ListItem>
          ))}

          {props.summary.formateur?.map(({ uai, siret, effectifCount }) => (
            <ListItem key={`formateur${uai}${siret}`}>
              <Text>
                <b>
                  Couple UAI {uai} / SIRET {siret} du site formateur
                </b>{" "}
                n&apos;est pas reconnu : {effectifCount} effectifs en erreur
              </Text>
            </ListItem>
          ))}
          {props.summary.responsable?.map(({ uai, siret, effectifCount }) => (
            <ListItem key={`responsable${uai}${siret}`}>
              <Text>
                <b>
                  Couple UAI {uai} / SIRET {siret} du site responsable
                </b>{" "}
                n&apos;est pas reconnu : {effectifCount} effectifs en erreur
              </Text>
            </ListItem>
          ))}
        </UnorderedList>
      </Box>
    </Ribbons>
  );
};

export default TransmissionsErrorSummary;
