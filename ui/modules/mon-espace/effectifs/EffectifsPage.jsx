import React, { useEffect, useRef } from "react";
import { Box, Center, Flex, Link, Spinner, Text } from "@chakra-ui/react";
import Effectifs from "./engine/Effectifs.jsx";

import { organismeAtom } from "../../../hooks/organismeAtoms";
import { _get } from "../../../common/httpClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetRecoilState, useRecoilValue } from "recoil";
import ChoixTransmission from "./ChoixTransmission";
import TransmissionAPI from "./TransmissionAPI";
import { useRouter } from "next/router";
import Televersements from "./Televersements";
import { effectifsStateAtom } from "./engine/atoms.js";
import { hasContextAccessTo, isUserAdmin } from "../../../common/utils/rolesUtils.js";
import useAuth from "../../../hooks/useAuth.js";
import Ribbons from "../../../components/Ribbons/Ribbons.jsx";
import { useEspace } from "../../../hooks/useEspace.js";
import { CONTACT_ADDRESS } from "../../../common/constants/product.js";

function useOrganismesEffectifs() {
  const organisme = useRecoilValue(organismeAtom);
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);

  const queryClient = useQueryClient();
  const prevOrganismeId = useRef(null);

  useEffect(() => {
    if (prevOrganismeId.current !== organisme._id) {
      prevOrganismeId.current = organisme._id;
      queryClient.resetQueries("organismesEffectifs", { exact: true });
    }
  }, [queryClient, organisme._id]);

  const { data, isLoading, isFetching } = useQuery(
    ["organismesEffectifs"],
    async () => {
      const organismesEffectifs = await _get(`/api/v1/organisme/effectifs?organisme_id=${organisme._id}`);

      // eslint-disable-next-line no-undef
      const newEffectifsState = new Map();
      for (const { id, validation_errors } of organismesEffectifs) {
        newEffectifsState.set(id, { validation_errors, requiredSifa: [] });
      }
      setCurrentEffectifsState(newEffectifsState);

      return organismesEffectifs;
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  return { isLoading: isFetching || isLoading, organismesEffectifs: data || [] };
}

const EffectifsPage = () => {
  const router = useRouter();
  let [auth] = useAuth();
  const { slug } = router.query;
  const { isMonOrganismePages, isOrganismePages } = useEspace();
  const organisme = useRecoilValue(organismeAtom);
  const { isLoading, organismesEffectifs } = useOrganismesEffectifs();
  const televersementPage = slug.includes("televersement");

  if (isLoading && !televersementPage) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  const displayEffectifs =
    (organisme.mode_de_transmission === "API" && organisme.first_transmission_date) ||
    organisme.mode_de_transmission === "MANUEL";

  const canEdit = hasContextAccessTo(organisme, "organisme/page_effectifs/edition");

  return (
    <>
      {!canEdit && !auth.hasAtLeastOneUserToValidate && (
        <Box mt={12}>
          <Ribbons variant="warning" mt="0.5rem">
            <Box ml={3}>
              <Text color="grey.800" fontSize="1.1rem" fontWeight="bold">
                {isMonOrganismePages && `Vous ne nous transmettez pas encore vos effectifs.`}
                {isOrganismePages && ` Cet organisme ne nous transmet pas encore ses effectifs.`}
              </Text>
              <Text color="grey.800" fontSize="0.9rem">
                Veuillez vous rapprocher d&rsquo;un collaborateur qui aurait des droits de gestion ou d&rsquo;écriture
                dans {isMonOrganismePages ? "votre " : "cet "} organisme
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
      )}
      {(auth.hasAtLeastOneUserToValidate || isUserAdmin(auth)) && (
        <>
          {!organisme.mode_de_transmission && <ChoixTransmission />}
          {organisme.mode_de_transmission === "API" &&
            organisme.erps?.length === 0 &&
            !organisme.first_transmission_date && <TransmissionAPI />}
          {displayEffectifs && televersementPage && <Televersements />}
          {displayEffectifs && !televersementPage && <Effectifs organismesEffectifs={organismesEffectifs} />}
        </>
      )}
    </>
  );
};

export default EffectifsPage;
