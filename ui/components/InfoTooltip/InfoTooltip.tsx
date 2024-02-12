import {
  Popover,
  PopoverTrigger,
  IconButton,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Wrap,
  WrapItem,
  Avatar,
  Flex,
  Text,
  Badge,
  Link,
  Box,
} from "@chakra-ui/react";
import ChakraUIRenderer from "chakra-ui-markdown-renderer";
import React, { memo } from "react";
import ReactMarkdown from "react-markdown";

import { prettyPrintDate } from "@/common/utils/dateUtils";
import { replaceLinks } from "@/common/utils/markdownUtils";
import { ExternalLinkLine, InfoCircle } from "@/theme/components/icons";

// eslint-disable-next-line react/display-name
const InfoTooltip = memo(
  ({ description, descriptionComponent, label, history, customIcon = null, noHistory = true, ...rest }: any) => {
    return (
      <Popover placement="bottom">
        <PopoverTrigger>
          {customIcon ?? (
            <IconButton icon={<InfoCircle color={"grey.700"} w="23px" h="23px" />} aria-label={"tooltip"} />
          )}
        </PopoverTrigger>
        <PopoverContent {...rest}>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader fontWeight="bold">{label}</PopoverHeader>
          <PopoverBody>
            <Box>
              {descriptionComponent}
              {!descriptionComponent &&
                replaceLinks(description).map((part, i) => {
                  return typeof part === "string" ? (
                    <Text as="span" key={i}>
                      <ReactMarkdown components={ChakraUIRenderer()} skipHtml>
                        {part}
                      </ReactMarkdown>
                    </Text>
                  ) : (
                    <Link href={part.href} fontSize="md" key={i} textDecoration={"underline"} isExternal>
                      {part.linkText} <ExternalLinkLine w={"0.75rem"} h={"0.75rem"} mb={"0.125rem"} ml={"0.125rem"} />
                    </Link>
                  );
                })}
            </Box>
          </PopoverBody>
          {history && !noHistory && (
            <>
              <PopoverHeader fontWeight="bold">Historique</PopoverHeader>
              <PopoverBody>
                {history?.map((entry, i) => {
                  return (
                    <Wrap key={i} mb={3}>
                      <WrapItem>
                        <Avatar name={entry.who} size="xs" />
                      </WrapItem>
                      <Flex flexDirection="column">
                        <Flex alignItems="center">
                          <Text textStyle="sm" fontWeight="bold">
                            {entry.who}
                          </Text>
                          <Badge
                            variant="solid"
                            bg="greenmedium.300"
                            borderRadius="16px"
                            color="grey.800"
                            textStyle="sm"
                            px="15px"
                            ml="10px"
                          >
                            {entry.role}
                          </Badge>
                        </Flex>
                        <Text textStyle="xs">{prettyPrintDate(entry.when)}</Text>
                      </Flex>
                      <Text textStyle="sm" mt="0">
                        A modifié(e) la valeur du champ par {entry.to}
                      </Text>
                    </Wrap>
                  );
                })}
              </PopoverBody>
            </>
          )}
        </PopoverContent>
      </Popover>
    );
  }
);

export default InfoTooltip;
