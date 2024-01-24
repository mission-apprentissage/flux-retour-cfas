import { AddIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Center,
  Circle,
  Container,
  HStack,
  Heading,
  Spinner,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import groupBy from "lodash.groupby";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useSetRecoilState } from "recoil";
import { getStatutApprenantNameFromCode } from "shared";

import { effectifsExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { Organisme } from "@/common/internal/Organisme";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import DownloadButton from "@/components/buttons/DownloadButton";
import Link from "@/components/Links/Link";
import SimplePage from "@/components/Page/SimplePage";
import Ribbons from "@/components/Ribbons/Ribbons";
import { DoubleChevrons } from "@/theme/components/icons/DoubleChevrons";

import { effectifsStateAtom } from "../mon-espace/effectifs/engine/atoms";
import EffectifsTable from "../mon-espace/effectifs/engine/EffectifsTable";
import { Input } from "../mon-espace/effectifs/engine/formEngine/components/Input/Input";
import BandeauTransmission from "../organismes/BandeauTransmission";

interface EffectifsPageProps {
  organisme: Organisme;
  modePublique: boolean;
}
function EffectifsPage(props: EffectifsPageProps) {
  // Booléen temporaire pour la désactivation temporaire du bouton de téléchargement de la liste
  const TMP_DEACTIVATE_DOWNLOAD_BUTTON = true;

  const router = useRouter();
  const setCurrentEffectifsState = useSetRecoilState(effectifsStateAtom);

  const [searchValue, setSearchValue] = useState("");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [filtreAnneeScolaire, setFiltreAnneeScolaire] = useState("all");

  const { data: organismesEffectifs, isLoading } = useQuery(
    ["organismes", props.organisme._id, "effectifs"],
    async () => {
      const organismesEffectifs = await _get<any[]>(`/api/v1/organismes/${props.organisme._id}/effectifs`);
      // met à jour l'état de validation de chaque effectif (nécessaire pour le formulaire)
      setCurrentEffectifsState(
        organismesEffectifs.reduce((acc, { id, validation_errors }) => {
          acc.set(id, { validation_errors, requiredSifa: [] });
          return acc;
        }, new Map())
      );
      return organismesEffectifs;
    }
  );

  const { data: duplicates } = useQuery(["organismes", props.organisme._id, "duplicates"], () =>
    _get<Organisme[]>(`/api/v1/organismes/${props.organisme?._id}/duplicates`)
  );

  const effectifsByAnneeScolaire = useMemo(() => groupBy(organismesEffectifs, "annee_scolaire"), [organismesEffectifs]);

  const title = `${props.modePublique ? "Ses" : "Mes"} effectifs`;
  return (
    <SimplePage title={title}>
      <Container maxW="xl" p="8">
        <HStack justifyContent="space-between" mb={8}>
          <Heading as="h1" color="#465F9D" fontSize="beta" fontWeight="700">
            {title}
          </Heading>

          <div>
            <Link variant="whiteBg" href={`${router.asPath}/televersement`}>
              <AddIcon boxSize={3} mr={2} />
              Ajouter via fichier Excel
            </Link>
            {!TMP_DEACTIVATE_DOWNLOAD_BUTTON && organismesEffectifs?.length ? (
              <DownloadButton
                borderBottom={0}
                variant="link"
                ml={2}
                action={() => {
                  exportDataAsXlsx(
                    `tdb-effectifs-${filtreAnneeScolaire}.xlsx`,
                    organismesEffectifs?.map((effectif) => {
                      return {
                        organisme_uai: props.organisme.uai,
                        organisme_siret: props.organisme.siret,
                        organisme_nom: props.organisme.raison_sociale,
                        organisme_nature: props.organisme.nature,
                        apprenant_nom: effectif.nom,
                        apprenant_prenom: effectif.prenom,
                        apprenant_date_de_naissance: effectif.date_de_naissance,
                        apprenant_statut: getStatutApprenantNameFromCode(
                          effectif.historique_statut?.sort((a, b) => {
                            return new Date(a.date_statut).getTime() - new Date(b.date_statut).getTime();
                          })[0]?.valeur_statut
                        ),
                        formation_annee: effectif.formation?.annee,
                        formation_cfd: effectif.formation?.cfd,
                        formation_date_debut_formation: effectif.formation?.periode?.[0],
                        formation_date_fin_formation: effectif.formation?.periode?.[1],
                        formation_libelle_long: effectif.formation?.libelle_long,
                        formation_niveau: effectif.formation?.niveau,
                        formation_rncp: effectif.formation?.rncp,
                      };
                    }) || [],
                    effectifsExportColumns
                  );
                }}
              >
                Télécharger la liste
              </DownloadButton>
            ) : null}
          </div>
        </HStack>

        {organismesEffectifs && organismesEffectifs.length === 0 && (
          <BandeauTransmission organisme={props.organisme} modePublique={props.modePublique} />
        )}

        {duplicates && duplicates?.length > 0 && (
          <Ribbons variant="alert" mb={6}>
            <Box ml={3}>
              <Text color="grey.800" fontSize="1.1rem" fontWeight="bold" mr={6} mb={4}>
                Nous avons détecté {duplicates?.length} duplicat{duplicates?.length > 1 ? "s" : ""} pour l’année
                scolaire en cours.
              </Text>

              <Link
                variant="whiteBg"
                href={`${router.asPath}/doublons`}
                plausibleGoal="clic_verifier_doublons_effectifs"
              >
                Vérifier
              </Link>
            </Box>
          </Ribbons>
        )}

        {isLoading && (
          <Center h="200px">
            <Spinner />
          </Center>
        )}

        {organismesEffectifs && organismesEffectifs.length > 0 && (
          <>
            <VStack alignItems="flex-start">
              <Input
                {...{
                  name: "search_effectifs",
                  fieldType: "text",
                  mask: "C",
                  maskBlocks: [
                    {
                      name: "C",
                      mask: "Pattern",
                      pattern: "^.*$",
                    },
                  ],
                  placeholder: "Rechercher un apprenant...",
                  value: searchValue,
                  onSubmit: (value) => {
                    setSearchValue(value.trim());
                  },
                }}
                w="35%"
              />
            </VStack>
            <VStack alignItems="flex-start" mt={8}>
              <HStack w="full">
                <Box fontWeight="bold" flexGrow={1}>
                  Filtrer&nbsp;:
                </Box>
                <HStack>
                  <Switch
                    variant="icon"
                    onChange={(e) => {
                      setShowOnlyErrors(e.target.checked);
                    }}
                  />
                  <Text flexGrow={1}>Afficher uniquement les données en erreur</Text>
                </HStack>
              </HStack>
              <HStack w="full" mt={2}>
                <Text>Par année scolaire</Text>
                <BadgeButton onClick={() => setFiltreAnneeScolaire("all")} active={filtreAnneeScolaire === "all"}>
                  Toutes
                </BadgeButton>
                {Object.keys(effectifsByAnneeScolaire).map((anneeScolaire) => {
                  return (
                    <BadgeButton
                      onClick={() => setFiltreAnneeScolaire(anneeScolaire)}
                      key={anneeScolaire}
                      active={anneeScolaire === filtreAnneeScolaire}
                    >
                      {anneeScolaire}
                    </BadgeButton>
                  );
                })}
              </HStack>
            </VStack>
          </>
        )}

        <Box mt={10} mb={16}>
          {Object.entries<any[]>(effectifsByAnneeScolaire).map(([anneeScolaire, effectifs]) => {
            if (filtreAnneeScolaire !== "all" && anneeScolaire !== filtreAnneeScolaire) {
              return null;
            }
            const orgaEffectifs = showOnlyErrors
              ? effectifs.filter((effectif) => effectif.validation_errors.length)
              : effectifs;
            const effectifsByCfd: { [cfd: string]: any[] } = groupBy(orgaEffectifs, "formation.cfd");
            return (
              <Box key={anneeScolaire} mb={5}>
                <Text>
                  {anneeScolaire} {!searchValue ? `- ${orgaEffectifs.length} apprenant(es) total` : ""}
                </Text>
                <Box p={4} borderColor="dgalt" borderWidth="1px">
                  {Object.entries(effectifsByCfd).map(([cfd, effectifs], i) => {
                    const { formation } = effectifs[0];
                    return (
                      <EffectifsTableContainer
                        key={`${anneeScolaire}${cfd}`}
                        canEdit={true}
                        effectifs={effectifs}
                        formation={formation}
                        searchValue={searchValue}
                        mt={i === 0 ? 0 : 14}
                      />
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </SimplePage>
  );
}

export default EffectifsPage;

const BadgeButton = ({ onClick, active = false, children, ...props }) => {
  return (
    <Button onClick={onClick} variant={active ? "badgeSelected" : "badge"} {...props}>
      {children}
      {active && (
        <Circle size="15px" background="white" color="bluefrance" position="absolute" bottom="18px" right="-5px">
          <Box as="i" className="ri-checkbox-circle-line" fontSize="gamma" />
        </Circle>
      )}
    </Button>
  );
};

const EffectifsTableContainer = ({ effectifs, formation, canEdit, searchValue, ...props }) => {
  const [count, setCount] = useState(effectifs.length);
  return (
    <Box {...props}>
      {count !== 0 && (
        <HStack>
          <DoubleChevrons />
          <Text fontWeight="bold" textDecoration="underline">
            {formation.libelle_long}
          </Text>
          <Text>
            [Code diplôme {formation.cfd}] - [Code RNCP {formation.rncp}]
          </Text>
        </HStack>
      )}
      <EffectifsTable
        canEdit={canEdit}
        organismesEffectifs={effectifs}
        searchValue={searchValue}
        onCountItemsChange={(count) => setCount(count)}
      />
    </Box>
  );
};
