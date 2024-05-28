import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  FormLabel,
  Box,
  Divider,
  HStack,
  Text,
  VStack,
  Select,
  FormControl,
  Input,
} from "@chakra-ui/react";
import { UseQueryResult } from "@tanstack/react-query";
import React, { memo, useEffect, useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { EFF_EDITION_ELEMENT_LINK, MOTIF_SUPPRESSION, MOTIF_SUPPRESSION_LABEL, Statut, getStatut } from "shared";

import { _post } from "@/common/httpClient";
import AppButton from "@/components/buttons/Button";
import Link from "@/components/Links/Link";
import { BasicModal } from "@/components/Modals/BasicModal";
import Ribbons from "@/components/Ribbons/Ribbons";
import { effectifIdAtom, effectifFromDecaAtom } from "@/modules/mon-espace/effectifs/engine/atoms";
import { effectifStateSelector, valuesSelector } from "@/modules/mon-espace/effectifs/engine/formEngine/atoms";
import { Trash } from "@/theme/components/icons";
import { ErrorPill } from "@/theme/components/icons/ErrorPill";
import { PlainArrowRight } from "@/theme/components/icons/PlainArrowRight";

import { EffectifApprenant } from "./blocks/apprenant/EffectifApprenant";
import { ApprenantContrats } from "./blocks/contrats/EffectifContrats";
import { EffectifFormation } from "./blocks/formation/EffectifFormation";

const SuppressionEffectifComponent = ({ nom, prenom, id, refetch }) => {
  const [successDeletion, setSuccessDeletion] = useState<"SUCCES" | "ERREUR" | null>(null);
  const [selectedDeletionReason, setSelectedDeletionReason] = useState(null);
  const [deletionOtherReason, setDeletionOtherReason] = useState("");

  const deleteEffectif = async () => {
    try {
      await _post(`/api/v1/effectif/${id}/delete`, {
        motif: selectedDeletionReason,
        description: selectedDeletionReason === MOTIF_SUPPRESSION.Autre ? deletionOtherReason : null,
      });
      setSuccessDeletion("SUCCES");
    } catch (e) {
      setSuccessDeletion("ERREUR");
    }
  };

  const checkModalButtonEnabled = () => {
    if (!selectedDeletionReason) {
      return false;
    }
    switch (selectedDeletionReason) {
      case MOTIF_SUPPRESSION.MauvaiseManip:
      case MOTIF_SUPPRESSION.Autre:
        return !!deletionOtherReason && deletionOtherReason.trim().length;
      default:
        return true;
    }
  };

  return (
    <Box>
      <BasicModal
        triggerType="link"
        button={
          <AppButton color="#CE0500" borderColor="#CE0500" leftIcon={<Trash height={4} width={4} />} action={() => {}}>
            <Text>Supprimer l&apos;apprenant</Text>
          </AppButton>
        }
        title={`Supprimer l'apprenant(e) ${prenom} ${nom}`}
        size="6xl"
        handleClose={() => successDeletion === "SUCCES" && refetch()}
      >
        {!successDeletion && (
          <Box>
            <Ribbons variant="info" mb={4}>
              <Text color="#3A3A3A">
                Veuillez noter que si vous transmettez via ERP ou si vous téléversez un fichier Excel avec ce même
                apprenant, il apparaîtra à nouveau sur votre espace Tableau de bord.
              </Text>
            </Ribbons>
            <FormControl isRequired onChange={(e: any) => setSelectedDeletionReason(e.target.value)}>
              <FormLabel>Motif de supppression</FormLabel>
              <Select>
                <option selected hidden disabled value="">
                  Sélectionnez une option
                </option>
                {MOTIF_SUPPRESSION_LABEL.map(({ id, label }) => (
                  <option value={id} key={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormControl>
            {(selectedDeletionReason === MOTIF_SUPPRESSION.Autre ||
              selectedDeletionReason === MOTIF_SUPPRESSION.MauvaiseManip) && (
              <FormControl isRequired mt={5}>
                <FormLabel>Veuillez préciser la raison</FormLabel>
                <Input onChange={(e) => setDeletionOtherReason(e.target.value)} placeholder="Votre texte ici"></Input>
              </FormControl>
            )}

            <Box mt={5} flexFlow="row-reverse" display="flex">
              <AppButton
                variant="primary"
                leftIcon={<Trash height={4} width={4} />}
                action={deleteEffectif}
                isDisabled={!checkModalButtonEnabled()}
              >
                <Text>Supprimer l&apos;apprenant(e)</Text>
              </AppButton>
            </Box>
          </Box>
        )}
        {successDeletion === "SUCCES" && (
          <Box>
            <Ribbons variant="success">
              <Text fontWeight="bold" color="#3A3A3A" fontSize="21px" mb={2}>
                L&apos;apprenant(e) a été supprimé(e) avec succès.
              </Text>
              <Text color="#3A3A3A">
                Veuillez noter que si vous transmettez via ERP ou si vous téléversez un fichier Excel avec ce même
                apprenant, il apparaîtra à nouveau sur votre espace Tableau de bord.
              </Text>
            </Ribbons>
          </Box>
        )}
        {successDeletion === "ERREUR" && (
          <Box>
            <Ribbons variant="error">
              <Text fontWeight="bold" color="#3A3A3A" fontSize="21px" mb={2}>
                La suppression de l&apos;apprenant(e) a échoué.
              </Text>
              <Text color="#3A3A3A">
                Veuillez{" "}
                <Link variant="link" color="bluefrance" href={EFF_EDITION_ELEMENT_LINK} isExternal>
                  contacter
                </Link>{" "}
                l&apos;équipe du Tableau de bord de l&apos;apprentissage.
              </Text>
            </Ribbons>
          </Box>
        )}
      </BasicModal>{" "}
    </Box>
  );
};

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
  ({
    modeSifa = false,
    parcours,
    refetch,
  }: {
    modeSifa: boolean;
    parcours: Statut["parcours"];
    refetch: (options: { throwOnError: boolean; cancelRefetch: boolean }) => Promise<UseQueryResult>;
  }) => {
    const { accordionIndex, setAccordionIndex } = useOpenAccordionToLocation();

    const effectifId = useRecoilValue<any>(effectifIdAtom);
    const fromDECA = useRecoilValue<any>(effectifFromDecaAtom);
    const { validationErrorsByBlock, requiredSifaByBlock } = useRecoilValue<any>(effectifStateSelector(effectifId));
    const values = useRecoilValue<any>(valuesSelector);

    const sortedParcours = [...parcours].reverse();
    const currentStatus = sortedParcours[0];
    const historyStatus = sortedParcours.slice(1);

    return (
      <Box my={2} px={5}>
        {!fromDECA && (
          <SuppressionEffectifComponent
            nom={values?.apprenant.nom}
            prenom={values?.apprenant.prenom}
            id={effectifId}
            refetch={refetch}
          />
        )}
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
