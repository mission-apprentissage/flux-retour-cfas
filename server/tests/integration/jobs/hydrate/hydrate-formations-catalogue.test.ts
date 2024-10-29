import { strict as assert } from "assert";
import { Readable } from "node:stream";

import { ObjectId } from "mongodb";
import nock from "nock";
import { IFormationCatalogue } from "shared/models/data/formationsCatalogue.model";
import { it, describe } from "vitest";

import { formationsCatalogueDb } from "@/common/model/collections";
import { WithStringId } from "@/common/model/types";
import config from "@/config";
import { hydrateFormationsCatalogue } from "@/jobs/hydrate/hydrate-formations-catalogue";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

//
// CFD pas obligatoire

const fakeData: Omit<
  IFormationCatalogue,
  | "_id"
  | "cle_ministere_educatif"
  | "intitule_long"
  | "cfd"
  | "rncp_code"
  | "duree"
  | "annee"
  | "etablissement_gestionnaire_id"
  | "etablissement_gestionnaire_siret"
  | "etablissement_gestionnaire_uai"
  | "etablissement_formateur_id"
  | "etablissement_formateur_siret"
  | "etablissement_formateur_uai"
> = {
  cfd_outdated: false,
  nom_academie: "academie",
  num_academie: "01",
  code_postal: "a",
  code_commune_insee: "a",
  num_departement: "a",
  region: "a",
  localite: "a",
  intitule_court: "a",
  diplome: "a",
  niveau: "a",
  onisep_url: "a",
  onisep_intitule: "a",
  onisep_libelle_poursuite: "a",
  onisep_lien_site_onisepfr: "a",
  onisep_discipline: "a",
  duree_incoherente: false,
  annee_incoherente: false,
  lieu_formation_adresse: "a",
  lieu_formation_siret: "a",
  id_formation: "a",
  niveau_formation_diplome: "a",
  niveau_entree_obligatoire: null,
  entierement_a_distance: false,
  date_debut: [],
  date_fin: [],
  rome_codes: [],
  periode: [],
  tags: [],
  ids_action: [],
  modalites_entrees_sorties: [],
  nom_departement: "a",
  etablissement_gestionnaire_habilite_rncp: true,
  etablissement_gestionnaire_certifie_qualite: false,
  etablissement_gestionnaire_adresse: null,
  etablissement_gestionnaire_code_postal: null,
  etablissement_gestionnaire_code_commune_insee: null,
  etablissement_gestionnaire_localite: null,
  etablissement_gestionnaire_entreprise_raison_sociale: "a",
  etablissement_gestionnaire_region: "a",
  etablissement_gestionnaire_num_departement: null,
  etablissement_gestionnaire_nom_departement: null,
  etablissement_gestionnaire_nom_academie: null,
  etablissement_gestionnaire_num_academie: null,
  etablissement_gestionnaire_date_creation: "a",
  etablissement_formateur_enseigne: null,
  etablissement_formateur_habilite_rncp: true,
  etablissement_formateur_certifie_qualite: false,
  etablissement_formateur_adresse: null,
  etablissement_formateur_code_postal: null,
  etablissement_formateur_code_commune_insee: null,
  etablissement_formateur_localite: null,
  etablissement_formateur_entreprise_raison_sociale: "a",
  etablissement_formateur_region: "a",
  etablissement_formateur_num_departement: null,
  etablissement_formateur_nom_departement: null,
  etablissement_formateur_nom_academie: null,
  etablissement_formateur_num_academie: null,
  etablissement_formateur_date_creation: "a",
  etablissement_reference: "gestionnaire",
} as const;

