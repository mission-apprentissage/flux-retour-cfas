import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Divider,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import React, { memo, useEffect, useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { Statut, getStatut } from "shared";

import { effectifIdAtom } from "@/modules/mon-espace/effectifs/engine/atoms";
import { effectifStateSelector, valuesSelector } from "@/modules/mon-espace/effectifs/engine/formEngine/atoms";
import { ErrorPill } from "@/theme/components/icons/ErrorPill";
import { PlainArrowRight } from "@/theme/components/icons/PlainArrowRight";

import { EffectifApprenant } from "./blocks/apprenant/EffectifApprenant";
import { ApprenantContrats } from "./blocks/contrats/EffectifContrats";
import { EffectifFormation } from "./blocks/formation/EffectifFormation";

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
export const EffectifForm = memo(
  ({ modeSifa = false, parcours }: { modeSifa: boolean; parcours: Statut["parcours"] }) => {
    const { accordionIndex, setAccordionIndex } = useOpenAccordionToLocation();

    const effectifId = useRecoilValue<any>(effectifIdAtom);
    const { validationErrorsByBlock, requiredSifaByBlock } = useRecoilValue<any>(effectifStateSelector(effectifId));
    const values = useRecoilValue<any>(valuesSelector);

    const sortedParcours = [...parcours].reverse();
    const currentStatus = sortedParcours[0];
    const historyStatus = sortedParcours.slice(1);

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
                <VStack align="stretch" spacing={4} px={2} py={3}>
                  {parcours.length > 1 ? (
                    <>
                      <HStack justifyContent="space-between">
                        <Text fontSize={14}>Statut actuel</Text>
                        <Text fontSize={14} fontWeight="semibold">
                          {getStatut(currentStatus.valeur)}
                        </Text>
                      </HStack>
                      <HStack justifyContent="space-between">
                        <Text fontSize={14}>Date de déclaration du statut</Text>
                        <Text fontSize={14} fontWeight="semibold">
                          {new Date(currentStatus.date).toLocaleDateString()}
                        </Text>
                      </HStack>
                      <Divider my={4} />
                      <VStack align="stretch">
                        <Text fontSize={14} mb={2}>
                          Anciens statuts
                        </Text>
                        {historyStatus.map((status, idx) => (
                          <HStack key={idx} justifyContent="space-start">
                            <Text fontSize={14} fontWeight="semibold">
                              {getStatut(status.valeur)} déclaré le {new Date(status.date).toLocaleDateString()}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    </>
                  ) : (
                    <HStack justifyContent="space-between">
                      <Text fontSize={14}>Statut actuel</Text>
                      <Text fontSize={14} fontWeight="semibold">
                        Aucun statut
                      </Text>
                    </HStack>
                  )}
                </VStack>
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
                <EffectifApprenant apprenant={values?.apprenant} modeSifa={modeSifa} />
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
  }
);

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
