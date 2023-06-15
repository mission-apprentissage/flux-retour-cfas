import { Heading, Container, Text, Button, Flex } from "@chakra-ui/react";

import { _post, _put, _delete } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import { NewOrganisation } from "@/modules/auth/inscription/common";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function ImposturesPage() {
  async function impersonate(organisation: NewOrganisation) {
    await _post<NewOrganisation>("/api/v1/admin/impersonate", organisation);
    location.href = "/";
  }

  return (
    <SimplePage title="Imposture">
      <Container maxW="xl" p="8">
        <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" mb={3}>
          Impostures
        </Heading>
        <Text>
          Cette page permet de vous faire passer pour un membre d’une organisation quelconque à des fins de test.
        </Text>
        <Flex gap={8} py={8} wrap="wrap" justifyContent="center">
          <Button
            variant="outline"
            onClick={() =>
              impersonate({
                type: "OPERATEUR_PUBLIC_NATIONAL",
                nom: "Ministère de l’Éducation nationale et de la Jeunesse",
              })
            }
          >
            Ministère de l’Éducation nationale et de la Jeunesse
          </Button>
          <Button variant="outline" onClick={() => impersonate({ type: "DREETS", code_region: "53" })}>
            DREETS Bretagne
          </Button>
          <Button variant="outline" onClick={() => impersonate({ type: "DRAAF", code_region: "53" })}>
            DRAAF Bretagne
          </Button>
          <Button variant="outline" onClick={() => impersonate({ type: "CONSEIL_REGIONAL", code_region: "53" })}>
            Conseil régional Bretagne
          </Button>
          <Button variant="outline" onClick={() => impersonate({ type: "ACADEMIE", code_academie: "14" })}>
            Académie Rennes
          </Button>
          <Button variant="outline" onClick={() => impersonate({ type: "DDETS", code_departement: "56" })}>
            DDETS Morbihan (56)
          </Button>
          <Button variant="outline" onClick={() => impersonate({ type: "TETE_DE_RESEAU", reseau: "CCI" })}>
            Réseau CCI
          </Button>
          <Button variant="outline" onClick={() => impersonate({ type: "TETE_DE_RESEAU", reseau: "CMA" })}>
            Réseau CMA
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              impersonate({ type: "ORGANISME_FORMATION_FORMATEUR", siret: "51400512300013", uai: "0130239P" })
            }
          >
            Kedge 51400512300013/0130239P
          </Button>
        </Flex>

        {/* TODO pouvoir choisir l’organisation manuellement */}
      </Container>
    </SimplePage>
  );
}
export default withAuth(ImposturesPage, ["ADMINISTRATEUR"]);
