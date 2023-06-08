import { HStack, Heading, ListItem, Text, UnorderedList, VStack } from "@chakra-ui/react";

import Ribbons from "@/components/Ribbons/Ribbons";
import Section from "@/components/Section/Section";
import { InfoCircle } from "@/theme/components/icons/Info-circle";

type EffectifsBannerERPNotConfiguredProps = {
  isMine: boolean;
};

const EffectifsBannerERPNotConfigured = ({ isMine }: EffectifsBannerERPNotConfiguredProps) => {
  return (
    <VStack alignItems="baseline" gap={2}>
      <Section>
        <Heading as="h2" fontSize="gamma" color="blue_cumulus_main">
          {isMine ? "Aperçu de vos effectifs transmis" : "Aperçu des effectifs transmis"}
        </Heading>
        <Text color="mgalt">
          {isMine
            ? "Vous n’avez pas encore transmis vos effectifs"
            : "Cet organisme n'a pas encore transmis ses effectifs"}
        </Text>
        {isMine && (
          <Text>
            <InfoCircle />
            Vous devez effectuer vos mises à jours <strong>entre le 1er et le 5 de chaque mois.</strong>
          </Text>
        )}
      </Section>

      <Section
        borderTop="solid 1px"
        borderTopColor="grey.300"
        borderBottom="solid 1px"
        borderBottomColor="grey.300"
        backgroundColor="galt"
        paddingY={10}
      >
        <HStack justifyContent="space-between">
          <VStack alignItems="baseline" gap={4}>
            <Heading as="h2" fontSize="gamma">
              Les données exposées en temps réel donnent :
            </Heading>
            <UnorderedList pl={10}>
              <ListItem>Une vision dynamique de l’organisation de l’apprentissage sur les territoires,</ListItem>
              <ListItem>Des indications sur les profils de jeunes à accompagner.</ListItem>
            </UnorderedList>
          </VStack>
          <Ribbons variant="info" mt={5} px={20}>
            Vous n’avez pas encore transmis de données
          </Ribbons>
        </HStack>
      </Section>
    </VStack>
  );
};

export default EffectifsBannerERPNotConfigured;
