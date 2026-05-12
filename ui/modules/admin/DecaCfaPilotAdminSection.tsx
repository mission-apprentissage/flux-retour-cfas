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
    effectifsDecaCount?: number;
    formateursTiersCount?: number;
    natureActuelle?: string | null;
  };
};

type EligibilityResult = {
  eligible: boolean;
  alreadyActive: boolean;
  checks: {
    exists_with_siret_uai: EligibilityCheck;
    nature: EligibilityCheck;
    no_formateurs_tiers: EligibilityCheck;
    has_effectifs: EligibilityCheck;
    not_already_active: EligibilityCheck;
  };
  organisme: {
    _id: string;
    siret: string;
    uai: string | null;
    nature?: string;
    is_allowed_deca?: boolean | null;
  } | null;
};

type BatchResult = {
  total: number;
  counts: Record<string, number>;
  items: Array<{ input: { siret: string; uai: string }; status: string; error?: string }>;
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

export default function DecaCfaPilotAdminSection({ organisme }: Props) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [action, setAction] = useState<"activate" | "deactivate" | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery<EligibilityResult>(
    ["admin/organismes/deca-cfa-pilot-eligibility", organisme._id],
    () => _get(`/api/v1/admin/organismes/${organisme._id}/deca-cfa-pilot-eligibility`),
    { enabled: !!organisme._id }
  );

  const activateMutation = useMutation({
    mutationFn: (items: Array<{ siret: string; uai: string }>) =>
      _post<{ items: Array<{ siret: string; uai: string }> }, BatchResult>(
        "/api/v1/admin/organismes/deca-cfa-pilot/activate",
        { items }
      ),
  });
  const deactivateMutation = useMutation({
    mutationFn: (items: Array<{ siret: string; uai: string }>) =>
      _post<{ items: Array<{ siret: string; uai: string }> }, BatchResult>(
        "/api/v1/admin/organismes/deca-cfa-pilot/deactivate",
        { items }
      ),
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
    if (!action || !siret || !uai) {
      onClose();
      return;
    }
    const items = [{ siret, uai }];
    try {
      const mutation = action === "activate" ? activateMutation : deactivateMutation;
      const result = await mutation.mutateAsync(items);
      const item = result.items[0];
      const verb = action === "activate" ? "Activation" : "Désactivation";
      const isOk = ["activated", "already_active", "deactivated"].includes(item?.status ?? "");
      toast({
        title: `${verb} DECA-CFA pilot`,
        description: `Statut : ${item?.status ?? "erreur"}`,
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
  }, [action, siret, uai, activateMutation, deactivateMutation, refetch, toast, onClose]);

  return (
    <>
      <Divider borderColor="#0063CB" opacity={0.3} />
      <Box color="#0063CB" display="flex" alignItems="center">
        <Box as="i" className="ri-shield-flash-line" />
        <Text fontSize="zeta" fontWeight="bold" ml="2">
          Programme DECA-CFA pilot
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
              Aucun formateur tiers dans le catalogue publié (
              {checks.no_formateurs_tiers.details?.formateursTiersCount ?? 0} trouvé(s)) :
            </Text>
            {checks.no_formateurs_tiers.passed ? <BadgeYes /> : <BadgeNo />}
          </HStack>
          <HStack spacing="1w">
            <Text>
              Effectifs sur années scolaires actives (ERP : {checks.has_effectifs.details?.effectifsErpCount ?? 0}, DECA
              : {checks.has_effectifs.details?.effectifsDecaCount ?? 0}) :
            </Text>
            {checks.has_effectifs.passed ? <BadgeYes /> : <BadgeNo />}
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
            <Box as="i" className="ri-shield-cross-line" verticalAlign="middle" mr={2} />
            Désactiver DECA-CFA pilot
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
            <Box as="i" className="ri-shield-check-line" verticalAlign="middle" mr={2} />
            Activer DECA-CFA pilot
          </Button>
        )}
      </HStack>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent borderRadius="0" p={4}>
          <ModalHeader>{action === "activate" ? "Activer DECA-CFA pilot" : "Désactiver DECA-CFA pilot"}</ModalHeader>
          <ModalBody>
            <Text>
              {action === "activate"
                ? `Activer le programme DECA-CFA pilot pour ${organisme.nom || organisme.raison_sociale || siret} (SIRET ${siret}, UAI ${uai ?? "—"}) ? Les flags is_allowed_deca / is_allowed_collab seront posés et la date d'activation ML sera propagée.`
                : `Désactiver le programme DECA-CFA pilot pour ${organisme.nom || organisme.raison_sociale || siret} (SIRET ${siret}, UAI ${uai ?? "—"}) ? Les flags et la date d'activation ML seront retirés. Les snapshots déjà transmis restent inchangés.`}
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
