import { ArrowForwardIcon } from "@chakra-ui/icons";
import { HStack, Box, Link } from "@chakra-ui/react";

interface SupportLinkProps {
  href: string;
  label?: string;
}
const SupportLink = ({ href, label }: SupportLinkProps) => {
  return (
    <HStack justifyContent="space-between">
      <Box />
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        color="action-high-blue-france"
        borderBottom="1px"
        _hover={{ textDecoration: "none" }}
      >
        <ArrowForwardIcon mr={2} />
        {label ?? "Signaler une anomalie"}
      </Link>
    </HStack>
  );
};

export default SupportLink;
