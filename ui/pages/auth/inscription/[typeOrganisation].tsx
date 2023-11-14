import { Box, Button, HStack, Link, Text } from "@chakra-ui/react";
import NavLink from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";

import { CONTACT_ADDRESS } from "@/common/constants/product";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { CategorieCompteInscription } from "@/modules/auth/inscription/categories";
import { NewOrganisation, SetterOrganisation } from "@/modules/auth/inscription/common";
import { InscriptionCarifOref } from "@/modules/auth/inscription/InscriptionCarifOref";
import { InscriptionOF } from "@/modules/auth/inscription/InscriptionOF";
import { InscriptionOperateurPublic } from "@/modules/auth/inscription/InscriptionOperateurPublic";
import { InscriptionTeteDeReseau } from "@/modules/auth/inscription/InscriptionTeteDeReseau";
import InscriptionWrapper from "@/modules/auth/inscription/InscriptionWrapper";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const RegisterConfigurationOrganisationPage = () => {
  const router = useRouter();
  const typeOrganisation = router.query.typeOrganisation as CategorieCompteInscription;
  const [organisation, setOrganisation] = useState<NewOrganisation | null>(null);

  return (
    <InscriptionWrapper>
      <Box>
        {typeOrganisation === "autre" && (
          <HStack ml="4w" mt="2w">
            <Box p="2" h="7vh" borderLeft="4px solid bluefrances.525" />
            <Box>
              <Text>Contacter l&apos;équipe :</Text>
              <Link
                fontWeight={700}
                href={`mailto:${CONTACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                color="bluefrance"
                whiteSpace="nowrap"
              >
                {CONTACT_ADDRESS}
              </Link>{" "}
            </Box>
          </HStack>
        )}
        {typeOrganisation === "organisme_formation" && (
          <InscriptionOF organisation={organisation} setOrganisation={setOrganisation as SetterOrganisation} />
        )}
        {typeOrganisation === "operateur_public" && (
          <InscriptionOperateurPublic setOrganisation={setOrganisation as SetterOrganisation} />
        )}
        {typeOrganisation === "tete_de_reseau" && (
          <InscriptionTeteDeReseau
            organisation={organisation}
            setOrganisation={setOrganisation as SetterOrganisation}
          />
        )}
        {typeOrganisation === "carif_oref" && (
          <InscriptionCarifOref setOrganisation={setOrganisation as SetterOrganisation} />
        )}
      </Box>
      <HStack gap="24px" mt={5}>
        <Button onClick={() => router.push("/auth/inscription")} color="bluefrance" variant="secondary">
          Revenir
        </Button>
        <Button
          size="md"
          variant="primary"
          onClick={() => router.push(`/auth/inscription/profil?organisation=${JSON.stringify(organisation)}`)}
          px={6}
          isDisabled={!organisation}
        >
          Suivant
        </Button>
      </HStack>
      {typeOrganisation === "organisme_formation" && (
        <Text mt={6}>
          <Link
            as={NavLink}
            href="/auth/inscription/organisme-inconnu"
            borderBottom="1px solid"
            color="bluefrance"
            _hover={{ textDecoration: "none" }}
          >
            Vous ne connaissez ni votre UAI ni votre SIRET
          </Link>
        </Text>
      )}
    </InscriptionWrapper>
  );
};

export default RegisterConfigurationOrganisationPage;
