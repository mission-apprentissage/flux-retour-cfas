import React from "react";
import { Box, Container, Flex, Heading, Tag, Text } from "@chakra-ui/react";
import { Logo } from "./Logo";
import Link from "../../Links/Link";
import { PRODUCT_NAME } from "../../../common/constants/product";

const Header = () => {
  return (
    <Container maxW={"full"} borderBottom={"1px solid"} borderColor={"grey.400"} px={[0, 4]} as="header">
      <Container maxW="xl" py={[0, 2]} px={[0, 4]}>
        <Flex alignItems="center" color="grey.800">
          {/* Logo */}
          <Link href="/" p={[4, 0]}>
            <Logo />
          </Link>

          <Box marginLeft="5w">
            <Heading as="h6" variant="h1" fontSize="gamma">
              Le {PRODUCT_NAME}{" "}
            </Heading>
            <Text fontFamily="Marianne" color="grey.700" fontSize="zeta">
              Mettre à disposition des différents acteurs les données clés de l&apos;apprentissage en temps réel
            </Text>
          </Box>
          <Tag marginBottom="1w" backgroundColor="bluefrance" color="white" ml="5">
            Beta-V1
          </Tag>
        </Flex>
      </Container>
    </Container>
  );
};

export default Header;
