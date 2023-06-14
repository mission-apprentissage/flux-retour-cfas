import { Link as ChakraLink, LinkProps as ChakraLinkProps, SystemProps } from "@chakra-ui/react";
import NavLink from "next/link";
import { usePlausible } from "next-plausible";
import { ReactNode } from "react";

import { plausibleGoals } from "@/common/plausible-goals";

interface LinkProps extends ChakraLinkProps, SystemProps {
  href: string;
  children: ReactNode;
  shallow?: boolean;
  plausibleGoal?: (typeof plausibleGoals)[number];
}
const Link = ({ children, href, shallow, plausibleGoal, ...rest }: LinkProps) => {
  const plausible = usePlausible();
  return (
    <ChakraLink
      {...rest}
      as={NavLink}
      href={href}
      shallow={shallow ?? false}
      onClick={() => {
        plausibleGoal && plausible(plausibleGoal);
      }}
    >
      {children}
    </ChakraLink>
  );
};

export default Link;
