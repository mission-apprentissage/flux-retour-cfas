import { Link as ChakraLink, LinkProps as ChakraLinkProps } from "@chakra-ui/react";
import NavLink from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { PlausibleGoalType } from "shared";

import { usePlausibleTracking } from "@/hooks/plausible";
import { ExternalLinkLine } from "@/theme/components/icons";

interface LinkProps extends ChakraLinkProps {
  href: string;
  isExternal?: boolean;
  isUnderlined?: boolean;
  children: ReactNode;
  shallow?: boolean;
  plausibleGoal?: PlausibleGoalType;
}

const Link = ({
  children,
  href,
  shallow,
  plausibleGoal,
  isExternal = false,
  isUnderlined = false,
  ...rest
}: LinkProps) => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  const router = useRouter();

  return (
    <ChakraLink
      as={NavLink}
      href={href}
      position="relative"
      textDecoration="none"
      display="inline-flex"
      alignItems="center"
      shallow={shallow ?? false}
      _hover={isUnderlined ? { "--underline-hover-width": "100%" } : {}}
      sx={{
        "--underline-hover-width": isUnderlined ? "0%" : "0%",
        "--underline-idle-width": isUnderlined ? "100%" : "0%",
        "--underline-thickness": "1px",
        "--hover-tint": "rgba(0, 0, 255, 0.1)",

        backgroundImage: isUnderlined
          ? "linear-gradient(0deg, currentColor, currentColor), linear-gradient(0deg, currentColor, currentColor)"
          : "none",
        backgroundPosition: isUnderlined ? "0 100%, 0 calc(100% - var(--underline-thickness))" : "0 100%",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundSize: isUnderlined
          ? "var(--underline-hover-width) calc(var(--underline-thickness) * 2), var(--underline-idle-width) var(--underline-thickness)"
          : "0px 0px",
      }}
      onClick={() => {
        const currentPath = router.pathname;
        if (plausibleGoal) {
          trackPlausibleEvent(plausibleGoal, currentPath);
        }
      }}
      isExternal={isExternal}
      {...rest}
    >
      {children}
      {isExternal && <ExternalLinkLine w={3} h={3} ml={1} />}
    </ChakraLink>
  );
};

export default Link;
