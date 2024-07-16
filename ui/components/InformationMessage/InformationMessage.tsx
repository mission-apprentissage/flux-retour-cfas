import { Box, Collapse, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { FC, ReactNode } from "react";

interface Props {
  backgroundColor: string;
  title: string;
  titleColor: string;
  icon: ReactNode;
  collapse?: { label: string; content: ReactNode };
  children: ReactNode;
}

const InformationMessage: FC<Props> = ({ backgroundColor, title, titleColor, icon, collapse, children }) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box bg={backgroundColor} borderRadius="md" p={6} mb={4}>
      <Box display="flex" alignItems="center" mb={2}>
        <Box mr={2}>{icon}</Box>
        <Heading size="sm" color={titleColor}>
          {title}
        </Heading>
      </Box>
      <Text mb={2} p={2} fontSize="zeta">
        {children}
      </Text>
      {collapse && (
        <>
          <Text as="button" onClick={onToggle} color="black" mb={2} cursor="pointer">
            {collapse.label}
          </Text>
          <Collapse in={isOpen}>
            <Box mt={2} pl={4} borderLeft="2px solid" borderColor="gray.200">
              {collapse.content}
            </Box>
          </Collapse>
        </>
      )}
    </Box>
  );
};

export default InformationMessage;
