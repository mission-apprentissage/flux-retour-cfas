import {
  Accordion as ChakraAccordion,
  AccordionItem as ChakraAccordionItem,
  AccordionButton as ChakraAccordionButton,
  Box,
  Collapse,
} from "@chakra-ui/react";
import React, { createContext, useContext, ReactNode, useState } from "react";

interface AccordionContextProps {
  activeItems: string[];
  toggleItem: (value: string) => void;
  collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextProps | undefined>(undefined);

interface CustomAccordionProps {
  collapsible?: boolean;
  defaultValue?: string[];
  children: ReactNode;
  allowMultiple?: boolean;
  [key: string]: any;
}

const CustomAccordion = ({
  collapsible = false,
  defaultValue = [],
  children,
  allowMultiple = true,
  ...props
}: CustomAccordionProps) => {
  const [activeItems, setActiveItems] = useState<string[]>(defaultValue);

  const toggleItem = (value: string) => {
    setActiveItems((prev) =>
      collapsible || allowMultiple
        ? prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value]
        : prev[0] === value
          ? []
          : [value]
    );
  };

  return (
    <AccordionContext.Provider value={{ activeItems, toggleItem, collapsible }}>
      <ChakraAccordion allowMultiple={allowMultiple} borderBottom={0} {...props}>
        {children}
      </ChakraAccordion>
    </AccordionContext.Provider>
  );
};

interface CustomAccordionItemProps {
  value: string;
  children: ReactNode;
  [key: string]: any;
}

const CustomAccordionItem = ({ value, children, ...props }: CustomAccordionItemProps) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error("CustomAccordionItem must be used within a CustomAccordion");

  const isActive = context.activeItems.includes(value);

  return (
    <ChakraAccordionItem my={2} borderTop={0} borderBottom={0} {...props}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child as React.ReactElement, { value, isActive }) : child
      )}
    </ChakraAccordionItem>
  );
};

interface CustomAccordionTriggerProps {
  children: ReactNode | ((props: { isExpanded: boolean }) => ReactNode);
  value?: string;
  isActive?: boolean;
  [key: string]: any;
}

const CustomAccordionTrigger = ({ children, value, ...props }: CustomAccordionTriggerProps) => {
  const context = useContext(AccordionContext);
  if (!context || !value) throw new Error("CustomAccordionTrigger must be used within a CustomAccordionItem");

  const isExpanded = context.activeItems.includes(value);

  return (
    <ChakraAccordionButton onClick={() => context.toggleItem(value)} {...props}>
      {typeof children === "function" ? children({ isExpanded }) : children}
    </ChakraAccordionButton>
  );
};

interface CustomAccordionContentProps {
  children: ReactNode;
  isActive?: boolean;
  [key: string]: any;
}

const CustomAccordionContent = ({ children, isActive, ...props }: CustomAccordionContentProps) => {
  return (
    <Collapse in={isActive} animateOpacity>
      <Box {...props}>{children}</Box>
    </Collapse>
  );
};

CustomAccordion.Item = CustomAccordionItem;
CustomAccordion.Trigger = CustomAccordionTrigger;
CustomAccordion.Content = CustomAccordionContent;

export { CustomAccordion };
