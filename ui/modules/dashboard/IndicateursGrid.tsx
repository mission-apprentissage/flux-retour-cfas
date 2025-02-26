import { Box, Grid, GridItem, Skeleton, Text } from "@chakra-ui/react";
import {
  PlausibleGoalType,
  TypeEffectifNominatif,
  typesEffectifNominatif,
  IndicateursEffectifs,
  shouldDisplayContactInEffectifNominatif,
} from "shared";

import { getEffectifsExportColumnFromOrganisationType } from "@/common/actions/organisation.actions";
import { _get } from "@/common/httpClient";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";
import AppButton, { AppButtonProps } from "@/components/buttons/Button";
import DownloadButton from "@/components/buttons/DownloadButton";
import { IndicatorCard } from "@/components/Card/IndicatorCard";
import { BasicModal } from "@/components/Modals/BasicModal";
import { usePlausibleTracking } from "@/hooks/plausible";
import useAuth from "@/hooks/useAuth";
import { EffectifsFiltersFull, convertEffectifsFiltersToQuery } from "@/modules/models/effectifs-filters";

import { AbandonsIcon, ApprenantsIcon, ApprentisIcon, InscritsSansContratsIcon, RupturantsIcon } from "./icons";

const DownloadButtonWithModal = ({ children, action, ...props }: AppButtonProps) => {
  const { organisationType } = useAuth();

  const onDownload = async (close: () => void) => {
    await action();
    close();
  };

  return shouldDisplayContactInEffectifNominatif(organisationType) ? (
    <BasicModal
      title="Téléchargement des listes nominatives"
      renderTrigger={(onOpen) => (
        <DownloadButton action={() => onOpen()} {...props}>
          {children}
        </DownloadButton>
      )}
      renderFooter={(onClose) => (
        <Box mt={5} display="flex">
          <AppButton variant="secondary" action={onClose} mr={5}>
            <Text>Annuler</Text>
          </AppButton>
          <AppButton variant="primary" action={() => onDownload(onClose)}>
            <Text>J&apos;ai compris</Text>
          </AppButton>
        </Box>
      )}
    >
      <Text>
        Pour appuyer le travail des cellules régionales interministérielles d&apos;accompagnement vers
        l&apos;apprentissage, vous avez à votre disposition des listes nominatives des jeunes sans contrat, rupturants
        et sortie d’apprentissage.
        <br />
        Il est recommandé, dans le respect de la mission d&apos;accompagnement des OFA, de prévenir ces derniers de la
        prise en charge des jeunes dont ils portent la responsabilité.
      </Text>
    </BasicModal>
  ) : (
    <DownloadButton action={action} {...props}>
      {children}
    </DownloadButton>
  );
};

const typeToGoalPlausible: { [key in Exclude<TypeEffectifNominatif, "inconnu">]: PlausibleGoalType } = {
  inscritSansContrat: "telechargement_liste_sans_contrats",
  rupturant: "telechargement_liste_rupturants",
  abandon: "telechargement_liste_abandons",
  apprenti: "telechargement_liste_apprentis",
  apprenant: "telechargement_liste_apprenants",
};

interface IndicateursGridPropsLoading {
  loading: true;
}

interface IndicateursGridPropsReady {
  indicateursEffectifs: IndicateursEffectifs;
  loading: false;
  effectifsFilters?: EffectifsFiltersFull;
  organismeId?: string;
}

type IndicateursGridProps = IndicateursGridPropsReady | IndicateursGridPropsLoading;

