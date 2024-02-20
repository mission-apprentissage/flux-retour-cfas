import { Box, Center, HStack, Heading, Spinner, Text, Stack, VStack, useDisclosure, Button } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import React, { useRef } from "react";
import { useRecoilValue } from "recoil";
import { DuplicateEffectifGroup } from "shared";

import { _get } from "@/common/httpClient";
import Link from "@/components/Links/Link";
import { organismeAtom } from "@/hooks/organismeAtoms";
import { usePlausibleTracking } from "@/hooks/plausible";
import { usePagination } from "@/hooks/usePagination";

import EffectifDoublonDeleteAllAlertDialog from "./EffectifDoublonDeleteAllAlertDialog";
import EffectifsDoublonsList from "./EffectifsDoublonsList";

const EffectifsDoublonsPage = ({ isMine }) => {
  const organisme = useRecoilValue(organismeAtom);
  const { isOpen: isOpenAlertDialog, onOpen: onOpenAlertDialog, onClose: onCloseAlertDialog } = useDisclosure();
  const { trackPlausibleEvent } = usePlausibleTracking();
  const cancelRef = useRef();
  const { pageIndex, pageSize, onPageChange, totalPages, totalCount, setTotalItemsCount, onPageSizeChange } =
    usePagination();

  const { data: duplicates, isLoading } = useQuery<DuplicateEffectifGroup[]>(
    [`duplicates-effectifs`, organisme?._id, pageIndex, pageSize],
    async () => {
      const response = await _get(`/api/v1/organismes/${organisme?._id}/duplicates`, {
        params: {
          page: pageIndex + 1,
          limit: pageSize,
        },
      });
      setTotalItemsCount(response.totalItems);
      return response.data;
    },
    {
      keepPreviousData: true,
    }
  );

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  if (!organisme) {
    return (
      <Center>
        <Text color="grey.800" fontSize="1rem" fontWeight="bold">
          Aucun organisme sélectionné. Veuillez sélectionner un organisme pour afficher les duplicatas d&apos;effectifs.
        </Text>
      </Center>
    );
  }

  return (
    <Stack>
      <HStack justifyContent="space-between" mb={8}>
        <VStack alignItems="start">
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            {isMine ? "Mes duplicats d'effectifs" : "Ses duplicats d'effectifs"}
          </Heading>
          <Link
            href={`/organismes/${organisme?._id}/effectifs`}
            color="bluefrance"
            borderBottom="1px solid"
            mt={4}
            _hover={{ cursor: "pointer", textDecoration: "none", borderBottom: "2px solid" }}
          >
            <Box as="i" className="ri-arrow-left-line" marginRight="1w" />
            Retour au tableau des effectifs
          </Link>
        </VStack>
        <Button
          aria-label="Supprimer en lot"
          variant="secondary"
          onClick={() => {
            trackPlausibleEvent("suppression_doublons_effectifs_en_lot");
            onOpenAlertDialog();
          }}
        >
          <Box as="i" className="ri-delete-bin-line" mr={2} />
          <Text as="span">Supprimer en lot</Text>
        </Button>
        <EffectifDoublonDeleteAllAlertDialog
          cancelRef={cancelRef}
          isOpen={isOpenAlertDialog}
          onClose={onCloseAlertDialog}
          dusplicateCount={totalCount}
          organismeId={organisme?._id}
        />
      </HStack>

      <Stack spacing={6}>
        <Text color="grey.800" fontSize="1.1rem" fontWeight="bold" mb={4}>
          {`Vérifier les ${totalCount} duplicats d'effectifs pour l'année scolaire en cours`}
        </Text>

        <EffectifsDoublonsList
          data={duplicates || []}
          onPageChange={onPageChange}
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageSizeChange={onPageSizeChange}
        />
      </Stack>
    </Stack>
  );
};

export default EffectifsDoublonsPage;
