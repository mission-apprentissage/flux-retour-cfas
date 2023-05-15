import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box } from "@chakra-ui/react";

interface Props {
  label: string;
  children: React.ReactNode;
}
function IndicateursFilter(props: Props) {
  return (
    <Accordion allowToggle>
      <AccordionItem borderTopWidth="0" borderBottomWidth="0 !important">
        {({ isExpanded }) => (
          <>
            <h2>
              <AccordionButton bg="#F9F8F6">
                <Box as="span" flex="1" textAlign="left">
                  {props.label}
                </Box>
                {isExpanded ? (
                  <MinusIcon fontSize="12px" color="#000091" />
                ) : (
                  <AddIcon fontSize="12px" color="#000091" />
                )}
              </AccordionButton>
            </h2>
            <AccordionPanel>{props.children}</AccordionPanel>
          </>
        )}
      </AccordionItem>
    </Accordion>
  );
}

export default IndicateursFilter;
