import React, { useState } from "react";
import { Box, Button, HStack, Link, Text } from "@chakra-ui/react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useRouter } from "next/router";
import { CONTACT_ADDRESS } from "@/common/constants/product";
import { CategorieCompteInscription } from "@/modules/auth/inscription/categories";
import { InscriptionOF } from "@/modules/auth/inscription/InscriptionOF";
import { InscriptionOperateurPublic } from "@/modules/auth/inscription/InscriptionOperateurPublic";
import { InscriptionReseau } from "@/modules/auth/inscription/InscriptionReseau";
import InscriptionWrapper from "@/modules/auth/inscription/InscriptionWrapper";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const RegisterConfigurationOrganisationPage = () => {
  const router = useRouter();
  const typeOrganisation = router.query.typeOrganisation as CategorieCompteInscription;
  console.log(typeOrganisation, router.query);

  // TODO supprimer de ce composant
  const [siret, setSiret] = useState(null);

  return (
    <InscriptionWrapper>
      <Box>
        {typeOrganisation === "autre" && (
          <HStack ml="4w" mt="2w">
            <Box p="2" h="7vh" borderLeft="4px solid bluefrances.525" />
            <Box>
              <Text>Contacter l&apos;équipe :</Text>
              <Link fontWeight={700} href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                {CONTACT_ADDRESS}
              </Link>{" "}
            </Box>
          </HStack>
        )}
        {typeOrganisation === "organisme_formation" && (
          <InscriptionOF onEtablissementSelected={({ siret }) => setSiret(siret)} />
        )}
        {["operateur_public", "dreets", "ddets", "draaf", "academie", "conseil_regional"].includes(
          typeOrganisation
        ) && <InscriptionOperateurPublic onEtablissementSelected={({ siret }) => setSiret(siret)} />}
        {typeOrganisation === "tete_de_reseau" && (
          <InscriptionReseau onEtablissementSelected={({ siret }) => setSiret(siret)} />
        )}
      </Box>
      <HStack gap="24px" mt={5}>
        <Button
          onClick={() =>
            router.query.select
              ? router.push("/auth/inscription/organisme_formation")
              : router.push("/auth/inscription")
          }
          color="bluefrance"
          variant="secondary"
        >
          Revenir
        </Button>
        <Button
          size="md"
          variant="primary"
          onClick={() =>
            router.push({
              pathname: `/auth/inscription/${typeOrganisation}/${siret}`,
              query: router.query.uai
                ? {
                    uai: router.query.uai,
                  }
                : {},
            })
          }
          px={6}
          isDisabled={!siret}
        >
          Suivant
        </Button>
      </HStack>
    </InscriptionWrapper>
  );
};

export default RegisterConfigurationOrganisationPage;
