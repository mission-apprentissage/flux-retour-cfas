import React, { useState } from "react";
import { useRouter } from "next/router";
import { Box, Button, HStack, Link, Text, Heading } from "@chakra-ui/react";

import { CONTACT_ADDRESS } from "@/common/constants/product";
import { InscriptionOF } from "./InscriptionOF";
import { InscriptionPilot } from "./InscriptionPilot";
import { InscriptionReseau } from "./InscriptionReseau";

const Inscription = ({ organismesAppartenance, ...props }) => {
  const router = useRouter();
  const [siret, setSiret] = useState(null);
  return (
    <Box {...props} flexDirection="column" p={12}>
      <Heading as="h2" fontSize="2xl" mb={[3, 6]}>
        Créer votre compte
      </Heading>
      <Box>
        <Box>
          {organismesAppartenance === "autre" && (
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
          {organismesAppartenance === "organisme_formation" && (
            <InscriptionOF onEtablissementSelected={({ siret }) => setSiret(siret)} />
          )}
          {["pilot", "dreets", "ddets", "draaf", "academie", "conseil_regional"].includes(organismesAppartenance) && (
            <InscriptionPilot onEtablissementSelected={({ siret }) => setSiret(siret)} />
          )}
          {organismesAppartenance === "tete_de_reseau" && (
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
                pathname: `/auth/inscription/${organismesAppartenance}/${siret}`,
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
      </Box>
    </Box>
  );
};

export default Inscription;
