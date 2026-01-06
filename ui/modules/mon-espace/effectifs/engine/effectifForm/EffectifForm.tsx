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

import { prettyPrintDate } from "@/common/utils/dateUtils";
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

// eslint-disable-next-line react/display-name
export const EffectifForm = memo(
  ({ parcours, transmissionDate }: { parcours: Statut["parcours"]; transmissionDate: Date | null }) => {
    const { accordionIndex, setAccordionIndex } = useOpenAccordionToLocation();

    const effectifId = useRecoilValue<any>(effectifIdAtom);
    const { validationErrorsByBlock } = useRecoilValue<any>(effectifStateSelector(effectifId));
    const values = useRecoilValue<any>(valuesSelector);
    const sortedParcours = [...parcours].reverse();
    const currentStatus = sortedParcours[0];
    const historyStatus = sortedParcours.slice(1);
    const computeTransmissionDate = (d: Date | null) => {
      return d ? prettyPrintDate(d) : "plus de 2 semaines";
    };
    return (
      <Box>
        <Text>Date de dernière mise à jour : {computeTransmissionDate(transmissionDate)}</Text>
        <Box borderWidth="2px" borderStyle="solid" borderColor="#E3E3FD" p={2} mt={3}>
          <Accordion
            allowMultiple
            index={accordionIndex}
            onChange={(expandedIndex: number[]) => setAccordionIndex(expandedIndex)}
            reduceMotion
          >
            <AccordionItem border="none" id={"statuts"} mb={2}>
              {({ isExpanded }) => (
                <AccordionItemChild
                  isExpanded={isExpanded}
                  title="Statuts"
                  validationErrors={validationErrorsByBlock.statuts}
                >
                  <VStack align="stretch" spacing={4} px={2} py={3}>
                    {parcours.length > 0 ? (
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
            <AccordionItem border="none" id={"apprenant"} mb={2}>
              {({ isExpanded }) => (
                <AccordionItemChild
                  isExpanded={isExpanded}
                  title={"Apprenant"}
                  validationErrors={validationErrorsByBlock.apprenant}
                >
                  <EffectifApprenant apprenant={values?.apprenant} />
                </AccordionItemChild>
              )}
            </AccordionItem>
            <AccordionItem border="none" id={"formation"} mb={2}>
              {({ isExpanded }) => (
                <AccordionItemChild
                  isExpanded={isExpanded}
                  title={"Formation"}
                  validationErrors={validationErrorsByBlock.formation}
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
                >
                  <ApprenantContrats contrats={values?.contrats} />
                </AccordionItemChild>
              )}
            </AccordionItem>
          </Accordion>
        </Box>
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
    isExpanded,
  }: {
    title: string;
    children: any;
    validationErrors: any;
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
            </HStack>
          </Box>
        </AccordionButton>
        <AccordionPanel pb={4}>{isExpanded && children}</AccordionPanel>
      </>
    );
  }
);
