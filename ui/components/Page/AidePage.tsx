import { Box, Heading, Flex, Divider, Button, Text, Link as ChakraLink } from "@chakra-ui/react";
import React, { ReactNode } from "react";

import { BonusAvatar, DocumentFile, InformationAvatar } from "@/theme/components/icons";
import DownloadSimple from "@/theme/components/icons/DownloadSimple";

import InformationMessage from "../InformationMessage/InformationMessage";
import Link from "../Links/Link";
import { BasicModal } from "../Modals/BasicModal";
import Ribbons from "../Ribbons/Ribbons";
import Tag from "../Tag/Tag";

interface AidePageProps {
  children: ReactNode;
}

interface AidePageContainerProps {
  children: ReactNode;
  sidebarContent?: ReactNode;
}

interface AidePageResponsibilityProps {
  dataResponsibilityText: string;
  dataResponsibilityLink: string;
  modificationText: string;
  modificationLink: string;
  onDataResponsibilityClick?: () => void;
  onModificationClick?: () => void;
}

interface AidePageRibbonProps {
  title: string;
  content: ReactNode;
  modalTitle?: string;
  modalContent?: ReactNode;
}

interface AidePageSidebarProps {
  title: string;
  children: ReactNode;
}

interface AidePageFileCardProps {
  category: string;
  title: string;
  description: string;
  fileType: string;
  fileSize: string;
  downloadLink: string;
  onClick?: () => void;
}

interface AidePageButtonProps {
  buttonText: string;
  [key: string]: any;
}

interface AidePageModalButtonProps {
  modalTitle: string;
  modalContent: ReactNode;
  [key: string]: any;
}

interface AideLinkProps {
  children: ReactNode;
  href: string;
  [key: string]: any;
}

const AidePage = ({ children }: AidePageProps) => <Flex flexDirection="column">{children}</Flex>;

const AidePageTitle = ({ children }: { children: ReactNode }) => (
  <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700" my={6}>
    {children}
  </Heading>
);

const AidePageHeader = ({ children, sidebarContent }: AidePageContainerProps) => (
  <Flex gap={12}>
    <Box flex="3" lineHeight={1.6}>
      {children}
      <Divider mt={8} mb={6} />
    </Box>
    <Box flex="1">{sidebarContent}</Box>
  </Flex>
);

const AidePageContainer = ({ children, sidebarContent }: AidePageContainerProps) => (
  <Flex gap={12}>
    <Box flex="3">{children}</Box>
    <Box flex="1">{sidebarContent}</Box>
  </Flex>
);

const AidePageDataResponsibility = ({
  dataResponsibilityText,
  dataResponsibilityLink,
  modificationText,
  modificationLink,
  onDataResponsibilityClick,
  onModificationClick,
}: AidePageResponsibilityProps) => (
  <Flex justify="space-between" align="center" my={4}>
    <Flex align="center" gap={4}>
      Responsable de la donnée :
      <ChakraLink
        href={dataResponsibilityLink}
        isExternal
        _hover={{ textDecoration: "none" }}
        onClick={onDataResponsibilityClick}
      >
        <Tag colorScheme="bluelight_tag" primaryText={dataResponsibilityText} rounded="full" isLink />
      </ChakraLink>{" "}
    </Flex>
    <Flex align="center" gap={4}>
      Modification de la donnée :
      <ChakraLink href={modificationLink} isExternal _hover={{ textDecoration: "none" }} onClick={onModificationClick}>
        <Tag colorScheme="bluelight_tag" primaryText={modificationText} rounded="full" isLink />
      </ChakraLink>
    </Flex>
  </Flex>
);

const AidePageRibbon = ({ title, content, modalTitle, modalContent }: AidePageRibbonProps) => (
  <Ribbons variant="info" my={6}>
    <Text color="#3A3A3A" fontSize="gamma" fontWeight="bold">
      {title}
    </Text>
    <Text color="grey.800" my={2}>
      {content}
    </Text>
    {modalTitle && modalContent && (
      <AidePageModalButton buttonText="Voir un exemple" modalTitle={modalTitle} modalContent={modalContent} />
    )}
  </Ribbons>
);

