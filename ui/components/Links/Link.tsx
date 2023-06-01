import { Link as ChakraLink, SystemProps, LinkProps as ChakraLinkProps } from "@chakra-ui/react";
import NavLink from "next/link";
import { ReactNode } from "react";

interface LinkProps extends ChakraLinkProps, SystemProps {
  href: string;
  children: ReactNode;
  shallow?: boolean;
}
const Link = ({ children, href, shallow, ...rest }: LinkProps) => {
  return (
    <ChakraLink {...rest} as={NavLink} href={href} shallow={shallow ?? false}>
      {children}
    </ChakraLink>
  );
};

export default Link;
