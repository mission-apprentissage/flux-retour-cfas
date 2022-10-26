import { Box, Divider, Heading, Link, Skeleton, Stack, Text } from "@chakra-ui/react";

import AlertBlock from "../../../../common/components/AlertBlock/AlertBlock.js";
import { CONTACT_ADDRESS } from "../../../../common/constants/productPartageSimplifie.js";
import { formatDateDayMonthYear } from "../../../../common/utils/dateUtils.js";
import useFetchUploadHistory from "./useGetUploadHistory.js";

const UploadHistoryList = () => {
  const { data, isLoading, error } = useFetchUploadHistory();

  return (
    <Stack marginTop="4w" width="80%">
      {error && (
        <AlertBlock variant="error">
          <Text>
            <strong>Erreur.</strong>
          </Text>
          <Text>Une erreur s&apos;est produite.</Text>
          <Text>
            Veuillez vous rapprocher du support du Tableau de bord en écrivant à{" "}
            <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance">
              {CONTACT_ADDRESS}
            </Link>
          </Text>
        </AlertBlock>
      )}

      {isLoading && (
        <Stack spacing="1w">
          <Skeleton height="50px" />
          <Skeleton height="50px" />
          <Skeleton height="50px" />
        </Stack>
      )}

      {data?.uploadHistoryList.length > 0 && !error && !isLoading && (
        <Box color="black">
          <Heading marginBottom="2w" fontSize="28px">
            Historique de vos fichiers transmis
          </Heading>
          <Text fontSize="epsilon" color="#161616">
            Note : La version actuelle de Partagé simplifié ne permet pas encore d’accéder à vos anciens fichiers.
          </Text>
          <Stack marginTop="4w" spacing="2w">
            {data?.uploadHistoryList?.map((item, index) => (
              <Stack key={index}>
                <Divider marginBottom="2w" />
                <Text fontSize="epsilon">• {item.nom_fichier}</Text>
                <Text fontSize="omega" color="#666666">
                  Transmis le {formatDateDayMonthYear(item.date_creation)}
                </Text>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default UploadHistoryList;