const AidePageSidebarInfos = ({ title, children }: AidePageSidebarProps) => (
  <InformationMessage
    title={title}
    titleColor="#6E445A"
    backgroundColor="#FEE7FC"
    icon={<BonusAvatar width={10} height={10} />}
  >
    {children}
  </InformationMessage>
);

const AidePageSidebarTips = ({ title, children }: AidePageSidebarProps) => (
  <InformationMessage
    title={title}
    titleColor="#0063CB"
    backgroundColor="#E8EDFF"
    icon={<InformationAvatar width={10} height={10} />}
  >
    {children}
  </InformationMessage>
);

const AidePageButton = ({ buttonText, ...props }: AidePageButtonProps) => (
  <Button variant="link" fontSize="md" borderBottom="1px" borderRadius="0" p="0" width="fit-content" {...props}>
    <Box as="i" className="ri-zoom-in-fill" color="bluefrance" mt="-0.125rem" mr="2" />
    {buttonText}
  </Button>
);

const AidePageModalButton = ({ buttonText, modalTitle, modalContent, ...props }: AidePageModalButtonProps) => (
  <BasicModal
    renderTrigger={(onOpen) => <AidePageButton onClick={onOpen} buttonText={buttonText} />}
    title={modalTitle}
    size="4xl"
    {...props}
  >
    {modalContent}
  </BasicModal>
);

const AidePageLink = ({ href, children, ...props }: AideLinkProps) => {
  const isExternal = href.startsWith("https") || props.isExternal;

  return (
    <Link href={href} isExternal={isExternal} isUnderlined display="inline" {...props}>
      {children}
    </Link>
  );
};

const AidePageFileCard = ({
  category,
  title,
  description,
  fileType,
  fileSize,
  downloadLink,
  onClick,
}: AidePageFileCardProps) => {
  return (
    <Link href={downloadLink} isExternal width="37%" _hover={{ textDecoration: "none" }} onClick={onClick}>
      <Flex
        borderWidth="1px"
        borderBottomWidth="3px"
        borderBottomColor="bluefrance"
        p={4}
        bg="white"
        textDecoration="none"
        _hover={{ bg: "gray.100" }}
        cursor="pointer"
      >
        <Flex align="start" mb={2}>
          <DocumentFile boxSize={12} mr={3} />
        </Flex>
        <Flex direction="column" justify="flex-start" align="start" mb={2} p={2}>
          <Tag backgroundColor="#FEE7FC" color="#6E445A" fontWeight="bold" primaryText={category} size="md" />
          <Text fontWeight="bold" fontSize="lg" my={2} color="bluefrance">
            {title}
          </Text>
          <Text mb={2}>{description}</Text>
          <Flex width="100%" justify="space-between" align="center" color="grey.600" fontSize="sm">
            <Text>
              {fileType} - {fileSize}
            </Text>
            <DownloadSimple color="bluefrance" boxSize={4} />
          </Flex>
        </Flex>
      </Flex>
    </Link>
  );
};

AidePage.displayName = "AidePage";
AidePageTitle.displayName = "AidePage.Title";
AidePageHeader.displayName = "AidePage.Header";
AidePageContainer.displayName = "AidePage.Container";
AidePageDataResponsibility.displayName = "AidePage.DataResponsibility";
AidePageRibbon.displayName = "AidePage.Ribbon";
AidePageSidebarInfos.displayName = "AidePage.SidebarInfos";
AidePageSidebarTips.displayName = "AidePage.SidebarTips";
AidePageFileCard.displayName = "AidePage.FileCard";
AidePageButton.displayName = "AidePage.Button";
AidePageModalButton.displayName = "AidePage.ModalButton";
AidePageLink.displayName = "AidePage.Link";

AidePage.Title = AidePageTitle;
AidePage.Header = AidePageHeader;
AidePage.Container = AidePageContainer;
AidePage.DataResponsibility = AidePageDataResponsibility;
AidePage.Ribbon = AidePageRibbon;
AidePage.SidebarInfos = AidePageSidebarInfos;
AidePage.SidebarTips = AidePageSidebarTips;
AidePage.FileCard = AidePageFileCard;
AidePage.Button = AidePageButton;
AidePage.ModalButton = AidePageModalButton;
AidePage.Link = AidePageLink;

export default AidePage;
