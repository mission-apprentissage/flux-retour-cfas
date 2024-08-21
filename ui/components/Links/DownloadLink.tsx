import { Flex, Button, Box, Text } from "@chakra-ui/react";
import Link from "next/link";
import { ReactNode } from "react";

interface DownloadLinkProps {
  children: ReactNode;
  href: string;
  fileType: string;
  fileSize: string;
  onClick?: () => void;
  [key: string]: any;
}

const DownloadLink = ({ href, children, fileType, fileSize, onClick, ...props }: DownloadLinkProps) => {
  const isExternal = href.startsWith("https") || props.isExternal;

  return (
    <Flex direction="column" gap={1}>
      <Button
        as={Link}
        variant="link"
        href={href}
        fontSize="md"
        borderBottom="1px"
        borderRadius="0"
        p="0"
        width="fit-content"
        _hover={{ textDecoration: "none" }}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        onClick={onClick}
        {...props}
      >
        {children}
        <Box as="i" className="ri-download-line" color="bluefrance" ml={2} />
      </Button>
      <Text color="grey.600" fontSize="sm">
        {fileType} - {fileSize}
      </Text>
    </Flex>
  );
};

export default DownloadLink;
