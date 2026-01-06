import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Collapse, UnorderedList, ListItem, Text, Link } from "@chakra-ui/react";
import { useState } from "react";

import { usePlausibleTracking } from "@/hooks/plausible";

import Ribbons from "../Ribbons/Ribbons";

export default function InfoBetaPanel() {
  const [show, setShow] = useState(false);
  const handleToggle = () => {
    setShow(!show);
    trackPlausibleEvent("televersement_clic_excel_conseils");
  };
  const { trackPlausibleEvent } = usePlausibleTracking();

  const linkStyle = {
    color: "#000091",
    textDecoration: "underline",
    textUnderlineOffset: "4px",
    cursor: "pointer",
  };

  return (
    <Ribbons variant="info" mb={6}>
      <Text color="#3A3A3A" fontSize="gamma" fontWeight="bold" mb={4}>
        Quelques conseils sur le remplissage du fichier Excel :
      </Text>
      <Text style={linkStyle} onClick={handleToggle} mb={2}>
        {" "}
        {!show ? <ChevronDownIcon /> : <ChevronUpIcon />} Voir les détails
      </Text>
      <Collapse in={show}>
        <Text color="grey.800">
          <UnorderedList spacing={2} px={6}>
            <ListItem>Vérifiez que tous vos apprentis soient bien présents dans le fichier.</ListItem>
            <ListItem>
              Pour téléverser vos effectifs, vous avez 2 options : remplir directement le modèle Excel (téléchargeable
              ci-dessus) avec vos effectifs, ou créer un fichier personnalisé, en{" "}
              <strong>conservant les mêmes en-têtes de colonne</strong> que le fichier-modèle.
            </ListItem>
            <ListItem>
              Nous nous basons sur les dates de contrat, de rupture, de formation et d’exclusion pour déterminer le
              statut d’un effectif. Veuillez <strong>remplir les colonnes associées à ces évènements</strong>.
            </ListItem>
            <ListItem>
              Actuellement, il n&apos;est pas possible de téléverser deux fichiers en même temps, mais nous y
              travaillons.
            </ListItem>
            <ListItem>
              Si votre établissement ne comptabilise <strong>aucun effectif</strong> en apprentissage à la date du jour,
              il n’est pas nécessaire d’ajouter un fichier.
            </ListItem>
            <ListItem>
              Si vous n&apos;avez pas accès à Excel ou si vous ne l&apos;utilisez pas, vous pouvez utiliser un{" "}
              <Link
                isExternal
                href="https://www.zamzar.com/fr/convert/numbers-to-xls/"
                textDecoration="underLine"
                display="inline"
              >
                convertisseur en ligne
              </Link>{" "}
              . Pour les utilisateurs de Numbers (ou autre logiciel), vous avez la possibilité d’exporter le fichier au
              format .xls (Fichier &gt; Exporter vers &gt; Excel)
            </ListItem>
            <ListItem>
              Le téléversement régulier de vos effectifs au tableau de bord ne vous dispense pas de répondre à
              l&apos;enquête annuelle SIFA sur la{" "}
              <Link href="https://sifa.depp.education.fr" isExternal display="inline">
                plateforme officielle SIFA
              </Link>
              .
            </ListItem>
          </UnorderedList>
        </Text>
      </Collapse>
    </Ribbons>
  );
}
