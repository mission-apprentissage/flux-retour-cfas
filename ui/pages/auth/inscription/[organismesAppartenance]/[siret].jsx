import React from "react";
import Head from "next/head";
import { Flex, Spinner } from "@chakra-ui/react";

import Page from "@/components/Page/Page";
import InformationBlock from "@/modules/auth/inscription/components/InformationBlock";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import InscriptionStep2 from "@/modules/auth/inscription/InscriptionStep2";
import { useRouter } from "next/router";
import useFetchEtablissements from "@/hooks/useFetchEtablissements";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

export const mappingOrganismeAppartenanceToType = {
  tete_de_reseau: "reseau_of",
  academie: "pilot",
  draaf: "pilot",
  carif_oref: "pilot",
  dreets: "pilot",
  deets: "pilot",
  ddets: "pilot",
  conseil_regional: "pilot",
  opco: "pilot",
  erp: "pilot",
  pole_emploi: "pilot",
  mission_locale: "pilot",
  cellule_apprentissage: "pilot",
  organisme_formation: "of",
};

const PageFormulaire = () => {
  const router = useRouter();
  const title = "Créer un compte";
  const { organismesAppartenance, siret, uai } = router.query;
  const { data: etablissements, isFetching } = useFetchEtablissements({ siret });
  const etablissement = etablissements?.[0];

  const type = mappingOrganismeAppartenanceToType[organismesAppartenance];

  return (
    <Page>
      <Head>
        <title>Inscription</title>
      </Head>
      <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title }]} />
      <Flex w="100%" mt={8} minH="40vh" direction={{ base: "column", md: "row" }}>
        {isFetching ? (
          <Spinner />
        ) : (
          etablissement &&
          organismesAppartenance && (
            <InscriptionStep2
              flexDirection="column"
              border="1px solid"
              h="100%"
              flexGrow={1}
              borderColor="openbluefrance"
              etablissement={etablissement}
              organismesAppartenance={organismesAppartenance}
              type={type}
              uai={uai}
              onSucceeded={() => router.push("/auth/inscription/bravo")}
            />
          )
        )}
        <InformationBlock w={{ base: "100%", md: "50%" }} />
      </Flex>
    </Page>
  );
};

export default PageFormulaire;
