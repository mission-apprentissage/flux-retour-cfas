import {
  Text,
  OrderedList,
  ListItem,
  Flex,
  Img,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  UnorderedList,
} from "@chakra-ui/react";
import React from "react";

import Accordion from "@/components/Accordion/Accordion";
import AidePage from "@/components/Page/AidePage";
import TextHighlight from "@/components/Text/Highlight";
import { usePlausibleTracking } from "@/hooks/plausible";
import useAuth from "@/hooks/useAuth";

const ModalNature = {
  title: "Exemple d'affichage de la donnée Nature",
  content: (
    <>
      <Text>
        La nature de votre organisme est affichée sur le bandeau d’identité sur votre espace Tableau de bord, ainsi que
        sur le Référentiel UAI-SIRET de l’ONISEP. Le Tableau de bord ne peut modifier directement cette donnée.
      </Text>

      <Img src="/images/aide/nature.png" alt="Exemple d'affichage de la donnée Nature" mt={6} />
    </>
  ),
};

const contactData = [
  {
    region: "Auvergne-Rhône-Alpes",
    platform: "Via Compétences Ofeli",
    phone: "-",
    email: "formation.apprentissage@via-competences.fr",
    link: "https://ofeli.via-competences.fr/",
  },
  {
    region: "Bourgogne-Franche-Comté",
    platform: "Emfor Ofeli",
    phone: "03 81 25 52 16",
    email: "offre@emfor-bfc.org",
    link: "https://ofeli.emfor-bfc.org/",
  },
  {
    region: "Bretagne",
    platform: "GREF Bretagne Ofeli",
    phone: "02 99 54 79 17",
    email: "ofeli@gref-bretagne.com",
    link: "https://ofeli.gref-bretagne.com/",
  },
  {
    region: "Centre-Val de Loire",
    platform: "GIP Alfa CVL Ofeli",
    phone: "02 38 77 04 90",
    email: "offre@alfacentre.org",
    link: "https://ofeli.alfacentre.org/",
  },
  {
    region: "Corse",
    platform: "Corsica Orientazione",
    phone: "-",
    email: "-",
    link: "https://intranet.orientazione.isula.corsica/",
  },
  {
    region: "Grand-Est",
    platform: "Base Carif-Oref",
    phone: "03 87 33 63 66",
    email: "formation@grandest.fr",
    link: "https://formation.grandest.fr/contenu/detail/AreYouOf",
  },
  {
    region: "Guadeloupe",
    platform: "Formanoo Guadeloupe",
    phone: "05 90 60 48 48",
    email: "contact.cariforef@guadeloupeformation.com",
    link: "https://betapros.formanoo.org/",
  },
  {
    region: "Guyane",
    platform: "Formanoo",
    phone: "0594 20 40 69",
    email: "pefi.orientation@ctguyane.fr",
    link: "https://betapros12.formanoo.org/",
  },
  {
    region: "Hauts-de-France",
    platform: "C2RP Ofeli",
    phone: "03 20 90 73 04",
    email: "offreformation@c2rp.fr",
    link: "https://www.c2rp.fr/referencer-son-offre-de-formation/ofeli",
  },
  {
    region: "Île-de-France",
    platform: "Dokelio",
    phone: "-",
    email: "apprentissage.dokelio@iledefrance.fr",
    link: "https://dokelio-idf.fr/",
  },
  {
    region: "Martinique",
    platform: "AGEFMA Sofia",
    phone: "-",
    email: "carif-referencement@agefma.fr",
    link: "https://sofia.mq/",
  },
  {
    region: "Normandie",
    platform: "Ofeli",
    phone: "-",
    email: "serviceoffre@cariforefnormandie.fr",
    link: "https://ofeli.cariforefnormandie.fr/login",
  },
  {
    region: "Nouvelle-Aquitaine",
    platform: "Cap Métiers Rafael",
    phone: "-",
    email: "offre@cap-metiers.pro",
    link: "https://www.cap-metiers.pro/pages/412/Connectez-vous-aux-comptes-des-services-Cap-Metiers-Nouvelle-Aquitaine.aspx",
  },
  {
    region: "Occitanie",
    platform: "Carif-Oref Occitanie",
    phone: "05 62 24 85 83",
    email: "offre@cariforefoccitanie.fr",
    link: "https://organismes.cariforefoccitanie.fr/Account/Login?ReturnUrl=%2F&AspxAutoDetectCookieSupport=1",
  },
  {
    region: "Pays de la Loire",
    platform: "SOFI",
    phone: "-",
    email: "offre@cariforef-pdl.org",
    link: "https://pro.choisirmonmetier-paysdelaloire.fr/formation/Sofi-Organismes-de-formation/Onglet/Sofi",
  },
  {
    region: "Provence-Alpes-Côte d'Azur",
    platform: "Carif-Oref PACA",
    phone: "04 42 82 43 23",
    email: "brof@cariforef.fr",
    link: "https://extranet-formation.cariforef.fr/",
  },
  {
    region: "Réunion",
    platform: "Formanoo",
    phone: "-",
    email: "Support",
    link: "https://pros.formanoo.org/",
  },
];

