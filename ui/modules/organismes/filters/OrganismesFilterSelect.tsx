import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Badge, Box, Stack, Text } from "@chakra-ui/react";

interface Props {
  label: string;
  badge?: number;
  children: React.ReactNode;
}
function OrganismesFilterSelect(props: Props) {
  const hasFilters = props.badge !== undefined && props.badge > 0;
  return (
    <Accordion allowToggle>
      <AccordionItem borderTopWidth="0" mb={0} borderBottomWidth="0 !important">
        {({ isExpanded }) => (
          <>
            <h2>
              <AccordionButton>
                <Stack direction="row" flex="1" alignItems="center">
                  <Text
                    fontSize="omega"
                    fontWeight={hasFilters ? "bold" : "normal"}
                    color={hasFilters ? "bluefrance" : "var(--chakra-colors-gray-800)"}
                  >
                    {props.label}
                  </Text>
                  {props.badge && (
                    <Badge backgroundColor="openbluefrance" color="bluefrance">
                      {props.badge}
                    </Badge>
                  )}
                </Stack>
                <Box
                  fontSize="epsilon"
                  as="i"
                  className={isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
                  marginLeft="1v"
                  paddingTop="2px"
                  verticalAlign="middle"
                />
              </AccordionButton>
            </h2>
            <AccordionPanel>{props.children}</AccordionPanel>
          </>
        )}
      </AccordionItem>
    </Accordion>
  );
}

export default OrganismesFilterSelect;
