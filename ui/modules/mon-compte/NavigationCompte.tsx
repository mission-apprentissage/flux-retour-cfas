import { Box, Heading, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

import withAuth from "@/components/withAuth";

const NavigationCompte = () => {
  const router = useRouter();

  const menu = [
    {
      name: "Mes informations",
      href: "/mon-compte",
    },
    ...(["recette", "local"].includes(process.env.NEXT_PUBLIC_ENV as string)
      ? [
          {
            name: "Paramétrage ERP",
            href: "/mon-compte/erp",
          },
        ]
      : []),
  ];

  return (
    <VStack w="30%" pt={[4, 8]} color="#1E1E1E" gap={2} alignItems="baseline">
      {menu.map((item) => (
        <Box
          as={Link}
          href={item.href}
          key={item.name}
          borderLeft="2px solid"
          _hover={{ cursor: "pointer" }}
          borderColor={router.asPath === item.href ? "bluefrance" : "transparent"}
          color={"bluefrance"}
        >
          <Heading as="h2" fontSize="md" ml={3}>
            {item.name}
          </Heading>
        </Box>
      ))}
    </VStack>
  );
};

export default withAuth(NavigationCompte);
