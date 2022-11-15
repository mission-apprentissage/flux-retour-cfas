import React from "react";
import Head from "next/head";
import { Box, Container, Flex, Heading, HStack, Image, Text } from "@chakra-ui/react";
// import { hasUserRoles, roles } from "../common/auth/roles";
import { NAVIGATION_PAGES } from "../common/constants/navigationPages";
import { PRODUCT_NAME } from "../common/constants/product";
import ApercuDesDonneesSection from "./home_/sections/ApercuDesDonneesSection";
import RgpdSection from "./home_/sections/RgpdSection";

import { Page } from "../components/Page/Page";
import LinkCard from "../components/LinkCard/LinkCard";

export default function Home() {
  const title = PRODUCT_NAME;
  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box w="100%" pt={[4, 8]} px={[1, 1, 6, 8]} paddingY="4w">
        <Container maxW="xl">
          <Box>
            <Flex>
              <Box flex="1">
                <Heading as="h1" fontSize="2.3em">
                  Le {PRODUCT_NAME}
                </Heading>
                <Text fontSize="beta" color="grey.800" marginTop="4w">
                  Mettre à disposition des <strong>différents acteurs</strong> <br />
                  les <strong>données clés</strong> de l&apos;apprentissage en <strong>temps réel</strong>
                </Text>
              </Box>
              <Image src="/images/dashboard-illustration.svg" alt="illustration tableau de bord" paddingBottom="3w" />
            </Flex>
            <HStack spacing="3w" _hover={{ cursor: "pointer" }}>
              <LinkCard linkHref={NAVIGATION_PAGES.Login.path}>
                Vous êtes une{" "}
                <strong>
                  institution ou une organisation <br />
                  professionnelle{" "}
                </strong>
                (OPCO, branche, etc...)
              </LinkCard>
              <LinkCard linkHref={NAVIGATION_PAGES.OrganismeFormation.path}>
                Vous êtes un{" "}
                <strong>
                  organisme de formation <br />
                  en apprentissage
                </strong>
              </LinkCard>
            </HStack>
          </Box>
        </Container>
      </Box>
      <ApercuDesDonneesSection /> {/* TODO to add later outside page container to make it full width */}
      <RgpdSection marginTop="6w" />
    </Page>
  );
}

// const HomePage = () => {
//   const { auth, isAuthTokenValid } = useAuth();

//   if (isAuthTokenValid() && hasUserRoles(auth, [roles.pilot, roles.administrator, roles.network])) {
//     return <Redirect to="/visualiser-les-indicateurs" />;
//   }

//   return (
//     <Page>
//       <Section withShadow paddingY="4w">
//         <Box>
//           <Flex>
//             <Box flex="1">
//               <Heading as="h1" fontSize="40px">
//                 Le {PRODUCT_NAME}
//               </Heading>
//               <Text fontSize="beta" color="grey.800" marginTop="4w">
//                 Mettre à disposition des <strong>différents acteurs</strong> <br />
//                 les <strong>données clés</strong> de l&apos;apprentissage en <strong>temps réel</strong>
//               </Text>
//             </Box>
//             <Image src={dashboardIllustration} alt="illustration tableau de bord" paddingBottom="3w" />
//           </Flex>
//           <HStack spacing="3w" _hover={{ cursor: "pointer" }}>
//             <LinkCard linkHref={NAVIGATION_PAGES.Login.path}>
//               Vous êtes une{" "}
//               <strong>
//                 institution ou une organisation <br />
//                 professionnelle{" "}
//               </strong>
//               (OPCO, branche, etc...)
//             </LinkCard>
//             <LinkCard linkHref={NAVIGATION_PAGES.OrganismeFormation.path}>
//               Vous êtes un{" "}
//               <strong>
//                 organisme de formation <br />
//                 en apprentissage
//               </strong>
//             </LinkCard>
//           </HStack>
//         </Box>
//       </Section>
//       <ApercuDesDonneesSection />
//       <RgpdSection marginTop="6w" />
//     </Page>
//   );
// };

// // export default HomePage;
