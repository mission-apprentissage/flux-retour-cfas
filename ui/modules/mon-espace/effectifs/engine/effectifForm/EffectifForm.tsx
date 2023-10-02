import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Box, HStack, Text } from "@chakra-ui/react";
import React, { memo, useEffect, useRef, useState } from "react";
import { useRecoilValue } from "recoil";

import { effectifIdAtom } from "@/modules/mon-espace/effectifs/engine/atoms";
import { effectifStateSelector, valuesSelector } from "@/modules/mon-espace/effectifs/engine/formEngine/atoms";
import { ErrorPill } from "@/theme/components/icons/ErrorPill";
import { PlainArrowRight } from "@/theme/components/icons/PlainArrowRight";

import { EffectifApprenant } from "./blocks/apprenant/EffectifApprenant";
import { ApprenantContrats } from "./blocks/contrats/EffectifContrats";
import { EffectifFormation } from "./blocks/formation/EffectifFormation";
import EffectifStatuts from "./blocks/statuts/EffectifStatuts";

const useOpenAccordionToLocation = () => {
  const scrolledRef = useRef(false);
  const { hash } = location;
  const hashRef = useRef(hash);
  const [accordionIndex, setAccordionIndex] = useState<number[]>([]);

  useEffect(() => {
    if (hash) {
      // We want to reset if the hash has changed
      if (hashRef.current !== hash) {
        hashRef.current = hash;
        scrolledRef.current = false;
      }

      // only attempt to scroll if we haven't yet (this could have just reset above if hash changed)
      if (!scrolledRef.current) {
        const id = hash.replace("#", "");

        if (id.startsWith("statuts_")) {
          setAccordionIndex([1]);
        }
      }
    }
  }, [hash]);

  return { accordionIndex, setAccordionIndex };
};

// eslint-disable-next-line react/display-name, @typescript-eslint/no-unused-vars
export const EffectifForm = memo(({ modeSifa = false }: { modeSifa: boolean }) => {
  const { accordionIndex, setAccordionIndex } = useOpenAccordionToLocation();

  const effectifId = useRecoilValue<any>(effectifIdAtom);
  const { validationErrorsByBlock, requiredSifaByBlock } = useRecoilValue<any>(effectifStateSelector(effectifId));
  const values = useRecoilValue<any>(valuesSelector);

  return (
    <Box my={2} px={5}>
      <Accordion
        allowMultiple
        mt={2}
        index={accordionIndex}
        onChange={(expandedIndex: number[]) => setAccordionIndex(expandedIndex)}
        reduceMotion
      >
        <AccordionItem border="none" id={"statuts"}>
          {({ isExpanded }) => (
            <AccordionItemChild
              isExpanded={isExpanded}
              title="Statuts"
              validationErrors={validationErrorsByBlock.statuts}
              requiredSifa={requiredSifaByBlock.statuts}
            >
              <EffectifStatuts values={values} />
            </AccordionItemChild>
          )}
        </AccordionItem>
        <AccordionItem border="none" id={"apprenant"}>
          {({ isExpanded }) => (
            <AccordionItemChild
              isExpanded={isExpanded}
              title={"Apprenant"}
              validationErrors={validationErrorsByBlock.apprenant}
              requiredSifa={requiredSifaByBlock.apprenant}
            >
              <EffectifApprenant apprenant={values?.apprenant} />
            </AccordionItemChild>
          )}
        </AccordionItem>
        <AccordionItem border="none" id={"formation"}>
          {({ isExpanded }) => (
            <AccordionItemChild
              isExpanded={isExpanded}
              title={"Formation"}
              validationErrors={validationErrorsByBlock.formation}
              requiredSifa={requiredSifaByBlock.formation}
            >
              <EffectifFormation />
            </AccordionItemChild>
          )}
        </AccordionItem>
        <AccordionItem border="none" id={"contrats"}>
          {({ isExpanded }) => (
            <AccordionItemChild
              isExpanded={isExpanded}
              title={"Contrat(s)"}
              validationErrors={validationErrorsByBlock.contrats}
              requiredSifa={requiredSifaByBlock.contrats}
            >
              <ApprenantContrats contrats={values?.contrats} />
            </AccordionItemChild>
          )}
        </AccordionItem>
      </Accordion>
    </Box>
  );
});

// eslint-disable-next-line react/display-name
const AccordionItemChild = React.memo(
  ({
    title,
    children,
    validationErrors,
    requiredSifa,
    isExpanded,
  }: {
    title: string;
    children: any;
    validationErrors: any;
    requiredSifa: any;
    isExpanded: boolean;
  }) => {
    return (
      <>
        <AccordionButton bg="#F9F8F6">
          {isExpanded ? (
            <PlainArrowRight boxSize={7} color="bluefrance" transform="rotate(90deg)" />
          ) : (
            <PlainArrowRight boxSize={7} color="bluefrance" />
          )}
          <Box flex="1" textAlign="left">
            <HStack>
              <Text fontWeight="bold">{title}</Text>
              {validationErrors.length && (
                <HStack fontSize="0.8rem">
                  <ErrorPill color="redmarianne" boxSize="2" />
                  <Text color="redmarianne">({Math.round(validationErrors.length)})</Text>
                </HStack>
              )}
              {requiredSifa.length && (
                <HStack fontSize="0.8rem">
                  <ErrorPill color="warning" boxSize="2" />
                  <Text color="warning">({Math.round(requiredSifa.length)})</Text>
                </HStack>
              )}
            </HStack>
          </Box>
        </AccordionButton>
        <AccordionPanel pb={4}>{isExpanded && children}</AccordionPanel>
      </>
    );
  }
);
