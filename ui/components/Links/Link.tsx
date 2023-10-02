import { Link as ChakraLink, LinkProps as ChakraLinkProps, SystemProps } from "@chakra-ui/react";
import NavLink from "next/link";
import { ReactNode } from "react";
import { PlausibleGoalType } from "shared";

import { usePlausibleTracking } from "@/hooks/plausible";

interface LinkProps extends ChakraLinkProps, SystemProps {
  href: string;
  children: ReactNode;
  shallow?: boolean;
  plausibleGoal?: PlausibleGoalType;
}
const Link = ({ children, href, shallow, plausibleGoal, ...rest }: LinkProps) => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  return (
    <ChakraLink
      as={NavLink}
      href={href}
      shallow={shallow ?? false}
      onClick={() => {
        plausibleGoal && trackPlausibleEvent(plausibleGoal);
      }}
      {...rest}
    >
      {children}
    </ChakraLink>
  );
};

export default Link;
