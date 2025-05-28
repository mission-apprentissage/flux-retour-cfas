import { Heading, Container, Text, Box } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { IOrganisationCreate } from "shared";

import { _post, _put, _delete } from "@/common/httpClient";
import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import withAuth from "@/components/withAuth";
import SearchBySIRETForm from "@/modules/auth/inscription/components/SearchBySIRETForm";
import { InscriptionCarifOref } from "@/modules/auth/inscription/InscriptionCarifOref";
import { InscriptionMissionLocale } from "@/modules/auth/inscription/InscriptionMissionLocale";
import { InscriptionOperateurPublic } from "@/modules/auth/inscription/InscriptionOperateurPublic";
import { InscriptionTeteDeReseau } from "@/modules/auth/inscription/InscriptionTeteDeReseau";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

function ImposturesPage() {
  const [organisation, setOrganisation] = useState<IOrganisationCreate | null>(null);

  useEffect(() => {
    if (organisation) {
      void impersonate(organisation);
    }
  }, [organisation]);

  async function impersonate(organisation: IOrganisationCreate) {
    await _post<IOrganisationCreate>("/api/v1/admin/impersonate", organisation);
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

        <Box maxW="fit-content">
          <Heading as="h2" color="#465F9D" fontSize="gamma" fontWeight="700" mt={10} mb={3}>
            Opérateur public
          </Heading>
          <InscriptionOperateurPublic setOrganisation={setOrganisation} />
          <Heading as="h2" color="#465F9D" fontSize="gamma" fontWeight="700" mt={10} mb={3}>
            CARIF OREF
          </Heading>
          <InscriptionCarifOref setOrganisation={setOrganisation} />
          <Heading as="h2" color="#465F9D" fontSize="gamma" fontWeight="700" mt={10} mb={3}>
            Tête de réseau
          </Heading>
          <InscriptionTeteDeReseau setOrganisation={setOrganisation} />
          <Heading as="h2" color="#465F9D" fontSize="gamma" fontWeight="700" mt={10} mb={3}>
            Organisme de formation
          </Heading>
          Pour connaître des SIRET d’OFA, voir le{" "}
          <Link
            href="https://referentiel.apprentissage.onisep.fr/organismes?uais=true"
            color="action-high-blue-france"
            isExternal
            isUnderlined
          >
            référentiel
          </Link>
          .
          <SearchBySIRETForm organisation={organisation} setOrganisation={setOrganisation} />
          <Heading as="h2" color="#465F9D" fontSize="gamma" fontWeight="700" mt={10} mb={3}>
            Mission Locale
          </Heading>
          <InscriptionMissionLocale setOrganisation={setOrganisation} />
        </Box>
      </Container>
    </SimplePage>
  );
}
export default withAuth(ImposturesPage, ["ADMINISTRATEUR"]);
