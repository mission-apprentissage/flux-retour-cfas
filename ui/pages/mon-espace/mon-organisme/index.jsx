import React from "react";
import { Stack, Heading, Text } from "@chakra-ui/react";

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps";
import { useEspace } from "@/hooks/useEspace";
import OrganismeInfo from "@/modules/mon-espace/landing/LandingOrganisme/components/OrganismeInfo";
import { hasContextAccessTo } from "@/common/utils/rolesUtils";
import ViewSelection from "@/modules/mon-espace/landing/visualiser-les-indicateurs/ViewSelection";
import DashboardContainer from "@/modules/mon-espace/landing/DashboardContainer";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const PageMonOrganisme = () => {
  let { myOrganisme } = useEspace();

  return (
    <DashboardContainer>
      {/* TODO: s'assurer qu'on est sur le bon écran selon le profil utilisateur */}
      {myOrganisme ? (
        hasContextAccessTo(myOrganisme, "organisme/tableau_de_bord") && (
          <Stack spacing="2w">
            <Heading textStyle="h2" color="grey.800">
              Bienvenue sur votre tableau de bord
            </Heading>
            <OrganismeInfo organisme={myOrganisme} isMine={true} />
          </Stack>
        )
      ) : (
        <>
          <Text marginTop="3v" fontSize="gamma" color="grey.800">
            Quelle vue souhaitez-vous afficher ?
          </Text>
          <ViewSelection />
        </>
      )}

      {/* old dashboard component */}
      {/* <Stack spacing="2w">
              <Heading textStyle="h2" color="grey.800">
                Bienvenue sur votre tableau de bord
              </Heading>

              <SimpleFiltersProvider>
                <IndicateursInfo />
              </SimpleFiltersProvider>
            </Stack> */}
    </DashboardContainer>
  );
};

export default PageMonOrganisme;
