import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  // Button,
  Heading,
  Text,
} from "@chakra-ui/react";
// import { useState } from "react";

const MentionsLegalesAccordions = () => {
  // const [value, setValue] = useState([]);
  // let awijudhawiud = [];
  // const check = (checkValue) => {
  //   console.log(awijudhawiud.indexOf(checkValue) === -1);
  //   console.log(awijudhawiud);
  //   if (awijudhawiud.indexOf(checkValue) === -1) {
  //     awijudhawiud.push(checkValue);
  //     console.log(awijudhawiud);
  //   } else {
  //     awijudhawiud.splice(awijudhawiud.indexOf(checkValue), 1);
  //   }
  // };
  // console.log(awijudhawiud);

  return (
    <Box marginTop="2w">
      <Box>
        {/* <Button onClick={() => setValue([0, 1, 2, 3, 4, 5])}>Tout déplier</Button>
        <Button onClick={() => setValue([])}>dwiajwd</Button> */}
      </Box>
      <Accordion allowMultiple fontSize="zeta" color="#000000" marginTop="8w">
        <AccordionItem on>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" color="#000091" fontSize="delta">
                Mentions légales obligatoires
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel paddingBottom={4}>
            <Box>
              <Heading as="h2" fontSize="22px">
                Identification de l’éditeur
              </Heading>
              <Text>
                Ce site est édité par l’Incubateur de services numériques de la Direction interministérielle du
                numérique (DINUM). <br />
                Adresse : 20, avenue de Ségur - 75007 Paris. <br />
                N°SIREN : 130025265
                <br />
                N°SIRET : 130 025 265 00013
                <br />
                Code APE : 84.11Z - Administration publique générale
              </Text>
            </Box>
            <Box marginTop="1w">
              <Heading as="h2" fontSize="22px">
                Directeur de la publication
              </Heading>
              <Text>Directeur interministériel du numérique (DINUM).</Text>
            </Box>
            <Box marginTop="1w">
              <Heading as="h2" fontSize="22px">
                Prestataire d’hébergement
              </Heading>
              <Text>
                L’hébergement est assuré par OVH, situé à l’adresse suivante : <br />
                2 rue Kellermann
                <br />
                59100 Roubaix
                <br />
                Standard : 09.72.10.07 <br />
                <br />
                <br />
                La conception et la réalisation du site sont effectuée par La Mission Interministérielle pour
                l’Apprentissage, située à l’adresse suivante : <br />
                Beta.gouv
                <br />
                20 avenue de Ségur
                <br />
                75007 Paris
              </Text>
            </Box>
            <Box marginTop="1w">
              <Heading as="h2" fontSize="22px">
                Traitement des données à caractère personnel
              </Heading>
              <Text>
                [Tableau de bord de l’apprentissage] a fait l&apos;objet d&apos;une déclaration à la Commission
                Nationale de l&apos;Informatique et <br />
                des Libertés (CNIL) sous le n° [XXXXXX].
                <br />
                <br />
                La base de données diffusée dans la rubrique Annuaire de l&apos;administration a fait l&apos;objet
                d&apos;une déclaration spécifique <br />
                sous le n° [XXXXXXX].
                <br />
                <br />
                L&apos;annuaire de l&apos;administration a été autorisé par l&apos;arrêté du 6 novembre 2000 relatif à
                la création d&apos;un site sur internet <br />
                intitulé [cfas.apprentissage.beta.gouv.fr] (modifié par l&apos;arrêté du 10 août 2001).
                <br />
                <br />
                Conformément aux dispositions de la loi n° 78-17 du 6 janvier 1978 relative à l&apos;informatique, aux
                fichiers et aux <br />
                libertés, vous disposez d&apos;un droit d&apos;accès, de modification, de rectification et de
                suppression des données qui vous <br />
                concernent. Pour demander une modification, rectification ou suppression des données vous concernant, il
                vous <br />
                suffit d&apos;envoyer un courrier par voie électronique ou postale à [la XXXXXXXX] en justifiant de
                votre identité.
              </Text>
            </Box>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" color="#000091" fontSize="delta">
                Prestataires
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel paddingBottom={4}>
            <Box>
              <Heading as="h2" fontSize="22px">
                Fonction du prestataire (ex : statistique)
              </Heading>
              <Text>
                Nom de l’outil [site + icon ext ]
                <br />
                Adresse :
                <br />
                Standard :
              </Text>
            </Box>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" color="#000091" fontSize="delta">
                Logiciels utilisés
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel paddingBottom={4}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
          </AccordionPanel>
        </AccordionItem>{" "}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" color="#000091" fontSize="delta">
                Liens hypertextes (responsabilité)
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel paddingBottom={4}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
          </AccordionPanel>
        </AccordionItem>{" "}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" color="#000091" fontSize="delta">
                Propriété intellectuelle
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel paddingBottom={4}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
          </AccordionPanel>
        </AccordionItem>{" "}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" color="#000091" fontSize="delta">
                Contact
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel paddingBottom={4}>consequat.</AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  );
};

export default MentionsLegalesAccordions;
