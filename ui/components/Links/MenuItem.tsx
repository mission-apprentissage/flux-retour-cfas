import React from "react";
import NavLink from "next/link";
import { MenuItem as ChakraMenuItem } from "@chakra-ui/react";

const MenuItem = ({ children, href, ...rest }) => {
  return (
    <ChakraMenuItem {...rest} as={NavLink} href={href}>
      {children}
    </ChakraMenuItem>
  );
};

export default MenuItem;
