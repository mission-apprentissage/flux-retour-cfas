import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import {
  Accordion as ChakraAccordion,
  AccordionItem as ChakraAccordionItem,
  AccordionButton as ChakraAccordionButton,
  AccordionPanel as ChakraAccordionPanel,
  AccordionIcon as ChakraAccordionIcon,
  Box,
  Flex,
  AccordionIcon,
} from "@chakra-ui/react";
import React, { useState, ReactNode, useEffect, ReactElement } from "react";

interface CustomAccordionItemProps {
  title: string | JSX.Element;
  children: ReactNode;
  useCustomIcons?: boolean;
  [key: string]: any;
}

interface CustomAccordionProps {
  children: ReactElement<CustomAccordionItemProps>[];
  defaultIndex?: number | number[];
  allowMultiple?: boolean;
  useCustomIcons?: boolean;
  [key: string]: any;
}

const Accordion = ({
  children,
  defaultIndex,
  allowMultiple = false,
  useCustomIcons = false,
  ...props
}: CustomAccordionProps) => {
  const [indexArray, setIndexArray] = useState<number[]>([]);

  useEffect(() => {
    if (defaultIndex !== undefined) {
      setIndexArray(Array.isArray(defaultIndex) ? defaultIndex : [defaultIndex]);
    }
  }, [defaultIndex]);

  return (
    <Flex flexDirection="column" marginTop="2w">
      <ChakraAccordion
        index={indexArray}
        onChange={(expandedIndex) => setIndexArray(Array.isArray(expandedIndex) ? expandedIndex : [expandedIndex])}
        allowMultiple={allowMultiple}
        {...props}
      >
        {React.Children.map(children, (child) =>
          React.isValidElement(child) ? React.cloneElement(child, { useCustomIcons }) : child
        )}
      </ChakraAccordion>
    </Flex>
  );
};

const AccordionItem = ({ title, children, useCustomIcons = false, ...props }: CustomAccordionItemProps) => {
  return (
    <ChakraAccordionItem {...props}>
      {({ isExpanded }) => (
        <>
          <Box>
            <ChakraAccordionButton py={4}>
              <Box flex="1" textAlign="left" fontWeight="bold" fontSize="epsilon" pr={12}>
                {title}
              </Box>
              {useCustomIcons ? (
                isExpanded ? (
                  <MinusIcon fontSize="12px" />
                ) : (
                  <AddIcon fontSize="12px" />
                )
              ) : (
                <AccordionIcon />
              )}
            </ChakraAccordionButton>
          </Box>
          <ChakraAccordionPanel pb={12} pt={4} fontSize="epsilon">
            <Flex direction="column" gap={4}>
              {children}
            </Flex>
          </ChakraAccordionPanel>
        </>
      )}
    </ChakraAccordionItem>
  );
};

Accordion.Item = AccordionItem;
Accordion.Button = ChakraAccordionButton;
Accordion.Panel = ChakraAccordionPanel;
Accordion.Icon = ChakraAccordionIcon;

export default Accordion;
