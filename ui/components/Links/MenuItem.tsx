import { MenuItem as ChakraMenuItem } from "@chakra-ui/react";
import NavLink from "next/link";
import React from "react";

const MenuItem = ({ children, href, ...rest }) => {
  return (
    <ChakraMenuItem {...rest} as={NavLink} href={href}>
      {children}
    </ChakraMenuItem>
  );
};

export default MenuItem;
