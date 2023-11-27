import { Badge, Box, HStack, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";

import { _get } from "@/common/httpClient";
import { Checkbox, CloseCircle } from "@/theme/components/icons";

interface InfosTransmissionParametrageOFAProps {
  transmission_date?: Date;
  transmission_api_active: boolean;
  transmission_api_version?: string;
  transmission_manuelle_active: boolean;
  parametrage_erp_active: boolean;
  parametrage_erp_date: Date;
  erps: string[];
}

const InfosTransmissionEtParametrageOFA = ({ organisme, ...props }) => {
  const router = useRouter();

  const { data: parametrage } = useQuery<InfosTransmissionParametrageOFAProps, any>(
    ["admin/organismes/"],
    () => _get(`/api/v1/admin/organismes/${organisme?._id}/parametrage-transmission`),
    { enabled: router.isReady }
  );

  return (
    <Box borderColor="#0063CB" borderWidth="2px" p="2w" w="50%" {...props}>
      <Stack>
        <HStack color="#0063CB">
          <Box as="i" className="ri-eye-fill" />
          <Box>
            <Text fontSize="zeta" fontWeight="bold">
              Encart réservé aux administrateurs
            </Text>
          </Box>
        </HStack>
        <HStack>
          <Text>Transmission API :</Text>
          {parametrage?.transmission_api_active ? (
            <HStack spacing="1w">
              <BadgeYes />
              {parametrage.transmission_api_version && (
                <Badge
                  fontSize="epsilon"
                  textColor="grey.800"
                  textTransform="none"
                  paddingX="1w"
                  paddingY="2px"
                  backgroundColor="#ECEAE3"
                >
                  {parametrage.transmission_api_version}
                </Badge>
              )}
              <Text>
                (
                {parametrage.transmission_date
                  ? new Date(parametrage.transmission_date).toLocaleDateString()
                  : "Date non disponible"}
                )
              </Text>
            </HStack>
          ) : (
            <BadgeNo />
          )}
        </HStack>
        <HStack>
          <Text>Transmission manuelle :</Text>
          {parametrage?.transmission_manuelle_active ? (
            <HStack spacing="1w">
              <BadgeYes />
              <Text>
                (
                {parametrage.transmission_date
                  ? new Date(parametrage.transmission_date).toLocaleDateString()
                  : "Date non disponible"}
                )
              </Text>
            </HStack>
          ) : (
            <BadgeNo />
          )}
        </HStack>
        <HStack>
          <Text>Paramétrage ERP :</Text>{" "}
          {parametrage?.parametrage_erp_active ? (
            <HStack spacing="1w">
              <BadgeYes />
              {parametrage.erps?.map((erp, index) => (
                <Badge
                  key={index}
                  fontSize="epsilon"
                  textColor="grey.800"
                  textTransform="none"
                  paddingX="1w"
                  paddingY="2px"
                  backgroundColor="#ECEAE3"
                >
                  {erp.toUpperCase()}
                </Badge>
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
      </Stack>
    </Box>
  );
};

const BadgeYes = () => (
  <HStack paddingX="1w" paddingY="2px" borderRadius={6} backgroundColor="greensoft.200" color="greensoft.600">
    <Checkbox />
    <Box>
      <Text fontSize="zeta" fontWeight="bold">
        Oui
      </Text>
    </Box>
  </HStack>
);

const BadgeNo = () => (
  <HStack paddingX="1w" paddingY="2px" borderRadius={6} backgroundColor="red.200" color="red.600">
    <CloseCircle />
    <Box>
      <Text fontSize="zeta" fontWeight="bold">
        Non
      </Text>
    </Box>
  </HStack>
);
export default InfosTransmissionEtParametrageOFA;
