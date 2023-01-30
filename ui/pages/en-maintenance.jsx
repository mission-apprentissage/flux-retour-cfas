import React, { useEffect } from "react";
import Head from "next/head";
import { Box, Center, HStack, Heading, Link, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import ChakraUIMarkdownRenderer from "chakra-ui-markdown-renderer";

import { getAuthServerSideProps } from "../common/SSR/getAuthServerSideProps";
import { Page } from "../components/Page/Page";
import { ExternalLinkLine } from "../theme/components/icons";
import useAuth from "../hooks/useAuth";
import useMaintenanceMessages from "../hooks/useMaintenanceMessages";
import { isUserAdmin } from "../common/utils/rolesUtils";

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } });

const chakraUIMarkdownRendererTheme = {
  // we override anchors to reformat the link (aka remove the '##') and add an icon.
  a: ({ children, href, ...rest }) => (
    <Link textDecoration={"underline"} isExternal {...rest} href={href.replace(/^##/, "")}>
      {children}
      <ExternalLinkLine w={"0.75rem"} h={"0.75rem"} mb={"0.125rem"} ml={"0.125rem"} />
    </Link>
  ),
};

const MaintenancePage = () => {
  const router = useRouter();
  let [auth] = useAuth();

  const { messageMaintenance, isLoading } = useMaintenanceMessages();

  useEffect(() => {
    if (isLoading || messageMaintenance?.enabled) {
      return;
    }
    router.push("/");
  }, [router, isLoading, messageMaintenance]);

  const title = "Site en cours de maintenance";
  return (
    <Page withoutDisplayNavigationBar={!isUserAdmin(auth)}>
      <Head>
        <title>{title}</title>
      </Head>
      <Center mt={16} h="full" pt={[4, 6]} paddingY="2w" color="grey.800" flexDirection="column">
        <HStack spacing={10}>
          <Box pr={8}>
            <Heading textStyle="h2" color="grey.800" mt={5}>
              {title}
            </Heading>
            <Text fontSize="1.3rem" fontFamily="Marianne" fontWeight="500" marginBottom="2w" mt="8">
              Nous nous excusons pour la gêne occasionnée.
            </Text>
            <Text fontSize="1.3rem" fontFamily="Marianne" fontWeight="500" marginBottom="2w" mt="8">
              <ReactMarkdown components={ChakraUIMarkdownRenderer(chakraUIMarkdownRendererTheme)} skipHtml>
                {messageMaintenance?.msg}
              </ReactMarkdown>
            </Text>
          </Box>
          <Box>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/maintenance.svg" alt="maintenance" width="400px" />
          </Box>
        </HStack>
      </Center>
    </Page>
  );
};

export default MaintenancePage;
