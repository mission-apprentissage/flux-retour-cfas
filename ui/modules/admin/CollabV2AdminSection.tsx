import {
  Box,
  Button,
  Divider,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { _get, _post } from "@/common/httpClient";
import Tag from "@/components/Tag/Tag";
import { Checkbox, CloseCircle } from "@/theme/components/icons";

type EligibilityCheck = {
  passed: boolean;
  details?: {
    effectifsErpCount?: number;
    natureActuelle?: string | null;
  };
};

type EligibilityResult = {
  eligible: boolean;
  alreadyActive: boolean;
  checks: {
    exists_with_siret_uai: EligibilityCheck;
    nature: EligibilityCheck;
    has_effectifs_erp: EligibilityCheck;
    not_already_active: EligibilityCheck;
  };
  organisme: {
    _id: string;
    siret: string;
    uai: string | null;
    nature?: string;
    is_allowed_collab?: boolean | null;
  } | null;
};

type ActionResult = {
  status: string;
  organismeId?: string;
  error?: string;
};

const BadgeYes = () => <Tag leftIcon={Checkbox} primaryText="Oui" variant="badge" colorScheme="green_tag" size="md" />;
const BadgeNo = () => <Tag leftIcon={CloseCircle} primaryText="Non" variant="badge" colorScheme="red_tag" size="md" />;
const BadgeWarn = () => (
  <Tag leftIcon={CloseCircle} primaryText="Déjà activé" variant="badge" colorScheme="orangesoft_tag" size="md" />
);

function CheckRow({
  label,
  check,
  alreadyActive,
}: {
  label: string;
  check: EligibilityCheck;
  alreadyActive?: boolean;
}) {
  const badge = check.passed ? <BadgeYes /> : alreadyActive ? <BadgeWarn /> : <BadgeNo />;
  return (
    <HStack spacing="1w">
      <Text>{label} :</Text>
      {badge}
    </HStack>
  );
}

type Props = {
  organisme: { _id: string; siret?: string; uai?: string | null; nom?: string; raison_sociale?: string };
};

export default function CollabV2AdminSection({ organisme }: Props) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [action, setAction] = useState<"activate" | "deactivate" | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery<EligibilityResult>(
    ["admin/organismes/collab-v2-eligibility", organisme._id],
    () => _get(`/api/v1/admin/organismes/${organisme._id}/collab-v2-eligibility`),
    { enabled: !!organisme._id }
  );

  const activateMutation = useMutation({
    mutationFn: () =>
      _post<Record<string, never>, ActionResult>(`/api/v1/admin/organismes/${organisme._id}/collab-v2/activate`, {}),
  });
  const deactivateMutation = useMutation({
    mutationFn: () =>
      _post<Record<string, never>, ActionResult>(`/api/v1/admin/organismes/${organisme._id}/collab-v2/deactivate`, {}),
  });

  const checks = data?.checks;
  const eligible = data?.eligible === true;
  const alreadyActive = data?.alreadyActive === true;
  const siret = organisme.siret;
  const uai = organisme.uai;

  const openConfirm = useCallback(
    (next: "activate" | "deactivate") => {
      setAction(next);
      onOpen();
    },
    [onOpen]
  );

  const handleConfirm = useCallback(async () => {
    if (!action) {
      onClose();
      return;
    }
    try {
      const mutation = action === "activate" ? activateMutation : deactivateMutation;
      const result = await mutation.mutateAsync();
      const verb = action === "activate" ? "Activation" : "Désactivation";
      const isOk = ["activated", "already_active", "deactivated"].includes(result?.status ?? "");
      toast({
        title: `${verb} collaboration v2`,
        description: `Statut : ${result?.status ?? "erreur"}`,
        status: isOk ? "success" : "error",
        duration: 5000,
        isClosable: true,
      });
      onClose();
      await refetch();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.json?.data?.message || "Une erreur est survenue",
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    }
  }, [action, activateMutation, deactivateMutation, refetch, toast, onClose]);

  return (
    <>
      <Divider borderColor="#0063CB" opacity={0.3} />
      <Box color="#0063CB" display="flex" alignItems="center">
        <Box as="i" className="ri-team-line" />
        <Text fontSize="zeta" fontWeight="bold" ml="2">
          Collaboration v2 (ERP, sans visibilité DECA)
        </Text>
      </Box>

      <HStack spacing="1w">
        <Text>État :</Text>
        {alreadyActive ? <BadgeYes /> : <BadgeNo />}
      </HStack>

      {!uai && (
        <HStack spacing="1w">
          <Text>UAI :</Text>
          <BadgeNo />
          <Text fontSize="omega" color="grey.700">
            UAI manquant, activation/désactivation impossible
          </Text>
        </HStack>
      )}

      {isLoading ? (
        <HStack>
          <Spinner size="sm" />
          <Text fontSize="omega">Calcul de l&apos;éligibilité…</Text>
        </HStack>
      ) : checks ? (
        <Stack spacing={2}>
          <CheckRow label="Présent en base avec SIRET et UAI" check={checks.exists_with_siret_uai} />
          <HStack spacing="1w">
            <Text>
              Nature « formateur » / « responsable_formateur » (actuelle :{" "}
              <strong>{checks.nature.details?.natureActuelle ?? "—"}</strong>) :
            </Text>
            {checks.nature.passed ? <BadgeYes /> : <BadgeNo />}
          </HStack>
          <HStack spacing="1w">
            <Text>
              Effectifs ERP sur années scolaires actives ({checks.has_effectifs_erp.details?.effectifsErpCount ?? 0}) :
            </Text>
            {checks.has_effectifs_erp.passed ? <BadgeYes /> : <BadgeNo />}
          </HStack>
          <CheckRow label="Pas déjà activé" check={checks.not_already_active} alreadyActive={alreadyActive} />
        </Stack>
      ) : null}

      <HStack>
        {alreadyActive ? (
          <Button
            variant="secondary"
            w="fit-content"
            bg="white"
            onClick={() => openConfirm("deactivate")}
            isDisabled={!siret || !uai || deactivateMutation.isLoading || isFetching}
            isLoading={deactivateMutation.isLoading}
          >
            <Box as="i" className="ri-user-unfollow-line" verticalAlign="middle" mr={2} />
            Désactiver collaboration v2
          </Button>
        ) : (
          <Button
            variant="primary"
            w="fit-content"
            onClick={() => openConfirm("activate")}
            isDisabled={!eligible || !siret || !uai || activateMutation.isLoading || isFetching}
            isLoading={activateMutation.isLoading}
            title={!eligible ? "Tous les critères d'éligibilité doivent être satisfaits" : undefined}
          >
            <Box as="i" className="ri-user-follow-line" verticalAlign="middle" mr={2} />
            Activer collaboration v2
          </Button>
        )}
      </HStack>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent borderRadius="0" p={4}>
          <ModalHeader>
            {action === "activate" ? "Activer collaboration v2" : "Désactiver collaboration v2"}
          </ModalHeader>
          <ModalBody>
            <Text>
              {action === "activate"
                ? `Activer l'interface v2/collaboration pour ${organisme.nom || organisme.raison_sociale || siret} (SIRET ${siret}, UAI ${uai ?? "—"}) ? Le flag is_allowed_collab et la date d'activation ML seront posés. Les effectifs DECA ne seront PAS rendus visibles (is_allowed_deca non posé).`
                : `Désactiver l'interface v2/collaboration pour ${organisme.nom || organisme.raison_sociale || siret} (SIRET ${siret}, UAI ${uai ?? "—"}) ? Le flag is_allowed_collab sera retiré. Si l'organisme est aussi pilote DECA-CFA, la date d'activation ML et la visibilité DECA sont conservées.`}
            </Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              Confirmer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
