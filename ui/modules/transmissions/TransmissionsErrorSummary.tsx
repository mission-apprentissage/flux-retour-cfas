import { Box, Text, UnorderedList, ListItem, HStack, Link } from "@chakra-ui/react";
import { FICHIER_AIDE_DECLARATION_OFA, REFERENTIEL_ONISEP } from "shared";

import Ribbons from "@/components/Ribbons/Ribbons";

interface TransmissionsErrorSummaryProps {
  summary: any;
  isLoading: boolean;
}

const TransmissionsErrorSummary = (props: TransmissionsErrorSummaryProps) => {
  const hasUaiSiretErrors = Boolean(
    props.summary.lieu?.length || props.summary.formateur?.length || props.summary.responsable?.length
  );

  if (!props.summary.numberErrors || props.isLoading) {
    return;
  }

  return (
    <Ribbons variant="error" w="full">
      <Box color="black">
        <HStack mb={2}>
          <Text fontWeight={"bold"}>{props.summary.numberErrors?.total} erreurs ont été détectées.</Text>
          {hasUaiSiretErrors && <Text fontWeight={"bold"}>Voici les erreurs les plus récurrentes.</Text>}
        </HStack>
        {hasUaiSiretErrors && <Text fontWeight={"bold"}> Erreurs sur les couples UAI/SIRET </Text>}
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
        {hasUaiSiretErrors && (
          <Box>
            <Text>
              Cette erreur signifie que vous envoyez des effectifs vers un organisme (UAI-SIRET) qui n’existe pas sur le
              Tableau de bord de l’apprentissage.
            </Text>
            <Text>
              Vérifiez l’UAI-SIRET de votre organisme sur le{" "}
              <Link isExternal href={REFERENTIEL_ONISEP} textDecoration="underline">
                Référentiel UAI-SIRET des OFA-CFA
              </Link>{" "}
              et corrigez-les dans votre ERP.
            </Text>
            <Text>
              Si vous ne trouvez pas votre organisme sur le Référentiel UAI-SIRET, c’est qu’il n’est pas déclaré OFA. Si
              c’est le cas vous devez obligatoirement le déclarer,{" "}
              <Link isExternal href={FICHIER_AIDE_DECLARATION_OFA} textDecoration="underline">
                consultez cette procédure.
              </Link>
            </Text>
          </Box>
        )}
      </Box>
    </Ribbons>
  );
};

export default TransmissionsErrorSummary;
