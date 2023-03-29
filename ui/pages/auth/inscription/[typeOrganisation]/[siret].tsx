import React from "react";
import Head from "next/head";
import { Flex, Spinner } from "@chakra-ui/react";

import Page from "@/components/Page/Page";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import InscriptionStep2 from "@/modules/auth/inscription/InscriptionStep2";
import { useRouter } from "next/router";
import useFetchEtablissements from "@/hooks/useFetchEtablissements";
import { CategorieCompteInscription } from "@/modules/auth/inscription/categories";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export const mappingTypeOrganisationToType = {
  tete_de_reseau: "reseau_of",
  academie: "operateur_public",
  draaf: "operateur_public",
  dreets: "operateur_public",
  deets: "operateur_public",
  ddets: "operateur_public",
  conseil_regional: "operateur_public",
  organisme_formation: "of",
};

const PageFormulaire = () => {
  const router = useRouter();
  const { typeOrganisation, siret, uai } = router.query;
  const { data: etablissements, isFetching } = useFetchEtablissements({ siret });
  const etablissement = etablissements?.[0];

  const type = mappingTypeOrganisationToType[typeOrganisation as CategorieCompteInscription];

  return (
    <Page>
      <Head>
        <title>Inscription</title>
      </Head>
      <Flex w="100%" mt={8} minH="40vh" direction={{ base: "column", md: "row" }}>
        {isFetching ? (
          <Spinner />
        ) : (
          etablissement &&
          typeOrganisation && (
            <InscriptionStep2
              flexDirection="column"
              border="1px solid"
              h="100%"
              flexGrow={1}
              borderColor="openbluefrance"
              etablissement={etablissement}
              typeOrganisation={typeOrganisation}
              type={type}
              uai={uai}
              onSucceeded={() => router.push("/auth/inscription/bravo")}
            />
          )
        )}
      </Flex>
    </Page>
  );
};

export default PageFormulaire;
