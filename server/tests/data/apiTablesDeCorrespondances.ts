import type { ICertification } from "api-alternance-sdk";

export const dataForGetSiretInfo = {
  adresse: "ADRESSE DE TEST - TOULOUSE FRANCE",
  code_postal: "31500",
  code_commune_insee: "31555",
  localite: "TOULOUSE",
  geo_coordonnees: "40.000000,1.000000",
  region_implantation_nom: "Occitanie",
  region_implantation_code: "76",
  num_departement: "31",
  nom_departement: "Haute-Garonne",
  nom_academie: "Toulouse",
  num_academie: "16",
};

export const apiAlternanceCertifFixture = [
  {
    identifiant: {
      cfd: "1463430A",
      rncp: "RNCP34945",
      rncp_anterieur_2019: false,
    },
    base_legale: {
      cfd: {
        creation: null,
        abrogation: new Date("2028-12-21T22:59:59.000Z"),
      },
    },
    blocs_competences: {
      rncp: [
        {
          code: "RNCP34945BC02",
          intitule: "Intégration d’une démarche de résolution de problèmes sur le terrain",
        },
        {
          code: "RNCP34945BC04",
          intitule: "Management des projets et des hommes",
        },
        {
          code: "RNCP34945BC01",
          intitule: "Diagnostic des situations professionnelles et environnementales",
        },
        {
          code: "RNCP34945BC03",
          intitule: "Mise en place d’une politique de maîtrise des risques sanitaires et environnementaux",
        },
      ],
    },
    continuite: {
      cfd: null,
      rncp: [
        {
          code: "RNCP38510",
          activation: new Date("2023-12-22T23:00:00.000Z"),

          fin_enregistrement: new Date("2028-12-21T22:59:59.000Z"),

          courant: false,
          actif: true,
        },
        {
          code: "RNCP34945",
          activation: null,
          fin_enregistrement: new Date("2023-09-14T21:59:59.000Z"),

          courant: true,
          actif: false,
        },
        {
          code: "RNCP4693",
          activation: null,
          fin_enregistrement: new Date("2020-08-23T21:59:59.000Z"),

          courant: false,
          actif: false,
        },
      ],
    },
    convention_collectives: {
      rncp: [],
    },
    domaines: {
      formacodes: {
        rncp: [
          {
            code: "42866",
            intitule: "42866 : Santé sécurité travail",
          },
          {
            code: "12585",
            intitule: "12585 : Conseil environnement",
          },
          {
            code: "12518",
            intitule: "12518 : Droit environnement",
          },
          {
            code: "12587",
            intitule: "12587 : Management environnemental",
          },
          {
            code: "31407",
            intitule: "31407 : Qualité hygiène sécurité environnement",
          },
        ],
      },
      nsf: {
        cfd: {
          code: "343",
          intitule: "NETTOYAGE, ASSAIN., PROTECTION ENVIRONMT",
        },
        rncp: [
          {
            code: "331r",
            intitule: "331r : Prévention, contrôle sanitaire, diététique",
          },
          {
            code: "344r",
            intitule: "344r : Mise en oeuvre des règles d'hygiène et sécurité",
          },
          {
            code: "343",
            intitule: "343 : Nettoyage, assainissement, protection de l'environnement",
          },
        ],
      },
      rome: {
        rncp: [
          {
            code: "H1302",
            intitule: "Management et ingénierie Hygiène Sécurité Environnement -HSE- industriels",
          },
        ],
      },
    },
    intitule: {
      cfd: {
        long: "MANAGER HYGIENE SECURITE ENVIRONNEMENT HCE (CNAM)",
        court: "MANAGER HCE",
      },
      niveau: {
        cfd: {
          europeen: "7",
          formation_diplome: "146",
          interministeriel: "1",
          libelle: "TITRE PROFESSIONNEL HOMOLOGUE OU CERTIFIE",
          sigle: "DIP1-CNAM",
        },
        rncp: {
          europeen: "7",
        },
      },
      rncp: "Hygiéniste du travail et de l'environnement",
    },
    periode_validite: {
      debut: new Date("2003-08-31T22:00:00.000Z"),

      fin: new Date("2023-09-14T21:59:59.000Z"),

      cfd: {
        ouverture: new Date("2003-08-31T22:00:00.000Z"),

        fermeture: new Date("2029-08-31T21:59:59.000Z"),

        premiere_session: null,
        derniere_session: null,
      },
      rncp: {
        actif: false,
        activation: null,
        debut_parcours: new Date("2020-09-13T22:00:00.000Z"),

        fin_enregistrement: new Date("2023-09-14T21:59:59.000Z"),
      },
    },
    type: {
      nature: {
        cfd: {
          code: "2",
          libelle: "TITRE PROFESSIONNEL HOMOLOGUE OU CERTIFIE",
        },
      },
      gestionnaire_diplome: "SPN DEP B4 B5",
      enregistrement_rncp: "Enregistrement sur demande",
      voie_acces: {
        rncp: {
          apprentissage: true,
          experience: true,
          candidature_individuelle: false,
          contrat_professionnalisation: true,
          formation_continue: true,
          formation_statut_eleve: false,
        },
      },
      certificateurs_rncp: [
        {
          siret: "19753471200017",
          nom: "CONSERVATOIRE NATIONAL DES ARTS ET METIERS",
        },
      ],
    },
  },
  {
    identifiant: {
      cfd: "1463430A",
      rncp: null,
      rncp_anterieur_2019: null,
    },
    intitule: {
      cfd: {
        long: "MANAGER HYGIENE SECURITE ENVIRONNEMENT HCE (CNAM)",
        court: "MANAGER HCE",
      },
      niveau: {
        cfd: {
          europeen: "7",
          formation_diplome: "146",
          interministeriel: "1",
          libelle: "TITRE PROFESSIONNEL HOMOLOGUE OU CERTIFIE",
          sigle: "DIP1-CNAM",
        },
        rncp: null,
      },
      rncp: null,
    },
    base_legale: {
      cfd: {
        creation: null,
        abrogation: new Date("2028-12-21T22:59:59.000Z"),
      },
    },
    blocs_competences: {
      rncp: null,
    },
    convention_collectives: {
      rncp: null,
    },
    domaines: {
      formacodes: {
        rncp: null,
      },
      nsf: {
        cfd: {
          code: "343",
          intitule: "NETTOYAGE, ASSAIN., PROTECTION ENVIRONMT",
        },
        rncp: null,
      },
      rome: {
        rncp: null,
      },
    },
    periode_validite: {
      debut: new Date("2023-09-14T22:00:00.000Z"),
      fin: new Date("2023-12-22T22:59:59.000Z"),
      cfd: {
        ouverture: new Date("2003-08-31T22:00:00.000Z"),
        fermeture: new Date("2029-08-31T21:59:59.000Z"),
        premiere_session: null,
        derniere_session: null,
      },
      rncp: null,
    },
    type: {
      nature: {
        cfd: {
          code: "2",
          libelle: "TITRE PROFESSIONNEL HOMOLOGUE OU CERTIFIE",
        },
      },
      gestionnaire_diplome: "SPN DEP B4 B5",
      enregistrement_rncp: null,
      voie_acces: {
        rncp: null,
      },
      certificateurs_rncp: null,
    },
    continuite: {
      cfd: null,
      rncp: null,
    },
  },
] as const satisfies ICertification[];
