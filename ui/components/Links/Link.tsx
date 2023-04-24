import { Link as ChakraLink } from "@chakra-ui/react";
import NavLink from "next/link";
import React from "react";

const Link = ({ children, href, shallow = false, ...rest }) => {
  return (
    <ChakraLink {...rest} as={NavLink} href={href} shallow={shallow}>
      {children}
    </ChakraLink>
  );
};

export default Link;
