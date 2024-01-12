import { Box, HStack, Link, ListItem, Text, UnorderedList } from "@chakra-ui/react";

import { ExternalLinkLine } from "@/theme/components/icons";

interface InfoTeleversementProps {
  maxInputLength: number;
}

export default function InfoTeleversement(props: InfoTeleversementProps) {
  return (
    <div>
      <Box color="#ef5800" mb="4">
        <Text mt={6} mb={2} fontWeight="bold">
          Quelques informations importantes à retenir&nbsp;:
        </Text>
        <UnorderedList fontSize="zeta">
          <ListItem>
            Déclarez tous vos apprenants, y compris les apprentis en contrat, ceux dont le contrat a été rompu, les
            jeunes sans contrat et les cas d’abandon éventuels.
          </ListItem>
          <ListItem>
            Si votre établissement ne comptabilise aucun effectif en apprentissage à la date du jour, il n’est pas
            nécessaire d’ajouter un fichier.
          </ListItem>
          <ListItem>
            Pour téléverser vos effectifs, vous avez 2 options :
            <UnorderedList>
              <ListItem>
                [Recommandé] remplir directement le fichier-modèle (téléchargeable ci-dessus) avec vos effectifs, et
                enlever la ligne 2, dédiée aux exemples,
              </ListItem>
              <ListItem>
                créer un fichier personnalisé, en conservant les mêmes en-têtes de colonne que le fichier-modèle.
              </ListItem>
            </UnorderedList>
          </ListItem>
          <ListItem>
            Actuellement, il n’est pas possible de téléverser deux fichiers en même temps, mais nous y travaillons.
          </ListItem>
          <ListItem>
            Afin de garantir la fraîcheur des données et de permettre un soutien constant de vos apprenants, nous vous
            recommandons de nous transmettre les effectifs une fois par mois, de préférence entre le 1er et le 5 de
            chaque mois.
          </ListItem>
          <ListItem>
            Si vous n’avez pas accès à Excel ou si vous ne l’utilisez pas, vous pouvez utiliser un{" "}
            <Link href="https://www.zamzar.com/fr/convert/numbers-to-xls/" isExternal textDecoration={"underline"}>
              convertisseur en ligne
              <ExternalLinkLine w={"0.55rem"} h={"0.55rem"} mb={"0.125rem"} ml={1} />
            </Link>
            . Pour les utilisateurs de Numbers, vous avez la possibilité d’exporter le fichier au format{" "}
            <code>.xls</code> (Fichier &gt; Exporter vers &gt; Excel, décocher la case «&nbsp;Inclure une feuille de
            résumé&nbsp;»)
          </ListItem>
          <ListItem>
            Aujourd’hui, le téléversement régulier de vos effectifs au tableau de bord ne vous dispense pas de répondre
            à l’enquête annuelle SIFA. Cependant, cela facilitera la préparation du fichier nécessaire à cette enquête
            (voir l’onglet «&nbsp;Mon enquête SIFA&nbsp;»).
          </ListItem>
          <ListItem>
            Si votre organisme comprend plusieurs sites de formation (avec un UAI propre), vous pouvez déclarer les
            apprentis de votre établissement, et encourager vos sites formateurs à se créer un compte et faire
            l’opération également. Vous pouvez également le faire pour l’ensemble de vos sites. Dans ce cas, il faudra
            indiquer le SIRET et code UAI de chacun.
          </ListItem>
          <ListItem>
            Notre solution de téléversement n’accepte pas les fichiers au-delà de {props.maxInputLength} lignes. Si vous
            souhaitez transmettre plus de {props.maxInputLength} effectifs, il vous faudra téléverser un premier fichier
            de 2000 lignes, puis renouveler l’opération avec un deuxième fichier comportant les effectif restants.
          </ListItem>
        </UnorderedList>
      </Box>
      <Text mt={6} fontWeight="bold">
        25 données sont obligatoires&nbsp;:
      </Text>
      <HStack mt={2} fontSize="zeta">
        <Box>
          <UnorderedList>
            <ListItem>Nom de l’apprenant</ListItem>
            <ListItem>Prénom de l’apprenant</ListItem>
            <ListItem>Date de naissance de l’apprenant</ListItem>
            <ListItem>Email de l’apprenant</ListItem>
            <ListItem>Adresse de résidence de l’apprenant</ListItem>
            <ListItem>Code postal de résidence de l’apprenant</ListItem>
            <ListItem>Genre de l’apprenant</ListItem>
            <ListItem>Date à laquelle le statut de l’apprenant a été saisi</ListItem>
            <ListItem>Statut de l’apprenant</ListItem>
            <ListItem>N° UAI de l’établissement responsable</ListItem>
            <ListItem>SIRET de l’établissement responsable</ListItem>
            <ListItem>N° UAI de l’établissement formateur</ListItem>
          </UnorderedList>
        </Box>
        <Box>
          <UnorderedList>
            <ListItem>SIRET de l’établissement formateur</ListItem>
            <ListItem>N° UAI du lieu de formation</ListItem>
            <ListItem>SIRET du lieu de formation</ListItem>
            <ListItem>Année de formation concernée</ListItem>
            <ListItem>Date d’inscription en formation</ListItem>
            <ListItem>Date d’entrée en formation </ListItem>
            <ListItem>Date de fin de formation</ListItem>
            <ListItem>Durée théorique de la formation</ListItem>
            <ListItem>Code Formation Diplôme (CFD)</ListItem>
            <ListItem>Diplôme de la formation</ListItem>
            <ListItem>Code RNCP de la formation</ListItem>
            <ListItem>SIRET de l’employeur </ListItem>
            <ListItem>Date de rupture du contrat (si pertinent)</ListItem>
          </UnorderedList>
        </Box>
      </HStack>
    </div>
  );
}
