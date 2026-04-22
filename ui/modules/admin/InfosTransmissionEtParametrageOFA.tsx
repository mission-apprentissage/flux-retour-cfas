import { Box, Stack, Text, Link, HStack, useClipboard, Input, Button, Divider, useDisclosure } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { UAI_INCONNUE } from "shared/models/data/organismes.model";

import { _get, _post } from "@/common/httpClient";
import Tag from "@/components/Tag/Tag";
import { Checkbox, CloseCircle } from "@/theme/components/icons";

import InviteCfaAdminModal from "./InviteCfaAdminModal";

interface InfosTransmissionParametrageOFAProps {
  transmission_date?: Date;
  transmission_api_active: boolean;
  transmission_api_version?: string;
  transmission_manuelle_active: boolean;
  parametrage_erp_active: boolean;
  api_key_active: boolean;
  api_key: string;
  parametrage_erp_date: Date;
  parametrage_erp_author: string;
  erps: string[];
  erp_unsupported: string;
  organisme_transmetteur?: {
    _id: string;
    enseigne?: string;
    raison_sociale?: string;
    uai: string;
    siret: string;
  };
}

const InfosTransmissionEtParametrageOFA = ({ organisme, ...props }) => {
  const router = useRouter();
  const { data: parametrage } = useQuery<InfosTransmissionParametrageOFAProps, any>(
    ["admin/organismes/"],
    () => _get(`/api/v1/admin/organismes/${organisme?._id}/parametrage-transmission`),
    { enabled: router.isReady }
  );
  const [showFullApiKey, setShowFullApiKey] = useState(false);
  const { onCopy, hasCopied } = useClipboard(parametrage?.api_key ?? "");
  const toggleApiKeyVisibility = () => setShowFullApiKey(!showFullApiKey);
  const { isOpen: isInviteOpen, onOpen: openInvite, onClose: closeInvite } = useDisclosure();

  const canInviteAdmin = Boolean(organisme?.siret);
  const normalizedUai =
    organisme?.uai && organisme.uai.toLowerCase() !== UAI_INCONNUE.toLowerCase() ? organisme.uai : null;
  const organismeNom = organisme?.enseigne || organisme?.raison_sociale || organisme?.nom || "Organisme";

  const { data: counts, refetch: refetchCounts } = useQuery<{
    organisation_id: string | null;
    usersTotal: number;
    usersAdmin: number;
    invitationsPending: number;
  }>(
    ["admin/invitations/counts/organisme", organisme?._id],
    () => _get(`/api/v1/admin/invitations/counts/organisme/${organisme?._id}`),
    { enabled: !!organisme?._id && router.isReady }
  );

  const apiKeyDisplay = parametrage?.api_key
    ? showFullApiKey
      ? parametrage.api_key
      : parametrage.api_key.replace(/(?<=.{3})./g, "*")
    : "Aucune clé API disponible";

  return (
    <Stack borderColor="#0063CB" borderWidth="2px" w="100%" p="2w" gap={4} {...props}>
      <Box color="#0063CB" display="flex" alignItems="center">
        <Box as="i" className="ri-eye-fill" />
        <Text fontSize="zeta" fontWeight="bold" ml="2">
          Encart réservé aux administrateurs
        </Text>
      </Box>
      <HStack spacing="1w">
        <Text>Transmission :</Text>
        {parametrage?.transmission_date &&
        (parametrage?.transmission_api_active || parametrage?.transmission_manuelle_active) ? (
          <>
            <BadgeYes />
            <Box display="flex" alignItems="center" gap={3}>
              {(parametrage.transmission_api_version || parametrage.erps?.length > 0) && (
                <Tag
                  textTransform="none"
                  variant="badge"
                  colorScheme="grey_tag"
                  size="md"
                  borderRadius={0}
                  primaryText={`${parametrage.erps?.map((erp) => erp.toUpperCase()).join(", ")} ${parametrage.transmission_api_version || ""} ${
                    parametrage.transmission_date
                      ? new Date(parametrage.transmission_date).toLocaleDateString()
                      : "Date non disponible"
                  }`}
                />
              )}
            </Box>
          </>
        ) : (
          <BadgeNo />
        )}
      </HStack>
      {parametrage?.api_key && (
        <HStack spacing="1w">
          <Text>Clé API :</Text>
          <HStack spacing="1w">
            <BadgeYes />
            <Input value={apiKeyDisplay} isReadOnly size="sm" width="330px" />
            <Button size="sm" variant="primary" onClick={toggleApiKeyVisibility}>
              {showFullApiKey ? (
                <Box as="i" className="ri-eye-off-line" verticalAlign="middle" />
              ) : (
                <Box as="i" className="ri-eye-line" verticalAlign="middle" />
              )}
            </Button>
            <Button size="sm" variant="primary" onClick={onCopy} ml="2">
              {hasCopied ? "Copié !" : "Copier"}
            </Button>
          </HStack>
        </HStack>
      )}
      <HStack spacing="1w">
        <Text>Paramétrage :</Text>
        {parametrage?.parametrage_erp_active || parametrage?.erp_unsupported ? (
          <HStack spacing="1w" gap={3}>
            <BadgeYes />
            <Tag
              textTransform="none"
              variant="badge"
              colorScheme="grey_tag"
              size="md"
              borderRadius={0}
              primaryText={`${parametrage.erps?.map((erp) => erp.toUpperCase()).join(", ")} ${
                parametrage.erp_unsupported ? `${parametrage.erp_unsupported.toUpperCase()} ` : ""
              }${
                parametrage.parametrage_erp_date ? new Date(parametrage.parametrage_erp_date).toLocaleDateString() : ""
              }`}
            />
            {parametrage.parametrage_erp_author && <Text>configuré par {parametrage.parametrage_erp_author}</Text>}
          </HStack>
        ) : (
          <BadgeNo />
        )}
      </HStack>
      {parametrage?.organisme_transmetteur ? (
        <HStack alignItems="center" gap={3}>
          <Text>Dernier organisme transmetteur : </Text>
          <Link
            key={parametrage?.organisme_transmetteur._id}
            href={`/organismes/${parametrage?.organisme_transmetteur._id}`}
            target="_blank"
            borderBottom="1px"
            color="action-high-blue-france"
            _hover={{ textDecoration: "none" }}
          >
            {parametrage?.organisme_transmetteur.enseigne ??
              parametrage?.organisme_transmetteur.raison_sociale ??
              "Organisme inconnu"}{" "}
            (UAI: {parametrage?.organisme_transmetteur.uai} - SIRET: {parametrage?.organisme_transmetteur.siret})
          </Link>
        </HStack>
      ) : null}
      <Button
        variant="secondary"
        w="fit-content"
        bg="white"
        onClick={async () => {
          window.open(`/organismes/${organisme?._id}/transmissions`, "_blank");
        }}
      >
        <Box as="i" className="ri-eye-line" verticalAlign="middle" mr={2} />
        Voir les transmissions
      </Button>

      <Divider borderColor="#0063CB" opacity={0.3} />
      <Box color="#0063CB" display="flex" alignItems="center">
        <Box as="i" className="ri-user-add-line" />
        <Text fontSize="zeta" fontWeight="bold" ml="2">
          Gestion des administrateurs
        </Text>
      </Box>
      <HStack>
        <Button
          variant="secondary"
          w="fit-content"
          bg="white"
          isDisabled={!canInviteAdmin}
          onClick={openInvite}
          title={canInviteAdmin ? undefined : "Cet organisme n'a pas de SIRET, invitation impossible"}
        >
          <Box as="i" className="ri-mail-send-line" verticalAlign="middle" mr={2} />
          Inviter un administrateur
        </Button>
      </HStack>

      {counts?.organisation_id && (
        <Stack spacing={1} pl={1}>
          <Link
            as={NextLink}
            href={`/admin/users?tab=users&organisation_id=${counts.organisation_id}`}
            color="bluefrance"
            borderBottom="1px"
            w="fit-content"
            _hover={{ textDecoration: "none" }}
          >
            Voir les {counts.usersTotal} utilisateur{counts.usersTotal > 1 ? "s" : ""} actif
            {counts.usersTotal > 1 ? "s" : ""}
            {counts.usersAdmin > 0 ? ` (dont ${counts.usersAdmin} admin)` : ""}
            <Box as="i" className="ri-arrow-right-line" ml={1} verticalAlign="middle" />
          </Link>
          <Link
            as={NextLink}
            href={`/admin/users?tab=invitations-pending&organisation_id=${counts.organisation_id}`}
            color="bluefrance"
            borderBottom="1px"
            w="fit-content"
            _hover={{ textDecoration: "none" }}
          >
            Voir les {counts.invitationsPending} invitation{counts.invitationsPending > 1 ? "s" : ""} en cours
            <Box as="i" className="ri-arrow-right-line" ml={1} verticalAlign="middle" />
          </Link>
        </Stack>
      )}

      {canInviteAdmin && (
        <InviteCfaAdminModal
          isOpen={isInviteOpen}
          onClose={closeInvite}
          siret={organisme.siret}
          uai={normalizedUai}
          organismeNom={organismeNom}
          onSuccess={() => refetchCounts()}
        />
      )}
    </Stack>
  );
};

const BadgeYes = () => <Tag leftIcon={Checkbox} primaryText="Oui" variant="badge" colorScheme="green_tag" size="md" />;

const BadgeNo = () => <Tag leftIcon={CloseCircle} primaryText="Non" variant="badge" colorScheme="red_tag" size="md" />;

export default InfosTransmissionEtParametrageOFA;
