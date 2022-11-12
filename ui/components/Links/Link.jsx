import React from "react";
import NavLink from "next/link";
import { Link as ChakraLink } from "@chakra-ui/react";

const Link = ({ children, href, shallow = false, ...rest }) => {
  return (
    <ChakraLink {...rest} as={NavLink} href={href} shallow={shallow}>
      {children}
    </ChakraLink>
  );
};

export default Link;
