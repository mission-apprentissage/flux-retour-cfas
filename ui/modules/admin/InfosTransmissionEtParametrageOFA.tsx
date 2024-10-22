import { Box, Stack, Text, Link, HStack, useClipboard, Input, Button } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useState } from "react";

import { _get, _post } from "@/common/httpClient";
import Tag from "@/components/Tag/Tag";
import { Checkbox, CloseCircle } from "@/theme/components/icons";

interface InfosTransmissionParametrageOFAProps {
  transmission_date?: Date;
  transmission_api_active: boolean;
  transmission_api_version?: string;
  transmission_manuelle_active: boolean;
  parametrage_erp_active: boolean;
  api_key_active: boolean;
  api_key: string;
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
  const [showFullApiKey, setShowFullApiKey] = useState(false);
  const { onCopy, hasCopied } = useClipboard(parametrage?.api_key ?? "");

  const toggleApiKeyVisibility = () => setShowFullApiKey(!showFullApiKey);

  const apiKeyDisplay = parametrage?.api_key
    ? showFullApiKey
      ? parametrage.api_key
      : parametrage.api_key.replace(/(?<=.{3})[^-]/g, "•")
    : "Aucune clé API disponible";

  return (
    <Stack borderColor="#0063CB" borderWidth="2px" w="100%" p="2w" {...props}>
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
      {parametrage?.api_key && (
        <HStack spacing="1w">
          <Text>Clé API :</Text>
          <HStack spacing="1w">
            <Input value={apiKeyDisplay} isReadOnly size="sm" width="330px" />
            <Button size="sm" variant="primary" onClick={toggleApiKeyVisibility}>
              {showFullApiKey ? (
                <Box as="i" className="ri-eye-off-line" verticalAlign="middle" />
              ) : (
                <Box as="i" className="ri-eye-line" verticalAlign="middle" />
              )}
            </Button>
            <Button size="sm" variant="primary" onClick={onCopy} ml="2">
              {hasCopied ? "Copié !" : "Copier"}
            </Button>
          </HStack>
        </HStack>
      )}
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
      {parametrage?.api_key && (
        <HStack spacing="1w">
          <Text>Clé API :</Text>
          <HStack spacing="1w">
            <Input value={apiKeyDisplay} isReadOnly size="sm" width="330px" />
            <Button size="sm" variant="primary" onClick={toggleApiKeyVisibility}>
              {showFullApiKey ? (
                <Box as="i" className="ri-eye-off-line" verticalAlign="middle" />
              ) : (
                <Box as="i" className="ri-eye-line" verticalAlign="middle" />
              )}
            </Button>
            <Button size="sm" variant="primary" onClick={onCopy} ml="2">
              {hasCopied ? "Copié !" : "Copier"}
            </Button>
          </HStack>
        </HStack>
      )}
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
                borderRadius={0}
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
      {parametrage?.organisme_transmetteur ? (
        <Box display="flex" alignItems="center">
          <Text>Dernier organisme transmetteur des effectifs : </Text>
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
      <Button
        variant="secondary"
        w="fit-content"
        bg="white"
        onClick={async () => {
          location.href = `/organismes/${organisme?._id}/transmissions`;
        }}
      >
        <Box as="i" className="ri-eye-line" verticalAlign="middle" mr={2} />
        Voir le rapport de transmission
      </Button>
    </Stack>
  );
};

const BadgeYes = () => <Tag leftIcon={Checkbox} primaryText="Oui" variant="badge" colorScheme="green_tag" size="md" />;

const BadgeNo = () => <Tag leftIcon={CloseCircle} primaryText="Non" variant="badge" colorScheme="red_tag" size="md" />;

export default InfosTransmissionEtParametrageOFA;
