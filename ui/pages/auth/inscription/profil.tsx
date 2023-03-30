import React, { useEffect, useState } from "react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useRouter } from "next/router";
import InscriptionWrapper from "@/modules/auth/inscription/InscriptionWrapper";
import { Box, Text } from "@chakra-ui/react";
import Ribbons from "@/components/Ribbons/Ribbons";
import { TETE_DE_RESEAUX_BY_ID } from "@/common/constants/networksConstants";
import { Organisation } from "@/common/internal/Organisation";
import { ACADEMIES_BY_ID, REGIONS_BY_ID, DEPARTEMENTS_BY_ID } from "@/common/constants/territoiresConstants";
import { _get } from "@/common/httpClient";
import useToaster from "@/hooks/useToaster";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function getOrganisationRibbon(organisation: Organisation) {
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      return (
        <>
          <Text fontSize="20px" fontWeight="bold">
            nom entreprise
          </Text>
          <Text>
            UAI : {organisation.uai} - SIRET : {organisation.siret} (en activité)
          </Text>
        </>
      );
    }

    case "TETE_DE_RESEAU":
      return (
        <Text fontSize="20px" fontWeight="bold">
          {TETE_DE_RESEAUX_BY_ID[organisation.reseau]?.nom}
        </Text>
      );

    case "DREETS":
    case "DEETS":
    case "DRAAF":
      return (
        <>
          <Text fontSize="20px" fontWeight="bold">
            {organisation.type}
          </Text>
          <Text>Territoire : {REGIONS_BY_ID[organisation.code_region].nom}</Text>
        </>
      );
    case "CONSEIL_REGIONAL":
      return (
        <>
          <Text fontSize="20px" fontWeight="bold">
            Conseil régional
          </Text>
          <Text>Territoire : {REGIONS_BY_ID[organisation.code_region].nom}</Text>
        </>
      );
    case "DDETS":
      return (
        <>
          <Text fontSize="20px" fontWeight="bold">
            DDETS
          </Text>
          <Text>Territoire : {DEPARTEMENTS_BY_ID[organisation.code_departement].nom}</Text>
        </>
      );

    case "ACADEMIE":
      return (
        <>
          <Text fontSize="20px" fontWeight="bold">
            Académie
          </Text>
          <Text>Territoire : {ACADEMIES_BY_ID[organisation.code_academie].nom}</Text>
        </>
      );

    case "OPERATEUR_PUBLIC_NATIONAL":
      return (
        <Text fontSize="20px" fontWeight="bold">
          {organisation.nom}
        </Text>
      );
    case "ADMINISTRATEUR":
      return (
        <Text fontSize="20px" fontWeight="bold">
          Administrateur
        </Text>
      );
  }
}

const PageFormulaireProfil = () => {
  const router = useRouter();
  const { toastError } = useToaster();
  const [organisation, setOrganisation] = useState<Organisation | null>(null);

  // try to use the invitation token if provided
  useEffect(() => {
    if (router.query.organisation) {
      setOrganisation(JSON.parse(router.query.organisation as string));
    }
    if (router.query.invitationToken) {
      (async () => {
        try {
          const invitation = await _get(`/api/v1/invitations/${router.query.invitationToken}`);
          console.log("invitation", invitation);
          setOrganisation(invitation.organisation);
          // FIXME reject
          // TODO verrouiller email
        } catch (err) {
          toastError(err?.message);
        }
        // organisation;
      })();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <InscriptionWrapper>
      {organisation && (
        <Ribbons variant="success" mt="0.5rem">
          <Box ml={3} color="grey.800">
            {getOrganisationRibbon(organisation)}
          </Box>
        </Ribbons>
      )}
      {/* {isFetching ? (
      //   <Spinner />
      // ) : (
      //   etablissement &&
      //   typeOrganisation && (
      //     <InscriptionStep2
      //       flexDirection="column"
      //       border="1px solid"
      //       h="100%"
      //       flexGrow={1}
      //       borderColor="openbluefrance"
      //       etablissement={etablissement}
      //       typeOrganisation={typeOrganisation}
      //       type={type}
      //       uai={uai}
      //       onSucceeded={() => router.push("/auth/inscription/bravo")}
      //     />
      //   )
      // )} */}
    </InscriptionWrapper>
  );
};

export default PageFormulaireProfil;
