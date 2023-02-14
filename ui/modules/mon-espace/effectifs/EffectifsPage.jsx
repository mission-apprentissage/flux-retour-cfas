import React, { useEffect, useRef } from "react";
import { Box, Center, Flex, Link, Spinner, Text } from "@chakra-ui/react";
import Effectifs from "./engine/Effectifs.jsx";

import { organismeAtom } from "../../../hooks/organismeAtoms";
import { _get } from "../../../common/httpClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetRecoilState, useRecoilValue } from "recoil";
import ChoixTransmission from "./ChoixTransmission";
import TransmissionAPI from "./TransmissionAPI";
import Televersements from "./Televersements";
import { effectifsStateAtom } from "./engine/atoms.js";
import { hasContextAccessTo, isUserAdmin } from "../../../common/utils/rolesUtils.js";
import useAuth from "../../../hooks/useAuth.js";
import Ribbons from "../../../components/Ribbons/Ribbons.jsx";
import { CONTACT_ADDRESS } from "../../../common/constants/product.js";

function useOrganismesEffectifs(organismeId) {
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);

  const queryClient = useQueryClient();
  const prevOrganismeId = useRef(null);

  useEffect(() => {
    if (prevOrganismeId.current !== organismeId) {
      prevOrganismeId.current = organismeId;
      queryClient.resetQueries("organismesEffectifs", { exact: true });
    }
  }, [queryClient, organismeId]);

  const { data, isLoading, isFetching } = useQuery(
    ["organismesEffectifs", organismeId],
    async () => {
      const organismesEffectifs = await _get(`/api/v1/organisme/effectifs?organisme_id=${organismeId}`);

      // eslint-disable-next-line no-undef
      const newEffectifsState = new Map();
      for (const { id, validation_errors } of organismesEffectifs) {
        newEffectifsState.set(id, { validation_errors, requiredSifa: [] });
      }
      setCurrentEffectifsState(newEffectifsState);

      return organismesEffectifs;
    },
    {
      enabled: !!organismeId,
    }
  );

  return { isLoading: isFetching || isLoading, organismesEffectifs: data || [] };
}

const EffectifsPage = ({ isMine }) => {
  let [auth] = useAuth();
  const organisme = useRecoilValue(organismeAtom);
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs(organisme?._id);

  if (isLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  const canEdit = hasContextAccessTo(organisme, "organisme/page_effectifs/edition");

  if (auth.hasAtLeastOneUserToValidate || isUserAdmin(auth)) {
    if (!organisme.mode_de_transmission) {
      return <ChoixTransmission />;
    } else if (organisme.mode_de_transmission === "API") {
      if (organisme.erps?.length === 0 && !organisme.first_transmission_date) {
        return <TransmissionAPI />;
      } else if (!organisme.first_transmission_date) {
        return <Televersements organisme={organisme} />;
      } else {
        return <Effectifs isMine={isMine} organismesEffectifs={organismesEffectifs} organisme={organisme} />;
      }
    } else if (organisme.mode_de_transmission === "MANUAL") {
      return <Televersements organisme={organisme} />;
    } else {
      return <Effectifs isMine={isMine} organismesEffectifs={organismesEffectifs} organisme={organisme} />;
    }
  } else if (canEdit) {
    return <Effectifs isMine={isMine} organismesEffectifs={organismesEffectifs} organisme={organisme} />;
  } else {
    return (
      <Box mt={12}>
        <Ribbons variant="warning" mt="0.5rem">
          <Box ml={3}>
            <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
              {isMine
                ? 'Vous ne nous transmettez pas encore vos effectifs. Veuillez cliquer dans l’onglet "Mes effectifs" pour démarrer l’import.'
                : " Cet organisme ne nous transmet pas encore ses effectifs."}
            </Text>
            <Text color="grey.800" fontSize="0.9rem">
              Veuillez vous rapprocher d&rsquo;un collaborateur qui aurait des droits de gestion ou d&rsquo;écriture
              dans {isMine ? "votre " : "cet "} organisme
            </Text>
          </Box>
        </Ribbons>
        <Flex flexGrow={1} alignItems="end" mt={2}>
          <Text mt={8} fontSize="1rem">
            Vous rencontrez des difficultés à passer cette étape ?{" "}
            <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" ml={3}>
              Contacter l&apos;assistance
            </Link>
          </Text>
        </Flex>
      </Box>
    );
  }
};

export default EffectifsPage;