const AideNature = () => {
  const { trackPlausibleEvent } = usePlausibleTracking();
  const { auth } = useAuth();

  return (
    <AidePage>
      <AidePage.Title>Nature, référencement de vos offres de formation en apprentissage</AidePage.Title>

      <AidePage.Header>
        <Text>
          La donnée &quot;Nature&quot; est déduite des relations entre les organismes, déclarées lors du référencement
          des formations d’un organisme (base des Carif-Oref). Trois natures d&apos;organismes peuvent être observées :
          responsable, responsable et formateur, formateur.
        </Text>
      </AidePage.Header>

      <AidePage.Container
        sidebarContent={
          <Flex direction="column" gap={4}>
            <AidePage.SidebarInfos title="Le saviez-vous ?">
              Il est essentiel que votre offre de formation en apprentissage (et continue) soit correctement référencée
              auprès de votre Carif-Oref régional afin d’en assurer la visibilité auprès de multiples outils et systèmes
              d’information, dont le Tableau de bord.
            </AidePage.SidebarInfos>
            <AidePage.SidebarTips title="Les Carif-Oref en régions">
              Les Carif-Oref sont missionnés par les acteurs emploi/formation régionaux pour collecter l’offre de
              formation continue et en apprentissage afin d’en assurer une large diffusion auprès des jeunes, des
              salariés, des demandeurs d’emploi et personnes en reconversion. Cette offre est diffusée via des sites web
              institutionnels régionaux et nationaux.
            </AidePage.SidebarTips>
          </Flex>
        }
      >
        <AidePage.DataResponsibility
          dataResponsibilityText="Carif-Oref"
          dataResponsibilityLink="https://www.intercariforef.org/referencer-son-offre-de-formation"
          modificationText="Plateforme régionale du Carif-Oref"
          modificationLink="/pdf/Carif-Oref-contacts.pdf"
          onDataResponsibilityClick={() =>
            trackPlausibleEvent("referencement_clic_responsable_donnee", undefined, {
              type_user: auth ? auth.organisation.type : "public",
              nom_responsable: "carif_oref",
            })
          }
          onModificationClick={() =>
            trackPlausibleEvent("referencement_clic_modification_donnee", undefined, {
              type_user: auth ? auth.organisation.type : "public",
              nom_responsable: "plateforme_regional_carif_oref",
            })
          }
        />

        <AidePage.Ribbon
          title="Source de la donnée ‘Nature’"
          content="Cette donnée provient du Catalogue des offres de formation en apprentissage et ne peut être modifiée directement par le Tableau de bord. La nature affichée sur votre espace Tableau de bord est déduite des relations entre les organismes qui proviennent de la base des Carif-Oref."
          modalTitle={ModalNature.title}
          modalContent={ModalNature.content}
        />

        <AidePage.FileCard
          category="CARIF-OREF"
          title="Télécharger le fichier"
          description="Plateforme régionale, emails et téléphones"
          fileType="PDF"
          fileSize="417 Ko"
          downloadLink="/pdf/Carif-Oref-contacts.pdf"
          onClick={() =>
            trackPlausibleEvent("referencement_telechargement_tuile_nature", undefined, {
              type_user: auth ? auth.organisation.type : "public",
            })
          }
        />

        <Accordion defaultIndex={0} allowToggle mt={12}>
          <Accordion.Item title='Qu&apos;est-ce que la donnée "Nature" ?'>
            <AidePage.ModalButton
              buttonText="Voir un exemple"
              modalTitle={ModalNature.title}
              modalContent={ModalNature.content}
            />
            <Text>
              Lors du référencement d’une offre de formation, le{" "}
              <AidePage.Link href="https://catalogue-apprentissage.intercariforef.org/">Catalogue</AidePage.Link> des
              formations en apprentissage identifie trois natures :
            </Text>
            <UnorderedList pl={4} mt={2} mb={4}>
              <ListItem>
                Un organisme <strong>responsable</strong> (OFA &quot;classique&quot; ou &quot;hors les murs&quot;) :
                <UnorderedList styleType="'- '">
                  <ListItem>est signataire de la convention de formation en apprentissage ;</ListItem>
                  <ListItem>demande et reçoit l’accord de prise en charge de l’OPCO ;</ListItem>
                  <ListItem>
                    est responsable auprès de l’administration du respect de ses missions et obligations ;
                  </ListItem>
                  <ListItem>réceptionne les vœux formulés par les jeunes pour Affelnet ;</ListItem>
                  <ListItem>
                    délègue la formation à un autre organisme de formation dans le cadre d’une convention.
                  </ListItem>
                </UnorderedList>
              </ListItem>
              <ListItem>
                Un organisme <strong>responsable et formateur</strong> dispense également des actions de formation en
                plus des missions mentionnées ci-dessus.
              </ListItem>
              <ListItem>
                Un organisme <strong>formateur</strong>
                <UnorderedList styleType="'- '">
                  <ListItem>est garant du respect de la mise en œuvre pédagogique de la formation.</ListItem>
                  <ListItem>
                    il peut être appelé prestataire de formation, et peut également être connu sous le nom d’UFA.
                  </ListItem>
                </UnorderedList>
              </ListItem>
            </UnorderedList>
            <TextHighlight>
              Si la cellule contient « inconnue », cela signifie que l’organisme n’a pas déclaré son offre de formation
              dans la base de son Carif-Oref. Voici ci-dessous comment la déclarer ou la corriger.
            </TextHighlight>
          </Accordion.Item>

          <Accordion.Item title="Si ma nature est indiquée “Inconnue”, comment la corriger ?">
            <AidePage.ModalButton
              buttonText="Voir un exemple"
              modalTitle="Affichage d’une nature ‘Inconnue’"
              modalContent={
                <>
                  <Text>
                    Si la cellule contient « inconnue », cela signifie que l&apos;offre de formation n’est pas collectée
                    par le Carif-Oref. Veuillez déclarer vos formations en apprentissage auprès du Carif-Oref régional.
                  </Text>

                  <Img src="/images/aide/nature_inconnue.png" alt="Affichage d’une nature ‘Inconnue’" mt={6} />
                </>
              }
            />
            <Text>
              Si la cellule contient « inconnue », cela signifie que l’offre de formation n’est pas collectée par le
              Carif-Oref. Nous vous invitons à référencer vos formations en apprentissage auprès du{" "}
              <AidePage.Link href="https://www.intercariforef.org/referencer-son-offre-de-formation">
                Carif-Oref régional
              </AidePage.Link>
              .
            </Text>
          </Accordion.Item>

          <Accordion.Item title="Comment déclarer une formation en apprentissage à mon Carif-Oref, ou en ajouter une ?">
            <OrderedList pl={4}>
              <ListItem>
                Si votre CFA n’a jamais déclaré ses formations auprès de son Carif-Oref :
                <Text>
                  Pour ajouter une offre de formation au Catalogue, merci de la déclarer auprès du Carif-Oref de votre
                  région en allant sur la page{" "}
                  <AidePage.Link href="https://www.intercariforef.org/referencer-son-offre-de-formation">
                    &quot;référencer son offre de formation&quot;
                  </AidePage.Link>
                  . Les référencements et mises à jour effectuées dans les bases “Offre des Carif-Oref” sont répercutés
                  quotidiennement dans le “Catalogue des offres de formations en apprentissage” (délai 72h entre
                  modifications demandées et publication).
                </Text>
              </ListItem>
              <ListItem>
                Si votre CFA a déjà déclaré ses formations auprès de votre Carif-Oref :
                <Text>
                  Votre formation devrait figurer dans le Catalogue. Si ce n’est pas le cas, merci de nous signaler
                  votre situation par mail :{" "}
                  <AidePage.Link href="mailto:pole-apprentissage@intercariforef.org">
                    pole-apprentissage@intercariforef.org
                  </AidePage.Link>{" "}
                  avec les informations suivantes :
                </Text>
                <UnorderedList pl={4}>
                  <ListItem>SIRET ;</ListItem>
                  <ListItem>RNCP et/ou le code diplôme ;</ListItem>
                  <ListItem>
                    la période d’inscription telle que mentionnée dans le catalogue Carif-Oref (exprimée en AAAA-MM) ;
                  </ListItem>
                  <ListItem>le lieu de la formation (code commune INSEE ou à défaut code postal) ;</ListItem>
                  <ListItem>
                    mail de la personne signalant l’erreur ;
                    <Text>
                      Une investigation sera menée par le Réseau des Carif-Oref pour le traitement de cette anomalie. Il
                      reviendra vers vous dès la résolution de ce dysfonctionnement via le mail que vous avez indiqué.
                    </Text>
                  </ListItem>
                </UnorderedList>
              </ListItem>
            </OrderedList>
          </Accordion.Item>

          <Accordion.Item title="La nature indiquée sur mon espace est incorrecte. Comment la corriger ?">
            <AidePage.ModalButton
              buttonText="Voir un exemple"
              modalTitle="Identifier ses formations déclarées au Carif-Oref"
              modalContent={
                <>
                  <Text>
                    Sur votre fiche établissement, disponible dans l’onglet ‘Liste des organismes’ du Catalogue des
                    formations, cliquez sur les formations associées. Chaque fiche formation restitue l’information sur
                    l’organisme responsable et formateur (Nature).
                  </Text>

                  <Img
                    src="/images/aide/nature_formation.png"
                    alt="Identifier ses formations déclarées au Carif-Oref"
                    mt={6}
                  />
                </>
              }
            />
            <Text>
              Pour comprendre son origine, allez dans l’onglet ‘
              <AidePage.Link href="https://catalogue-apprentissage.intercariforef.org/recherche/etablissements">
                Liste des organismes
              </AidePage.Link>
              ’ du Catalogue et cherchez votre établissement avec un UAI ou Siret. Sur la fiche de votre organisme,
              cliquez sur les formations associées. Chaque fiche formation restitue un organisme responsable et
              formateur.
            </Text>
            <Text>
              Si la nature associée à votre organisme vous semble incorrecte, il se peut que l’offre de formation est
              mal collectée par le Carif-Oref. Il faudra donc la faire vérifier par votre Carif-Oref régional (contacts
              régionaux téléchargeables ci-dessus).
            </Text>
            <Text>La modification de la nature d’un organisme impacte ses relations avec les autres organismes.</Text>
          </Accordion.Item>

          <Accordion.Item title="Pourquoi déclarer mon offre de formation ?">
            <Text>
              Vous assurez la visibilité de votre catalogue de formations auprès d’un panel de visiteurs variés :
              <UnorderedList pl={4} mt={2} mb={4}>
                <ListItem>
                  Visiteurs du{" "}
                  <AidePage.Link href="https://www.intercariforef.org/formations/recherche-formations.html">
                    portail interrégional formation emploi
                  </AidePage.Link>
                  , site national du réseau des Carif-Oref
                </ListItem>
                <ListItem>
                  Visiteurs grand public du site national{" "}
                  <AidePage.Link href="https://labonnealternance.apprentissage.beta.gouv.fr/">
                    &quot;La bonne alternance&quot;
                  </AidePage.Link>
                </ListItem>
                <ListItem>
                  Utilisateurs grand public de la page{" "}
                  <AidePage.Link href="https://candidat.francetravail.fr/formations/recherche?range=0-9&tri=0">
                    &quot;Trouver ma formation&quot;
                  </AidePage.Link>{" "}
                  du site France Travail
                </ListItem>
                <ListItem>
                  Visiteurs du site{" "}
                  <AidePage.Link href="https://www.1jeune1solution.gouv.fr/">#1jeune1solution</AidePage.Link>
                </ListItem>
              </UnorderedList>
              <Text>
                Auprès du public professionnel, tels que les prescripteurs, les orienteurs, les accompagnants…
              </Text>
              <UnorderedList pl={4} mt={2} mb={4}>
                <ListItem>Ministères éducatifs (Parcoursup, Affelnet), Conseils régionaux, OPCO…</ListItem>
                <ListItem>
                  Visiteurs du{" "}
                  <AidePage.Link href="https://catalogue-apprentissage.intercariforef.org/">
                    Catalogue des offres de formations en apprentissage
                  </AidePage.Link>
                  , du réseau des Carif-Oref
                </ListItem>
                <ListItem>
                  Professionnels et les institutions s’intéressant au marché de la formation professionnelle
                </ListItem>
              </UnorderedList>
            </Text>
          </Accordion.Item>

          <Accordion.Item title="Je suis CFA Responsable (classique ou hors-les-murs) : dois-je référencer l’offre de formation au Carif-Oref ?">
            <Text>
              L’organisme responsable doit déclarer toutes ses formations auprès des différents Carif-Oref. S’il délègue
              la déclaration à un ou à ses organismes formateurs, il devra veiller à l’exhaustivité de l’offre de
              formation et à sa non-redondance.
            </Text>
            <Text>
              Source :{" "}
              <AidePage.Link href="/pdf/vademecum.pdf" isExternal>
                Vademecum
              </AidePage.Link>{" "}
              de la collecte (page 3)
            </Text>
          </Accordion.Item>

          <Accordion.Item title="Comment contacter mon Carif-Oref régional et référencer mon offre de formation ?">
            <Text>
              En tant que CFA, vous devez déclarer votre offre de formation sur le site institutionnel de la plateforme
              SI, tels que Ofeli, Formanoo, Rafael, SOFI… En cas de difficultés, veuillez contacter votre Carif-Oref.
            </Text>
            <Table variant="striped" size="md" mt={12} fontSize="omega">
              <Thead>
                <Tr>
                  <Th width="40%">Région</Th>
                  <Th width="30%">Plateforme</Th>
                  <Th width="20%">Téléphone</Th>
                  <Th width="10%">Email</Th>
                </Tr>
              </Thead>
              <Tbody>
                {contactData.map((contact, index) => (
                  <Tr key={index}>
                    <Td fontWeight="bold">{contact.region}</Td>
                    <Td>
                      <AidePage.Link href={contact.link} isExternal textDecoration="underLine">
                        {contact.platform}
                      </AidePage.Link>
                    </Td>
                    <Td>{contact.phone}</Td>
                    <Td>
                      {contact.email !== "-" ? (
                        <AidePage.Link href={`mailto:${contact.email}`} isExternal>
                          {contact.email}
                        </AidePage.Link>
                      ) : (
                        contact.email
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Accordion.Item>
        </Accordion>
      </AidePage.Container>
    </AidePage>
  );
};

export default AideNature;
