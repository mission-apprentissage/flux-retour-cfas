import { Box, Stack, Text, Link, HStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";

import { _get } from "@/common/httpClient";
import Tag from "@/components/Tag/Tag";
import { Checkbox, CloseCircle } from "@/theme/components/icons";

interface InfosTransmissionParametrageOFAProps {
  transmission_date?: Date;
  transmission_api_active: boolean;
  transmission_api_version?: string;
  transmission_manuelle_active: boolean;
  parametrage_erp_active: boolean;
  api_key_active: boolean;
  parametrage_erp_date: Date;
  erps: string[];
  organisme_transmetteur?: {
    _id: string;
    enseigne?: string;
    raison_sociale?: string;
  };
}

const InfosTransmissionEtParametrageOFA = ({ organisme, ...props }) => {
  const router = useRouter();

  const { data: parametrage } = useQuery<InfosTransmissionParametrageOFAProps, any>(
    ["admin/organismes/"],
    () => _get(`/api/v1/admin/organismes/${organisme?._id}/parametrage-transmission`),
    { enabled: router.isReady }
  );

  return (
    <Stack borderColor="#0063CB" borderWidth="2px" w="fit-content" p="2w" {...props}>
      <Box color="#0063CB" display="flex" alignItems="center">
        <Box as="i" className="ri-eye-fill" />
        <Text fontSize="zeta" fontWeight="bold" ml="2">
          Encart réservé aux administrateurs
        </Text>
      </Box>
      <HStack spacing="1w">
        <Text>Transmission API :</Text>
        {parametrage?.transmission_api_active ? (
          <Box display="flex" alignItems="center">
            <BadgeYes />
            {parametrage.transmission_api_version && (
              <Tag
                fontSize="epsilon"
                textColor="grey.800"
                textTransform="none"
                paddingX="1w"
                paddingY="2px"
                backgroundColor="#ECEAE3"
                primaryText={parametrage.transmission_api_version}
              />
            )}
            <Text>
              (
              {parametrage.transmission_date
                ? new Date(parametrage.transmission_date).toLocaleDateString()
                : "Date non disponible"}
              )
            </Text>
          </Box>
        ) : (
          <BadgeNo />
        )}
      </HStack>
      <HStack spacing="1w">
        <Text>Transmission manuelle :</Text>
        {parametrage?.transmission_manuelle_active ? (
          <Box display="flex" alignItems="center">
            <BadgeYes />
            <Text>
              (
              {parametrage.transmission_date
                ? new Date(parametrage.transmission_date).toLocaleDateString()
                : "Date non disponible"}
              )
            </Text>
          </Box>
        ) : (
          <BadgeNo />
        )}
      </HStack>
      <HStack spacing="1w">
        <Text>Paramétrage :</Text>
        {parametrage?.parametrage_erp_active ? (
          <HStack spacing="1w">
            <BadgeYes />
            {parametrage.erps?.map((erp, index) => (
              <Tag
                key={index}
                textTransform="none"
                variant="badge"
                colorScheme="grey_tag"
                primaryText={erp.toUpperCase()}
                size="md"
              />
            ))}
            <Text>
              (
              {parametrage.parametrage_erp_date
                ? new Date(parametrage.parametrage_erp_date).toLocaleDateString()
                : "Date non disponible"}
              )
            </Text>
          </HStack>
        ) : (
          <BadgeNo />
        )}
      </HStack>
      <HStack spacing="1w">
        <Text>Clé d’API présente :</Text>
        {parametrage?.api_key_active ? <BadgeYes /> : <BadgeNo />}
      </HStack>
      {parametrage?.organisme_transmetteur ? (
        <Box display="flex" alignItems="center">
          <Text>Dernier organisme transmetteur des effectifs :</Text>
          <Link
            key={parametrage?.organisme_transmetteur._id}
            href={`/organismes/${parametrage?.organisme_transmetteur._id}`}
            target="_blank"
            borderBottom="1px"
            color="action-high-blue-france"
            _hover={{ textDecoration: "none" }}
          >
            {parametrage?.organisme_transmetteur.enseigne ??
              parametrage?.organisme_transmetteur.raison_sociale ??
              "Organisme inconnu"}
          </Link>
        </Box>
      ) : null}
    </Stack>
  );
};

const BadgeYes = () => <Tag leftIcon={Checkbox} primaryText="Oui" variant="badge" colorScheme="green_tag" size="md" />;

const BadgeNo = () => <Tag leftIcon={CloseCircle} primaryText="Non" variant="badge" colorScheme="red_tag" size="md" />;

export default InfosTransmissionEtParametrageOFA;
