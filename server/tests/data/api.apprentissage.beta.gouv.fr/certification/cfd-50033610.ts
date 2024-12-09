export default [
  {
    identifiant: {
      cfd: "50033610",
      rncp: "RNCP12281",
      rncp_anterieur_2019: true,
    },
    intitule: {
      cfd: {
        long: "COIFFURE (CAP)",
        court: "COIFFURE",
      },
      niveau: {
        cfd: {
          europeen: "3",
          formation_diplome: "500",
          interministeriel: "5",
          libelle: "DIPLOME NATIONAL / DIPLOME D'ETAT",
          sigle: "CAP",
        },
        rncp: {
          europeen: "4",
        },
      },
      rncp: "Coiffure",
    },
    base_legale: {
      cfd: {
        creation: "2007-06-22T00:00:00.000+02:00",
        abrogation: "2019-06-05T23:59:59.000+02:00",
      },
    },
    blocs_competences: {
      rncp: [
        {
          code: "RNCP12281BC08",
          intitule: "UP52 - Arts appliqués à la profession",
        },
        {
          code: "RNCP12281BC07",
          intitule: "UP51 - Sciences et technologies",
        },
        {
          code: "RNCP12281BC05",
          intitule: "UP41 - Vente-conseil",
        },
        {
          code: "RNCP12281BC10",
          intitule: "UF - Epreuve facultative langue vivante",
        },
        {
          code: "RNCP12281BC03",
          intitule: "UP30A - Option A - coiffure événementielle",
        },
        {
          code: "RNCP12281BC01",
          intitule: "UP10 - Création, couleur, coupe, coiffage",
        },
        {
          code: "RNCP12281BC09",
          intitule: "UG60 - Expression et connaissance du monde",
        },
        {
          code: "RNCP12281BC02",
          intitule: "UP20 - Modification durable de la forme",
        },
        {
          code: "RNCP12281BC04",
          intitule: "UP30B - Option B - Coupe homme et entretien du système pilo-facial",
        },
        {
          code: "RNCP12281BC06",
          intitule: "UP42 - Management et gestion d'un salon de coiffure",
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
            code: "42050",
            intitule: "42050 : Coiffure",
          },
        ],
      },
      nsf: {
        cfd: {
          code: "336",
          intitule: "COIFFURE, ESTHETIQ.& AUTR.SERVICES PERSO",
        },
        rncp: [
          {
            code: "336",
            intitule: "336 : Coiffure, esthétique et autres spécialites de services aux personnes",
          },
        ],
      },
      rome: {
        rncp: [
          {
            code: "D1202",
            intitule: "Coiffure",
          },
        ],
      },
    },
    periode_validite: {
      debut: "2008-09-01T00:00:00.000+02:00",
      fin: "2020-08-31T23:59:59.000+02:00",
      cfd: {
        ouverture: "2008-09-01T00:00:00.000+02:00",
        fermeture: "2020-08-31T23:59:59.000+02:00",
        premiere_session: 2009,
        derniere_session: 2020,
      },
      rncp: {
        actif: false,
        activation: null,
        debut_parcours: null,
        fin_enregistrement: "2023-08-31T23:59:59.000+02:00",
      },
    },
    type: {
      nature: {
        cfd: {
          code: "1",
          libelle: "DIPLOME NATIONAL / DIPLOME D'ETAT",
        },
      },
      gestionnaire_diplome: "DGESCO A2-3",
      enregistrement_rncp: "Enregistrement de droit",
      voie_acces: {
        rncp: {
          apprentissage: true,
          experience: true,
          candidature_individuelle: true,
          contrat_professionnalisation: true,
          formation_continue: true,
          formation_statut_eleve: false,
        },
      },
      certificateurs_rncp: [
        {
          siret: "11004301500012",
          nom: "MINISTERE DE L'EDUCATION NATIONALE ET DE LA JEUNESSE",
        },
      ],
    },
    continuite: {
      cfd: [
        {
          ouverture: "1982-07-21T00:00:00.000+02:00",
          fermeture: "1993-08-31T23:59:59.000+02:00",
          code: "50033602",
          courant: false,
        },
        {
          ouverture: "1982-07-21T00:00:00.000+02:00",
          fermeture: "1994-08-31T23:59:59.000+02:00",
          code: "50033607",
          courant: false,
        },
        {
          ouverture: "1982-07-21T00:00:00.000+02:00",
          fermeture: "1994-08-31T23:59:59.000+02:00",
          code: "50033608",
          courant: false,
        },
        {
          ouverture: "1982-07-21T00:00:00.000+02:00",
          fermeture: "1994-08-31T23:59:59.000+02:00",
          code: "50033609",
          courant: false,
        },
        {
          ouverture: "1991-07-19T00:00:00.000+02:00",
          fermeture: "2008-08-31T23:59:59.000+02:00",
          code: "50033605",
          courant: false,
        },
        {
          ouverture: "2008-09-01T00:00:00.000+02:00",
          fermeture: "2020-08-31T23:59:59.000+02:00",
          code: "50033610",
          courant: true,
        },
        {
          ouverture: "2019-09-01T00:00:00.000+02:00",
          fermeture: null,
          code: "50033616",
          courant: false,
        },
      ],
      rncp: [
        {
          activation: "2023-11-09T00:00:00.000+01:00",
          fin_enregistrement: "2028-08-31T23:59:59.000+02:00",
          code: "RNCP38231",
          courant: false,
          actif: true,
        },
        {
          activation: null,
          fin_enregistrement: "2021-12-24T00:00:00.000+01:00",
          code: "RNCP977",
          courant: false,
          actif: false,
        },
        {
          activation: null,
          fin_enregistrement: "2023-08-31T23:59:59.000+02:00",
          code: "RNCP12281",
          courant: true,
          actif: false,
        },
      ],
    },
  },
  {
    identifiant: {
      cfd: "50033610",
      rncp: "RNCP34670",
      rncp_anterieur_2019: false,
    },
    intitule: {
      cfd: {
        long: "COIFFURE (CAP)",
        court: "COIFFURE",
      },
      niveau: {
        cfd: {
          europeen: "3",
          formation_diplome: "500",
          interministeriel: "5",
          libelle: "DIPLOME NATIONAL / DIPLOME D'ETAT",
          sigle: "CAP",
        },
        rncp: {
          europeen: "3",
        },
      },
      rncp: "Métiers de la coiffure",
    },
    base_legale: {
      cfd: {
        creation: "2007-06-22T00:00:00.000+02:00",
        abrogation: "2019-06-05T23:59:59.000+02:00",
      },
    },
    blocs_competences: {
      rncp: [
        {
          code: "RNCP34670BC03",
          intitule: "Français et histoire-géographie – enseignement moral et civique",
        },
        {
          code: "RNCP34670BC02",
          intitule: "Établir une relation avec la clientèle  et participer à l’activité de l’entreprise",
        },
        {
          code: "RNCP34670BC08",
          intitule: "Arts appliqués et cultures artistiques (bloc facultatif)",
        },
        {
          code: "RNCP34670BC07",
          intitule: "Prévention-sécurité-environnement",
        },
        {
          code: "RNCP34670BC06",
          intitule: "Langues vivantes étrangères",
        },
        {
          code: "RNCP34670BC05",
          intitule: "Éducation physique et sportive",
        },
        {
          code: "RNCP34670BC04",
          intitule: "Mathématiques –  Physique- chimie",
        },
        {
          code: "RNCP34670BC01",
          intitule: "Réaliser des prestations de coiffure",
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
            code: "42050",
            intitule: "42050 : Coiffure",
          },
        ],
      },
      nsf: {
        cfd: {
          code: "336",
          intitule: "COIFFURE, ESTHETIQ.& AUTR.SERVICES PERSO",
        },
        rncp: [
          {
            code: "336",
            intitule: "336 : Coiffure, esthétique et autres spécialites de services aux personnes",
          },
        ],
      },
      rome: {
        rncp: [
          {
            code: "D1202",
            intitule: "Coiffure",
          },
        ],
      },
    },
    periode_validite: {
      debut: "2008-09-01T00:00:00.000+02:00",
      fin: "2020-08-31T23:59:59.000+02:00",
      cfd: {
        ouverture: "2008-09-01T00:00:00.000+02:00",
        fermeture: "2020-08-31T23:59:59.000+02:00",
        premiere_session: 2009,
        derniere_session: 2020,
      },
      rncp: {
        actif: false,
        activation: null,
        debut_parcours: "2019-09-01T00:00:00.000+02:00",
        fin_enregistrement: "2024-08-31T23:59:59.000+02:00",
      },
    },
    type: {
      nature: {
        cfd: {
          code: "1",
          libelle: "DIPLOME NATIONAL / DIPLOME D'ETAT",
        },
      },
      gestionnaire_diplome: "DGESCO A2-3",
      enregistrement_rncp: "Enregistrement de droit",
      voie_acces: {
        rncp: {
          apprentissage: true,
          experience: true,
          candidature_individuelle: true,
          contrat_professionnalisation: true,
          formation_continue: true,
          formation_statut_eleve: true,
        },
      },
      certificateurs_rncp: [
        {
          siret: "11004301500012",
          nom: "MINISTERE DE L'EDUCATION NATIONALE ET DE LA JEUNESSE",
        },
      ],
    },
    continuite: {
      cfd: [
        {
          ouverture: "1982-07-21T00:00:00.000+02:00",
          fermeture: "1993-08-31T23:59:59.000+02:00",
          code: "50033602",
          courant: false,
        },
        {
          ouverture: "1982-07-21T00:00:00.000+02:00",
          fermeture: "1994-08-31T23:59:59.000+02:00",
          code: "50033607",
          courant: false,
        },
        {
          ouverture: "1982-07-21T00:00:00.000+02:00",
          fermeture: "1994-08-31T23:59:59.000+02:00",
          code: "50033608",
          courant: false,
        },
        {
          ouverture: "1982-07-21T00:00:00.000+02:00",
          fermeture: "1994-08-31T23:59:59.000+02:00",
          code: "50033609",
          courant: false,
        },
        {
          ouverture: "1991-07-19T00:00:00.000+02:00",
          fermeture: "2008-08-31T23:59:59.000+02:00",
          code: "50033605",
          courant: false,
        },
        {
          ouverture: "2008-09-01T00:00:00.000+02:00",
          fermeture: "2020-08-31T23:59:59.000+02:00",
          code: "50033610",
          courant: true,
        },
        {
          ouverture: "2019-09-01T00:00:00.000+02:00",
          fermeture: null,
          code: "50033616",
          courant: false,
        },
      ],
      rncp: [
        {
          activation: "2024-07-05T00:00:00.000+02:00",
          fin_enregistrement: "2029-08-31T23:59:59.000+02:00",
          code: "RNCP39266",
          courant: false,
          actif: true,
        },
        {
          activation: null,
          fin_enregistrement: "2024-08-31T23:59:59.000+02:00",
          code: "RNCP34670",
          courant: true,
          actif: false,
        },
        {
          activation: null,
          fin_enregistrement: "2020-08-31T23:59:59.000+02:00",
          code: "RNCP5364",
          courant: false,
          actif: false,
        },
      ],
    },
  },
];
