import { Box, Link, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";

import { BaseAccordionGroup } from "../../../common/components/BaseAccordionGroup/BaseAccordionGroup";
import { CONTACT_ADDRESS } from "../../../common/constants/product";

const QuestionsFrequemmementPosees = ({ isHomePage }) => (
  <BaseAccordionGroup
    isHomePage={isHomePage}
    AccordionItemsDetailList={[
      {
        title: "Pourquoi transmettre les données de votre organisme au Tableau de bord ?",
        content: (
          <Box>
            Différentes institutions (Conseil Régional, DREETS, DRAAF, Carif Oref, Académie, DGEFP) consultent le
            Tableau de Bord de l&apos;Apprentissage quotidiennement pour suivre l’évolution des effectifs. Ces données
            les éclairent notamment pour attribuer des subventions, pour mettre en place des plans d’actions
            d’accompagnement des jeunes sans contrat ou pour définir les politiques publiques d’aide à l’apprentissage.
          </Box>
        ),
      },
      {
        title: "Pour quels usages et quels utilisateurs a été conçu le Tableau de bord ?",
        content: (
          <Box>
            <Text>
              Le Tableau de bord de l’apprentissage a été conçu pour répondre aux besoins du ministère du Travail et du
              ministère de l’Éducation Nationale, de l’Enseignement supérieur et de la Transformation publique, en terme
              de visibilité sur les chiffres clés de l’apprentissage. <br /> <br />
              Pour en savoir plus sur les utilisateurs du Tableau de bord de l’apprentissage, consultez{" "}
              <Link to="/organisme-formation/aide" as={NavLink} color="bluefrance" textDecoration="underLine">
                Qui peut consulter les données de votre organisme ? <Box as="i" className="ri--link-line" />{" "}
              </Link>
            </Text>
          </Box>
        ),
      },
      {
        title: "Quelles institutions ont accès aux données du Tableau de bord ?",
        content: (
          <Box>
            <Text>
              Des institutions qui pilotent l’Apprentissage nationalement ou territorialement comme la DREETS, la DRAAF,
              le Conseil Régional, l’Académie et le Carif Oref par exemple.
            </Text>
          </Box>
        ),
      },
      {
        title: "Je suis un organisme de formation, comment transmettre ?",
        content: (
          <Box>
            <UnorderedList>
              <ListItem>
                Si vous utilisez les ERP suivants : Gesti, Ymag, SC Form, Formasup, FCA Manager ou Auriga, un simple
                paramétrage suffit pour vous brancher au Tableau de Bord. La démarche n’est à faire qu’une seule fois et
                est estimée à 10 minutes. Pour ce faire, [sélectionner l’ERP que vous utilisez] et
                <Link to="/organisme-formation/transmettre" as={NavLink} color="bluefrance" textDecoration="underLine">
                  {" "}
                  téléchargez le pas à pas correspondant <Box as="i" className="ri--link-line" />
                </Link>
              </ListItem>
              <ListItem marginTop="1v">
                Si vous utilisez les ERP suivants : CNAM (Gessic@), Alcuin Software, Hyperplanning, Valsoftware, Agate
                Les travaux de développement sont en cours, vous pourrez prochainement transmettre directement via votre
                ERP, n’hésitez pas à nous transmettre vos coordonnées pour que nous vous tenions informés dès que cette
                fonctionnalité sera disponible :{" "}
                <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                  tableau-de-bord@apprentissage.beta.gouv.fr
                </Link>
              </ListItem>
              <ListItem marginTop="1v">
                Si vous n’utilisez aucun de ces logiciels, nous travaillons à une solution gratuite et simple pour
                transmettre vos données et répondre à l’obligation légale de données de la visibilité aux acteurs
                publics, celle-ci vous sera proposée dès le quatrième trimestre 2022. Nous avons besoin d’organismes
                pour tester cette solution, pour vous inscrire ou simplement pour être informé de l’ouverture de ce
                service, n’hésitez pas à nous contacter :{" "}
                <Link href={`mailto:${CONTACT_ADDRESS}`} color="bluefrance" whiteSpace="nowrap">
                  tableau-de-bord@apprentissage.beta.gouv.fr
                </Link>
              </ListItem>
            </UnorderedList>
          </Box>
        ),
      },
      {
        title: "La transmission des données au Tableau de bord remplace-t-elle l'enquête SIFA ?",
        content: (
          <Box>
            <Text>
              À ce jour, transmettre vos données au Tableau de bord ne vous dispense pas de remplir l’enquête SIFA.
              <br />
              <br />
              Une fois que les objectifs d’acquisition et de qualité des données seront atteints, de nouveaux usages des
              données collectées pourront être étudiés. Nous travaillons en collaboration avec l’ensemble des services
              publics, dont la DEPP qui administre l’enquête SIFA.
            </Text>
          </Box>
        ),
      },
    ]}
  />
);

QuestionsFrequemmementPosees.propTypes = {
  isHomePage: PropTypes.bool,
};
export default QuestionsFrequemmementPosees;