describe("Job hydrateFormationsCatalogue", () => {
  useMongo();
  const formationsCatalogue: WithStringId<IFormationCatalogue>[] = [
    {
      _id: id(1),
      cle_ministere_educatif: "AAA",
      intitule_long: "CHIMIE (MASTER)",
      cfd: "aa",
      rncp_code: "aa",
      duree: "2",
      annee: "1",
      etablissement_gestionnaire_id: "1",
      etablissement_gestionnaire_siret: "1",
      etablissement_gestionnaire_uai: "1",
      etablissement_formateur_id: "1",
      etablissement_formateur_siret: "1",
      etablissement_formateur_uai: "1",
      ...fakeData,
    },
    {
      _id: id(2),
      cle_ministere_educatif: "BBB",
      intitule_long: "COUVREUR (CAP)",
      cfd: "aa",
      rncp_code: "aa",
      duree: "2",
      annee: "1",
      etablissement_gestionnaire_id: "1",
      etablissement_gestionnaire_siret: "1",
      etablissement_gestionnaire_uai: "1",
      etablissement_formateur_id: "1",
      etablissement_formateur_siret: "1",
      etablissement_formateur_uai: "1",
      ...fakeData,
    },
  ];

  it("Met à jour les formations de la collection formationsCatalogue", async () => {
    nock(config.mnaCatalogApi.endpoint)
      .persist()
      .get(new RegExp("v1/entity/formations.json.*"))
      .reply(200, () => Readable.from([JSON.stringify(formationsCatalogue)]), {
        "content-type": "application/json",
      });

    await formationsCatalogueDb().insertOne({
      _id: new ObjectId(id(1)),
      cle_ministere_educatif: "AAA",
      intitule_long: "JARDINIER PAYSAGISTE (CAPA)",
      cfd: "aa",
      rncp_code: "aa",
      duree: "2",
      annee: "1",
      etablissement_gestionnaire_id: "1",
      etablissement_gestionnaire_siret: "1",
      etablissement_gestionnaire_uai: "1",
      etablissement_formateur_id: "1",
      etablissement_formateur_siret: "1",
      etablissement_formateur_uai: "1",
      ...fakeData,
    });

    await hydrateFormationsCatalogue();

    assert.deepStrictEqual(
      await formationsCatalogueDb().find().toArray(),
      formationsCatalogue.map((formation) => ({
        ...formation,
        _id: new ObjectId(formation._id),
      }))
    );
  });

  // type issue with arrayOfOrNull and bson-schema-to-typescript
  const formationsCatalogueCompletes: WithStringId<any>[] = [
    {
      _id: id(1),
      cle_ministere_educatif: "082581P012X1300279230016313002792300171-33063#L01",
      cfd: "46X25201",
      cfd_specialite: null,
      cfd_outdated: false,
      cfd_date_fermeture: "2027-08-31T00:00:00.000Z",
      cfd_entree: null,
      nom_academie: "Bordeaux",
      num_academie: "4",
      code_postal: "33300",
      code_commune_insee: "33063",
      num_departement: "33",
      nom_departement: "Gironde",
      region: "Nouvelle-Aquitaine",
      localite: "Bordeaux",
      nom: null,
      intitule_rco: "Titre Conseiller technique cycles",
      intitule_long: "CONSEILLER TECHNIQUE CYCLES (ANFA)",
      intitule_court: "CONSEILLER TECH CYCLES",
      diplome: "TH DE NIV 4 ORGANISMES GESTIONNAIRES DIVERS",
      niveau: "4 (BAC...)",
      onisep_url: null,
      onisep_intitule: null,
      onisep_libelle_poursuite: null,
      onisep_lien_site_onisepfr: null,
      onisep_discipline: null,
      onisep_domaine_sousdomaine: null,
      rncp_code: "RNCP36721",
      rncp_intitule: "Conseiller technique cycles",
      rncp_eligible_apprentissage: true,
      rncp_details: {
        date_fin_validite_enregistrement: "2027-07-19T23:00:00.000Z",
        active_inactive: "ACTIVE",
        etat_fiche_rncp: "Publiée",
        niveau_europe: "niveau4",
        code_type_certif: "TP",
        type_certif: null,
        ancienne_fiche: ["RNCP18119", "RNCP34197"],
        nouvelle_fiche: null,
        demande: 0,
        certificateurs: [
          {
            certificateur: "ASS NATIONALE FORMATION AUTOMOBILE",
            siret_certificateur: "78467149700385",
          },
          {
            certificateur: "CPNE des services de l’automobile",
            siret_certificateur: null,
          },
        ],
        nsf_code: "252r",
        nsf_libelle:
          "Entretien et réparation des automobiles, cycles et motocycles, véhicules industriels, engins agricoles et de chantiers; Entretien, maintenance, réparation de moteurs thermiques et de machineries de navire",
        romes: [
          {
            rome: "D1211",
            libelle: "Vente en articles de sport et loisirs",
          },
          {
            rome: "I1607",
            libelle: "Réparation de cycles, motocycles et motoculteurs de loisirs",
          },
        ],
        blocs_competences: [
          {
            numero_bloc: "",
            intitule: "Montage de vélos personnalisés ",
            liste_competences:
              "<p>Réaliser une étude posturale afin de monter un vélo personnalisé adapté à la morphologie et à la pratique du client</p>  <p>Reporter les mesures de la fiche de cotes sur le cycle à l’aide des outils nécessaires pour adapter le vélo à la morphologie du client</p>  <p>Choisir le cadre et la fourche, afin d’adapter le cycle aux attentes et à la pratique du client, en le questionnant sur ses besoins</p>  <p>Choisir les éléments du groupe de la transmission et les éléments périphériques, afin d’adapter le cycle aux attentes et à la pratique du client en le questionnant sur ses besoins</p> ",
            modalites_evaluation:
              '<p style="text-align: justify;">Mise en situation portant sur la réalisation d’une étude posturale avec proposition des éléments adaptés à la demande du client</p> ',
          },
          {
            numero_bloc: "",
            intitule: "Préparation et assemblage cycles ",
            liste_competences:
              '<ul>  <li style="text-align: justify;">Contrôler à la réception des cycles, les éventuelles anomalies dues à la livraison (chocs sur le cadre, nombre de produits réceptionnés, nombre de pièces…), afin de pouvoir les assembler dans le respect de la réglementation et des procédures qualité en vigueur et en agençant son poste de travail</li>  <li style="text-align: justify;">Informer sa hiérarchie des anomalies de réception observées sur les cycles ou les bons de commandes, afin de réajuster les commandes auprès des fournisseurs en respectant les procédures qualité en vigueur dans l’entreprise</li>  <li style="text-align: justify;">Assembler les différents éléments du cycle, à l’aide des outils adaptés, en préparant le cadre dans le respect de la réglementation, des règles d’hygiène, sécurité, environnement en vigueur et en s’appuyant sur la documentation et les préconisations constructeur</li>  <li style="text-align: justify;">Assembler le jeu de direction et la fourche, à l’aide des outils adaptés, afin de garantir le fonctionnement, le confort et la sécurité du cycle, en effectuant des opérations de réglage dans le respect de la réglementation des règles d’hygiène sécurité, environnement en vigueur, et en s’appuyant sur la documentation et les préconisations constructeur</li>  <li style="text-align: justify;">Assembler les éléments de la transmission (pédalier, chaine, systèmes de vitesse, cassette), à l’aide des outils adaptés, afin de garantir le fonctionnement et la sécurité du cycle, en effectuant des opérations de réglage dans le respect de la réglementation des règles d’hygiène sécurité, environnement en vigueur, et en s’appuyant sur la documentation et les préconisations constructeur</li>  <li style="text-align: justify;">Assembler les éléments du système de freinage à l’aide des outils adaptés, afin de garantir le fonctionnement et la sécurité du cycle, en effectuant des opérations de réglage dans le respect de la réglementation des règles d’hygiène sécurité, environnement en vigueur, et en s’appuyant sur la documentation et les préconisations constructeur</li>  <li style="text-align: justify;">Assembler les éléments de la roue à l’aide des outils adaptés, afin de garantir le fonctionnement et la sécurité du cycle, en effectuant des opérations de réglage dans le respect de la réglementation des règles d’hygiène sécurité, environnement en vigueur et en s’appuyant sur la documentation et les préconisations constructeur</li>  <li style="text-align: justify;">Contrôler les roues afin de garantir le fonctionnement et la sécurité du cycle, en effectuant des opérations de réglage dans le respect de la réglementation des règles d’hygiène sécurité, environnement en vigueur et en s’appuyant sur la documentation et les préconisations constructeur</li>  <li style="text-align: justify;">Assembler à l’aide des outils adaptés, les éléments de la périphérie afin de garantir le confort et la sécurité du cycle, en effectuant des opérations de réglage dans le respect de la réglementation des règles d’hygiène sécurité, environnement en vigueur et en s’appuyant sur la documentation et les préconisations constructeur</li> </ul> ',
            modalites_evaluation:
              '<p style="text-align: justify;">Mise en situation portant sur le montage et le réglage d’un cycle à partir d’un cadre nu</p> ',
          },
          {
            numero_bloc: "",
            intitule: "Vente de cycles et produits du cycle",
            liste_competences:
              '<p style="text-align: justify;">Accueillir le client de façon positive, sur site et à distance, afin de créer un climat favorable à la vente</p>  <p style="text-align: justify;">Ecouter activement les informations communiquées par le client, au téléphone ou dans l’espace de vente, pour identifier son besoin en appliquant les techniques de questionnement et de reformulation</p>  <p style="text-align: justify;">Argumenter sur les cycles ou les vélos à assistance électrique afin d’apporter une réponse adaptée au client, en utilisant les techniques d’argumentation commerciale et en s’appuyant sur la connaissance technique des cycles et des produits associés</p>  <p style="text-align: justify;">Faire émerger les besoins recensés précédemment pour compléter la vente principale en proposant des équipements et accessoires au client, en le conseillant sur les éléments de sécurité et de confort et en respectant la règlementation en vigueur</p>  <p style="text-align: justify;">Conclure la vente du cycle ou du vélo à assistance électrique et facturer en vue de procéder à l\'enregistrement comptable de la transaction, dans le respect des process et de la règlementation</p>  <p style="text-align: justify;">Rédiger une fiche produit afin d’animer et mettre à jour le site internet du magasin de cycle, en respectant la législation en matière de vente à distance</p>  <p style="text-align: justify;">Traiter les réclamations des clients afin de maintenir leur satisfaction et de contribuer à leur fidélisation, en respectant le process de l’entreprise et la réglementation en vigueur</p>  <p style="text-align: justify;">Aménager l’espace de vente, afin de mettre en valeur les cycles et les produits du cycle, en appliquant le règles de marchandisage et en respectant les législations relatives à la signalétique et l’étiquetage</p>  <p style="text-align: justify;">Contribuer à la gestion des stocks du magasin cycle, afin d\'anticiper les besoins et assurer les commandes en actualisant l\'outil informatique dédié en établissant un inventaire.</p> ',
            modalites_evaluation:
              '<p style="text-align: justify;">Mise en situation portant sur la vente d’un vélo ou d’un VAE en magasin suivi d’un entretien oral portant sur le véhicule non vu lors de la mise en situation</p>  <p style="text-align: justify;">Etude de cas portant sur la promotion des ventes et la gestion administrative des activités de commercialisation</p> ',
          },
          {
            numero_bloc: "",
            intitule: "Organisation et Intervention après-vente cycles ",
            liste_competences:
              '<ul>  <li>Recueillir les informations utiles auprès du client, afin d’identifier les dysfonctionnements du cycle en s’appuyant sur la documentation et les préconisations constructeur</li>  <li>Contrôler le cycle, afin de repérer d’éventuels dysfonctionnements non identifiés par le client, en s’appuyant sur la documentation constructeur, en utilisant le outils adaptés et en agençant son poste de travail</li>  <li>Effectuer le remplacement des pièces usées ou qui dysfonctionnent, pour remettre le cycle en sécurité, en respectant la réglementation en vigueur, en s’appuyant sur la documentation et les préconisations constructeur</li>  <li>Contrôler l’usure des pièces (freins, suspension, transmission, pneus, câblages…) et les réglages, en utilisant les outils adaptés,afin d’ apprécier leur état de fonctionnement et garantir la sécurité d’utilisation du cycle dans le respect de la réglementation en vigueur</li>  <li>Réaliser les opérations d’entretien courant du cycle, en utilisant les outils adaptés, pour en garantir sa sécurité d’utilisation, en respectant la réglementation en vigueur</li>  <li>Adopter une démarche de diagnostic adaptée, afin d’identifier les dysfonctionnements du cycle, en émettant des hypothèses et en s’appuyant sur les informations utiles recueillies auprès du client et sur la documentation et les préconisations constructeur</li>  <li>Vérifier les hypothèses émises, afin de mettre en œuvre les contrôles et la remise en conformité des éléments défaillants du cycle en les hiérarchisant et en s’appuyant sur la documentation et les préconisations constructeur</li>  <li>  <p>Contrôler le vélo à assistance électrique (VAE) afin de repérer d’éventuels dysfonctionnements identifiés par le client, en s’appuyant sur un diagnostic établi et sur la documentation et les préconisations constructeur, en respectant le règles d’hygiène et de sécurité en vigueur</p>  </li>  <li>  <p>Remplacer les éléments défectueux selon les préconisations et spécificités constructeur (moteur, connecteurs, fusibles, batterie, capteurs.) afin de garantir le bon fonctionnement du VAE et en respectant le règles d’hygiène et de sécurité en vigueur</p>  </li>  <li>  <p style="text-align:justify">Etablir  un ordre de réparation ou un devis énumérant les travaux à réaliser  pour la prise en charge du cycle à l’atelier, à l’aide de supports informatiques,   suite à l’identification de la demande du client, à l’examen de l’état du cycle et en respectant la réglementation en vigueur</p>  </li>  <li>  <p style="text-align:justify">Réaliser une restitution personnalisée du cycle, afin de valoriser la prestation réalisée en apportant des conseils d’entretien au client, en s’appuyant sur ses connaissances techniques et en respectant la réglementation en vigueur</p>  </li>  <li>  <p>Planifier une intervention et sa faisabilité en agençant son poste de travail, en respectant la réglementation en vigueur et en actualisant la documentation technique, afin d’améliorer sa productivité.</p>   <p style="text-align:justify"></p>  </li> </ul> ',
            modalites_evaluation:
              '<p style="text-align: justify;">Mise en situation portant sur le diagnostic et la remise en état d’un cycle présentant un ou plusieurs dysfonctionnements</p>  <p style="text-align: justify;">Entretienoral portant sur le diagnostic d’un VAE</p>  <p></p>  <p style="text-align: justify;">Mise en situation portant sur la planification de 3 ou 4 rdv d’interventions sur un support (agenda ou logiciel d’atelier)</p> ',
          },
        ],
        voix_acces: null,
        partenaires: [
          {
            Nom_Partenaire: "INSTITUT NATIONAL DU CYCLE ET MOTOCYCLE",
            Siret_Partenaire: "78471393500038",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "INSTITUT NATIONAL DU CYCLE ET MOTOCYCLE",
            Siret_Partenaire: "78471393500038",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "CHAMB COMMERC INDUSTRIE NICE COTE D'AZUR",
            Siret_Partenaire: "18060001700016",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "INSTITUT NATIONAL DU CYCLE ET MOTOCYCLE",
            Siret_Partenaire: "78471393500053",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "LP PRIVE DE LA S E P R",
            Siret_Partenaire: "77990334300027",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "CFA SAINT-MALO",
            Siret_Partenaire: "13002794900168",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "CFA ACADEMIQUE DE L'ACADEMIE DE STRASBOURG",
            Siret_Partenaire: "18671553800044",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "PURPLE CAMPUS",
            Siret_Partenaire: "89079142900040",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "PURPLE CAMPUS",
            Siret_Partenaire: "89079142900040",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "CFA ACADEMIQUE DE L'ACADEMIE DE STRASBOURG",
            Siret_Partenaire: "18671553800044",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "CAMPUS DES METIERS 37",
            Siret_Partenaire: "13002798000080",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "CENTRE DE FORMATION DE L'ARTISANAT DE MULHOUSE",
            Siret_Partenaire: "18670223900101",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "LP PRIVE DE LA S E P R",
            Siret_Partenaire: "77990334300027",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "INSTITUT NATIONAL DU CYCLE ET MOTOCYCLE",
            Siret_Partenaire: "78471393500053",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "CAMPUS DES METIERS 37",
            Siret_Partenaire: "13002798000080",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "CFA SAINT-MALO",
            Siret_Partenaire: "13002794900168",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "CENTRE DE FORMATION DE L'ARTISANAT DE MULHOUSE",
            Siret_Partenaire: "18670223900101",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "CHAMB COMMERC INDUSTRIE NICE COTE D'AZUR",
            Siret_Partenaire: "18060001700016",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
          {
            Nom_Partenaire: "CMAR NOUVELLE AQUITAINE",
            Siret_Partenaire: "13002792300015",
            Habilitation_Partenaire: "HABILITATION_ORGA_FORM",
          },
        ],
        rncp_outdated: false,
      },
      rome_codes: ["D1211", "I1607"],
      periode: ["2021-09-01T00:00:00.000Z"],
      capacite: null,
      duree: "2",
      duree_incoherente: false,
      annee: "X",
      annee_incoherente: false,
      published: false,
      forced_published: false,
      distance: 5280,
      lieu_formation_adresse:
        "Institut des Métiers de l'Artisanat Interdépartementale Section Gironde ISFORA 5 ter rue du Cardinal Richaud",
      lieu_formation_adresse_computed: "7 Place Gambetta, 33000 Bordeaux",
      lieu_formation_siret: null,
      id_rco_formation: "02_201907067202|02_00208943|82581",
      id_formation: "02_201907067202",
      id_action: "02_00208943",
      ids_action: ["02_00208943"],
      id_certifinfo: "82581",
      tags: ["2021"],
      libelle_court: "TH4-X",
      niveau_formation_diplome: "46X",
      distance_lieu_formation_etablissement_formateur: null,
      niveau_entree_obligatoire: null,
      entierement_a_distance: false,
      france_competence_infos: null,
      catalogue_published: false,
      date_debut: ["2021-09-02T00:00:00.000Z"],
      date_fin: ["2023-12-30T00:00:00.000Z"],
      modalites_entrees_sorties: [false],
      id_RCO: "02_00208943_02_201907067202_2_00208943",
      etablissement_gestionnaire_id: "60403396d5e868001c9347ae",
      etablissement_gestionnaire_siret: "13002792300163",
      etablissement_gestionnaire_enseigne: "CMA DE LA GIRONDE",
      etablissement_gestionnaire_uai: null,
      etablissement_gestionnaire_published: false,
      etablissement_gestionnaire_habilite_rncp: false,
      etablissement_gestionnaire_certifie_qualite: true,
      etablissement_gestionnaire_adresse: "46 RUE GENERAL DE LARMINAT",
      etablissement_gestionnaire_code_postal: "33000",
      etablissement_gestionnaire_code_commune_insee: "33063",
      etablissement_gestionnaire_localite: "BORDEAUX",
      etablissement_gestionnaire_complement_adresse: null,
      etablissement_gestionnaire_cedex: "33074",
      etablissement_gestionnaire_entreprise_raison_sociale:
        "CHAMBRE DE METIERS ET DE L'ARTISANAT DE REGION NOUVELLE AQUITAINE",
      etablissement_gestionnaire_region: "Nouvelle-Aquitaine",
      etablissement_gestionnaire_num_departement: "33",
      etablissement_gestionnaire_nom_departement: "Gironde",
      etablissement_gestionnaire_nom_academie: "Bordeaux",
      etablissement_gestionnaire_num_academie: "4",
      etablissement_gestionnaire_siren: "130027923",
      etablissement_gestionnaire_nda: null,
      etablissement_gestionnaire_date_creation: "2020-12-30T00:00:00.000Z",
      etablissement_formateur_id: "60403399d5e868001c9347b6",
      etablissement_formateur_siret: "13002792300171",
      etablissement_formateur_enseigne: "INSTITUT METIERS ARTISANAT 33",
      etablissement_formateur_uai: "0331707B",
      etablissement_formateur_published: true,
      etablissement_formateur_habilite_rncp: false,
      etablissement_formateur_certifie_qualite: true,
      etablissement_formateur_adresse: "25 RUE CARDINAL RICHAUD",
      etablissement_formateur_code_postal: "33300",
      etablissement_formateur_code_commune_insee: "33063",
      etablissement_formateur_localite: "BORDEAUX",
      etablissement_formateur_complement_adresse: null,
      etablissement_formateur_cedex: null,
      etablissement_formateur_entreprise_raison_sociale:
        "CHAMBRE DE METIERS ET DE L'ARTISANAT DE REGION NOUVELLE AQUITAINE",
      etablissement_formateur_region: "Nouvelle-Aquitaine",
      etablissement_formateur_num_departement: "33",
      etablissement_formateur_nom_departement: "Gironde",
      etablissement_formateur_nom_academie: "Bordeaux",
      etablissement_formateur_num_academie: "4",
      etablissement_formateur_siren: "130027923",
      etablissement_formateur_nda: null,
      etablissement_formateur_date_creation: "2020-12-30T00:00:00.000Z",
      etablissement_reference: "gestionnaire",
      etablissement_reference_published: true,
      etablissement_reference_habilite_rncp: false,
      etablissement_reference_certifie_qualite: true,
      etablissement_reference_date_creation: null,
      bcn_mefs_10: [],
      lieu_formation_geo_coordonnees: "44.841225,-0.5800364",
      geo_coordonnees_etablissement_gestionnaire: "44.833082,-0.597784",
      geo_coordonnees_etablissement_formateur: "-0.564629,44.886959",
      idea_geo_coordonnees_etablissement: "44.841225,-0.5800364",
      created_at: "2021-08-07T23:54:35.122Z",
      last_update_at: "2022-11-06T06:13:05.599Z",
      lieu_formation_geo_coordonnees_computed: "44.85952,-0.565202",
    },
  ];
  it("Enregistre les données complètes", async () => {
    nock(config.mnaCatalogApi.endpoint)
      .persist()
      .get(new RegExp("v1/entity/formations.json.*"))
      .reply(200, () => Readable.from([JSON.stringify(formationsCatalogueCompletes)]), {
        "content-type": "application/json",
      });

    await hydrateFormationsCatalogue();
  });
});
