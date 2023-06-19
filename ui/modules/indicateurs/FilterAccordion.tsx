import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Stack, Text } from "@chakra-ui/react";

import RoundedBadge from "@/components/RoundedBadge/RoundedBadge";

interface Props {
  label: string;
  badge?: number;
  children: React.ReactNode;
}
function IndicateursFilter(props: Props) {
  const hasFilters = props.badge !== undefined && props.badge > 0;
  return (
    <Accordion allowToggle>
      <AccordionItem borderTopWidth="0" mb={0} borderBottomWidth="0 !important">
        {({ isExpanded }) => (
          <>
            <h2>
              <AccordionButton bg="#F9F8F6">
                <Stack direction="row" flex="1">
                  <Text
                    fontWeight={hasFilters ? "bold" : "normal"}
                    color={hasFilters ? "bluefrance" : "var(--chakra-colors-gray-800)"}
                  >
                    {props.label}
                  </Text>
                  {props.badge && <RoundedBadge value={props.badge} />}
                </Stack>
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
