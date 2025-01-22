import { Box, HStack, Text, Heading, Select, Textarea, Radio, RadioGroup, Flex, Input } from "@chakra-ui/react";
import debounce from "lodash.debounce";
import React, { useState, useEffect, useCallback } from "react";
import {
  IMissionLocaleEffectif,
  INSCRIPTION_FRANCE_TRAVAIL,
  STATUT_JEUNE_MISSION_LOCALE,
  SITUATION_ENUM,
} from "shared";

import { _post } from "@/common/httpClient";
import useToaster from "@/hooks/useToaster";

interface ApprenantsDetailsFormProps {
  effectifId: string;
  situationData: IMissionLocaleEffectif;
  updateSituationState: (effectifId: string, newSituation: { [key: string]: string | boolean | null }) => void;
}

const MAX_CHARACTERS = 200;

const _SITUATION_LABELS: Record<SITUATION_ENUM, string> = {
  [SITUATION_ENUM.CONTACTE_AVEC_SUIVI]: "contacté avec suivi",
  [SITUATION_ENUM.CONTACT_SANS_SUIVI]: "contacté sans suivi",
  [SITUATION_ENUM.DEJA_SUIVI]: "déjà accompagné par la Mission Locale",
  [SITUATION_ENUM.INJOIGNABLE]: "injoignable",
  [SITUATION_ENUM.NON_CONTACTE]: "non contacté",
};