function IndicateursGrid(props: IndicateursGridProps) {
  const { trackPlausibleEvent } = usePlausibleTracking();
  const { auth, organisationType } = useAuth();

  const permissionEffectifsNominatifs = auth.acl
    ? Object.entries(auth.acl.effectifsNominatifs)
        .filter(([, v]) => v !== false)
        .map(([k]) => k)
    : [];

  if (props.loading) {
    return (
      <Grid minH="240px" templateRows="repeat(2, 1fr)" templateColumns="repeat(6, 1fr)" gap={4} my={8}>
        <GridItem colSpan={2} rowSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
        <GridItem colSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
        <GridItem colSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
        <GridItem colSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
        <GridItem colSpan={2}>
          <Skeleton w="100%" h="100%" startColor="grey.300" endColor="galt" />
        </GridItem>
      </Grid>
    );
  }

  const { indicateursEffectifs, effectifsFilters, organismeId } = props;

  async function downloadEffectifsNominatifs(
    type: (typeof typesEffectifNominatif)[number],
    effectifsFilters: EffectifsFiltersFull
  ) {
    trackPlausibleEvent(typeToGoalPlausible[type]);
    const effectifs = await _get(
      `/api/v1${organismeId ? `/organismes/${organismeId}` : ""}/indicateurs/effectifs/${type}`,
      {
        params: convertEffectifsFiltersToQuery(effectifsFilters),
      }
    );

    exportDataAsXlsx(
      `tdb-effectifs-${type}-${effectifsFilters.date.toISOString().substring(0, 10)}.xlsx`,
      effectifs,
      getEffectifsExportColumnFromOrganisationType(organisationType)
    );
  }

  return (
    <Grid minH="240px" templateRows="repeat(2, 1fr)" templateColumns="repeat(6, 1fr)" gap={4} my={8}>
      <GridItem bg="galt" colSpan={2} rowSpan={2}>
        <IndicatorCard
          label="apprenants"
          count={indicateursEffectifs.apprenants}
          tooltipHeader="Nombre d’apprenants en contrat d’apprentissage"
          tooltipLabel={
            <>
              Cet indicateur est basé sur la réception d’un statut transmis par les organismes de formation. Est
              considéré comme un apprenant, un jeune inscrit en formation dans un organisme de formation en
              apprentissage. Il peut être&nbsp;:
              <br />
              - en formation et en recherche d’une entreprise (pas de contrat de signé)
              <br />
              - apprenti en entreprise (son contrat est signé)
              <br />- apprenti en rupture de contrat d’apprentissage et à la recherche d’un nouvel employeur
            </>
          }
          icon={<ApprenantsIcon />}
          big={true}
        >
          {permissionEffectifsNominatifs.includes("apprenant") && effectifsFilters && (
            <DownloadButtonWithModal
              variant="link"
              fontSize="sm"
              p="0"
              mt="2"
              isDisabled={indicateursEffectifs.apprenants === 0}
              title={indicateursEffectifs.apprenants === 0 ? "Aucun effectif à télécharger" : ""}
              action={async () => downloadEffectifsNominatifs("apprenant", effectifsFilters)}
            >
              Télécharger la liste
            </DownloadButtonWithModal>
          )}
        </IndicatorCard>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <IndicatorCard
          label="dont apprentis"
          count={indicateursEffectifs.apprentis}
          tooltipHeader="Apprenti"
          tooltipLabel={
            <>
              Un apprenti est un jeune apprenant inscrit en centre de formation et ayant signé un contrat dans une
              entreprise qui le forme.
            </>
          }
          icon={<ApprentisIcon />}
        >
          {permissionEffectifsNominatifs.includes("apprenti") && effectifsFilters && (
            <DownloadButtonWithModal
              variant="link"
              fontSize="sm"
              p="0"
              mt="2"
              isDisabled={indicateursEffectifs.apprentis === 0}
              title={indicateursEffectifs.apprentis === 0 ? "Aucun effectif à télécharger" : ""}
              action={async () => downloadEffectifsNominatifs("apprenti", effectifsFilters)}
            >
              Télécharger la liste
            </DownloadButtonWithModal>
          )}
        </IndicatorCard>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <IndicatorCard
          label="dont rupturants"
          count={indicateursEffectifs.rupturants}
          tooltipHeader="Rupturant"
          tooltipLabel={
            <>
              Un jeune est considéré en rupture lorsqu’il ne travaille plus dans l’entreprise qui l’accueillait.
              Néanmoins, il reste inscrit dans le centre de formation et dispose d’un délai de 6 mois pour retrouver une
              entreprise auprès de qui se former. Il est considéré comme stagiaire de la formation professionnelle.
            </>
          }
          icon={<RupturantsIcon />}
        >
          {permissionEffectifsNominatifs.includes("rupturant") && effectifsFilters && (
            <DownloadButtonWithModal
              variant="link"
              fontSize="sm"
              p="0"
              mt="2"
              isDisabled={indicateursEffectifs.rupturants === 0}
              title={indicateursEffectifs.rupturants === 0 ? "Aucun effectif à télécharger" : ""}
              action={async () => downloadEffectifsNominatifs("rupturant", effectifsFilters)}
            >
              Télécharger la liste
            </DownloadButtonWithModal>
          )}
        </IndicatorCard>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <IndicatorCard
          label="dont jeunes sans contrat"
          count={indicateursEffectifs.inscrits}
          tooltipHeader="Jeune sans contrat"
          tooltipLabel={
            <>
              Un jeune sans contrat est un jeune inscrit qui débute sa formation sans contrat signé en entreprise. Le
              jeune dispose d’un délai de 3 mois pour trouver son entreprise et continuer sereinement sa formation.
            </>
          }
          icon={<InscritsSansContratsIcon />}
        >
          {permissionEffectifsNominatifs.includes("inscritSansContrat") && effectifsFilters && (
            <DownloadButtonWithModal
              variant="link"
              fontSize="sm"
              p="0"
              mt="2"
              isDisabled={indicateursEffectifs.inscrits === 0}
              title={indicateursEffectifs.inscrits === 0 ? "Aucun effectif à télécharger" : ""}
              action={async () => downloadEffectifsNominatifs("inscritSansContrat", effectifsFilters)}
            >
              Télécharger la liste
            </DownloadButtonWithModal>
          )}
        </IndicatorCard>
      </GridItem>
      <GridItem bg="galt" colSpan={2}>
        <IndicatorCard
          label="sorties d’apprentissage"
          count={indicateursEffectifs.abandons}
          tooltipHeader="Sorties d’apprentissage (anciennement “abandons”)"
          tooltipLabel={
            <div>
              Il s’agit du nombre d’apprenants ou apprentis qui ont définitivement quitté le centre de formation à la
              date affichée. Cette indication est basée sur un statut transmis par les organismes de formation. Ces
              situations peuvent être consécutives à une rupture de contrat d’apprentissage avec départ du centre de
              formation, à un départ du centre de formation sans que l’apprenant n’ait jamais eu de contrat, à un départ
              du centre de formation pour intégrer une entreprise en CDI ou CDD plus rémunérateur.
            </div>
          }
          icon={<AbandonsIcon />}
        >
          {permissionEffectifsNominatifs.includes("abandon") && effectifsFilters && (
            <DownloadButtonWithModal
              variant="link"
              fontSize="sm"
              p="0"
              mt="2"
              isDisabled={indicateursEffectifs.abandons === 0}
              title={indicateursEffectifs.abandons === 0 ? "Aucun effectif à télécharger" : ""}
              action={async () => downloadEffectifsNominatifs("abandon", effectifsFilters)}
            >
              Télécharger la liste
            </DownloadButtonWithModal>
          )}
        </IndicatorCard>
      </GridItem>
    </Grid>
  );
}

export default IndicateursGrid;