const ApprenantsDetailsForm: React.FC<ApprenantsDetailsFormProps> = ({
  effectifId,
  situationData,
  updateSituationState,
}) => {
  const { toastError } = useToaster();

  const initialStatutCorrect =
    situationData.statut_correct !== undefined ? (situationData.statut_correct ? "true" : "false") : undefined;

  const [formState, setFormState] = useState<any>({
    ...situationData,
    statut_correct: initialStatutCorrect,
    statut_reel: situationData.statut_reel || "",
    statut_reel_text: situationData.statut_reel_text || "",
  });

  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [apprenantStatut, setApprenantStatut] = useState(situationData.statut_correct === false);

  useEffect(() => {
    setFormState({
      ...situationData,
      statut_correct: initialStatutCorrect,
      statut_reel: situationData.statut_reel || "",
      statut_reel_text: situationData.statut_reel_text || "",
    });
  }, [situationData]);

  const saveChanges = async (name: string, value: string | boolean | null) => {
    setStatus("saving");

    try {
      let payloadValue: string | boolean | null = value;
      if (name === "statut_correct") {
        payloadValue = value === "true";
      }

      const payload: Record<string, string | boolean | null> = {
        effectif_id: effectifId,
        [name]: payloadValue,
      };

      if (name === "statut_correct" && value === "true") {
        payload.statut_reel = null;
        payload.statut_reel_text = "";
      }

      if (name === "statut_reel" && value !== STATUT_JEUNE_MISSION_LOCALE.AUTRE) {
        payload.statut_reel_text = "";
      }

      await _post("/api/v1/organisation/mission-locale/effectif", payload);

      updateSituationState(effectifId, {
        [name]: payloadValue,
        ...(name === "statut_correct" && value === "true" ? { statut_reel: null, statut_reel_text: "" } : {}),
        ...(name === "statut_reel" && value !== STATUT_JEUNE_MISSION_LOCALE.AUTRE ? { statut_reel_text: "" } : {}),
      });

      setFormState((prev) => ({
        ...prev,
        [name]: payloadValue,
        ...(name === "statut_correct" && value === "true" ? { statut_reel: null, statut_reel_text: "" } : {}),
        ...(name === "statut_reel" && value !== STATUT_JEUNE_MISSION_LOCALE.AUTRE ? { statut_reel_text: "" } : {}),
      }));

      if (name === "statut_correct") {
        setApprenantStatut(value === "false");
      }

      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("Erreur de mise à jour :", error);
      toastError("Impossible de mettre à jour la situation de l'apprenant. Veuillez réessayer.");
      setStatus("idle");
    }
  };

  const saveChangesDebounced = useCallback(debounce(saveChanges, 500), []);

  const handleChange = (value: string, name: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
    saveChangesDebounced(name, value);
  };

  return (
    <Box p={6} flex="1" maxW="600px" mx="auto" bg="#F9F8F6">
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading as="h3" color="gray.900" fontSize="gamma" fontWeight="700">
          Vos commentaires et retours
        </Heading>
        {status === "saving" ? (
          <Text color="blue.500">Enregistrement...</Text>
        ) : status === "saved" ? (
          <Text color="green.500">Enregistré</Text>
        ) : null}
      </Flex>

      {situationData.situation_updated_at && (
        <Text as="span" fontWeight="bold" color="bluefrance" mb={4}>
          Il a été indiqué que le jeune a été{" "}
          {situationData.situation && _SITUATION_LABELS[situationData.situation]
            ? `${_SITUATION_LABELS[situationData.situation]}`
            : "contacté"}{" "}
          le {new Date(situationData.situation_updated_at).toLocaleDateString("fr-FR")}.
        </Text>
      )}

      <Box my={4}>
        <Text fontSize="md" mb={3}>
          1. Le statut du jeune affiché est-il correct ?
        </Text>
        <RadioGroup
          name="statut_correct"
          onChange={(value) => handleChange(value, "statut_correct")}
          value={formState.statut_correct}
        >
          <HStack spacing={4}>
            <Radio value="true">Oui</Radio>
            <Radio value="false">Non</Radio>
          </HStack>
        </RadioGroup>

        {apprenantStatut && (
          <>
            <Text fontSize="sm" mt={4} mb={2}>
              Veuillez préciser son statut actuel.
            </Text>
            <Select
              name="statut_reel"
              placeholder="Sélectionner une option"
              onChange={(e) => handleChange(e.target.value, "statut_reel")}
              value={formState.statut_reel}
            >
              <option value={STATUT_JEUNE_MISSION_LOCALE.CONTRAT_SIGNE_NON_DEMARRE}>Contrat signé non démarré</option>
              <option value={STATUT_JEUNE_MISSION_LOCALE.RETOUR_EN_VOIE_SCOLAIRE}>
                Retour en voie scolaire initiale
              </option>
              <option value={STATUT_JEUNE_MISSION_LOCALE.ABANDON}>Abandon de la formation</option>
              <option value={STATUT_JEUNE_MISSION_LOCALE.RUPTURE}>Rupture de contrat d’apprentissage</option>
              <option value={STATUT_JEUNE_MISSION_LOCALE.DECROCHAGE}>Décrochage (abandon)</option>
              <option value={STATUT_JEUNE_MISSION_LOCALE.AUTRE}>Autre raison</option>
            </Select>

            {formState.statut_reel === STATUT_JEUNE_MISSION_LOCALE.AUTRE && (
              <Input
                mt={2}
                placeholder="Précisez la raison"
                name="statut_reel_text"
                value={formState.statut_reel_text || ""}
                onChange={(e) => handleChange(e.target.value, "statut_reel_text")}
              />
            )}
          </>
        )}
      </Box>

      <Box mb={6}>
        <Text fontSize="md" mb={3}>
          2. Le jeune est-il inscrit à France Travail ?
        </Text>
        <RadioGroup
          name="inscrit_france_travail"
          onChange={(value) => handleChange(value, "inscrit_france_travail")}
          value={formState.inscrit_france_travail || ""}
        >
          <HStack spacing={4}>
            <Radio value={INSCRIPTION_FRANCE_TRAVAIL.OUI}>Oui</Radio>
            <Radio value={INSCRIPTION_FRANCE_TRAVAIL.NON}>Non</Radio>
            <Radio value={INSCRIPTION_FRANCE_TRAVAIL.INCONNU}>Je ne sais pas</Radio>
          </HStack>
        </RadioGroup>
      </Box>

      <Box mb={6}>
        <Text fontSize="md" mb={3}>
          3. Notez ici des informations recueillies auprès du jeune et sa situation, que vous jugez utiles de partager.
        </Text>

        <Box>
          <Textarea
            name="commentaires"
            placeholder="Vos retours sur l’accompagnement du jeune"
            maxLength={MAX_CHARACTERS}
            onChange={(e) => handleChange(e.target.value, "commentaires")}
            value={formState.commentaires || ""}
          />
          <Flex justify="flex-end" mt={1}>
            <Text fontSize="sm" color="gray.500">
              {formState.commentaires ? formState.commentaires.length : 0}/{MAX_CHARACTERS}
            </Text>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};

export default ApprenantsDetailsForm;
