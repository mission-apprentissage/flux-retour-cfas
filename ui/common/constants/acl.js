const acl = [
  {
    feature: "Accès aux fonctionnalités administrateur",
    ref: "admin",
    subFeatures: [
      {
        feature: "Gestion des utilisateurs",
        ref: "admin/page_gestion_utilisateurs",
      },
      {
        feature: "Gestion des Rôles",
        ref: "admin/page_gestion_roles",
      },
      {
        feature: "Gestion des Réseaux CFAS",
        ref: "admin/page_gestion_reseaux_cfa",
      },
      {
        feature: "Message de maintenance",
        ref: "admin/page_message_maintenance",
      },
      {
        feature: "Upload de fichiers source",
        ref: "admin/page_upload",
      },
    ],
  },
  {
    feature: "Accès aux fonctionnalités d'espace",
    ref: "espace",
    subFeatures: [
      {
        feature: "Voir la page tableau de board d'un espace",
        ref: "espace/tableau_de_bord",
        subFeatures: [
          {
            feature: "Voir la page vue territoriale",
            ref: "espace/tableau_de_bord/vue_territoriale",
            subFeatures: [
              {
                feature: "Sélectionner un territoire",
                ref: "espace/tableau_de_bord/vue_territoriale/selectionner_territoire",
              },
              {
                feature: "Filtrer par formation",
                ref: "espace/tableau_de_bord/vue_territoriale/filtrer_par_formation",
              },
              {
                feature: "Consulter la vue globale",
                ref: "espace/tableau_de_bord/vue_territoriale/voir_globale",
              },
              {
                feature: "Consulter les effectifs par formations",
                ref: "espace/tableau_de_bord/vue_territoriale/voir_par_formations",
              },
              {
                feature: "Consulter les effectifs par organismes",
                ref: "espace/tableau_de_bord/vue_territoriale/voir_par_organismes",
              },
              {
                feature: "Choisir la période",
                ref: "espace/tableau_de_bord/vue_territoriale/filtrer_par_periode",
              },
              {
                feature: "Télécharger les données anonymisées",
                ref: "espace/tableau_de_bord/vue_territoriale/telecharger_anonyme",
              },
              {
                feature: "Télécharger les données nominatives",
                ref: "espace/tableau_de_bord/vue_territoriale/telecharger",
              },
            ],
          },
          {
            feature: "Voir la page vue réseau",
            ref: "espace/tableau_de_bord/vue_reseau",
            subFeatures: [
              {
                feature: "Changer de réseau",
                ref: "espace/tableau_de_bord/vue_reseau/selectionner_reseau",
              },
              {
                feature: "Filtrer par formation",
                ref: "espace/tableau_de_bord/vue_reseau/filtrer_par_formation",
              },
              {
                feature: "Filtrer par territoire",
                ref: "espace/tableau_de_bord/vue_reseau/filtrer_par_territoire",
              },
              {
                feature: "Consulter la vue globale",
                ref: "espace/tableau_de_bord/vue_reseau/voir_globale",
              },
              {
                feature: "Consulter les effectifs par formations",
                ref: "espace/tableau_de_bord/vue_reseau/voir_par_formations",
              },
              {
                feature: "Consulter les effectifs par organismes",
                ref: "espace/tableau_de_bord/vue_reseau/voir_par_organismes",
              },
              {
                feature: "Choisir la période",
                ref: "espace/tableau_de_bord/vue_reseau/filtrer_par_periode",
              },
              {
                feature: "Télécharger les données anonymisées",
                ref: "espace/tableau_de_bord/vue_reseau/telecharger_anonyme",
              },
              {
                feature: "Télécharger les données nominatives",
                ref: "espace/tableau_de_bord/vue_reseau/telecharger",
              },
            ],
          },
          {
            feature: "Voir la page vue organisme",
            ref: "espace/tableau_de_bord/vue_organisme",
            subFeatures: [
              {
                feature: "Changer d'organisme",
                ref: "espace/tableau_de_bord/vue_organisme/selectionner_organisme",
              },
              {
                feature: "Consulter la vue globale",
                ref: "espace/tableau_de_bord/vue_organisme/voir_globale",
              },
              {
                feature: "Consulter les effectifs par formations",
                ref: "espace/tableau_de_bord/vue_organisme/voir_par_formations",
              },
              {
                feature: "Choisir la période",
                ref: "espace/tableau_de_bord/vue_organisme/filtrer_par_periode",
              },
              {
                feature: "Télécharger les données anonymisées",
                ref: "espace/tableau_de_bord/vue_organisme/telecharger_anonyme",
              },
              {
                feature: "Télécharger les données nominatives",
                ref: "espace/tableau_de_bord/vue_organisme/telecharger",
              },
            ],
          },
          {
            feature: "Voir la page vue formations",
            ref: "espace/tableau_de_bord/vue_formation",
            subFeatures: [
              {
                feature: "Changer de formation",
                ref: "espace/tableau_de_bord/vue_formation/selectionner_formation",
              },
              {
                feature: "Filtrer par territoire",
                ref: "espace/tableau_de_bord/vue_formation/filtrer_par_territoire",
              },
              {
                feature: "Consulter la vue globale",
                ref: "espace/tableau_de_bord/vue_formation/voir_globale",
              },
              {
                feature: "Consulter les effectifs par organismes",
                ref: "espace/tableau_de_bord/vue_formation/voir_par_organismes",
              },
              {
                feature: "Choisir la période",
                ref: "espace/tableau_de_bord/vue_formation/filtrer_par_periode",
              },
              {
                feature: "Télécharger les données anonymisées",
                ref: "espace/tableau_de_bord/vue_formation/telecharger_anonyme",
              },
              {
                feature: "Télécharger les données nominatives",
                ref: "espace/tableau_de_bord/vue_formation/telecharger",
              },
            ],
          },
          {
            feature: "Voir la page des paramètres d'espace",
            ref: "espace/page_parametres",
            subFeatures: [
              {
                feature: "Gestion des accès à l'espace",
                ref: "espace/page_parametres/gestion_acces",
                subFeatures: [
                  {
                    feature: "Retirer un contributeur de l'espace",
                    ref: "espace/page_parametres/gestion_acces/supprimer_contributeur",
                  },
                ],
              },
              {
                feature: "Gestion des notifications de l'espace",
                ref: "espace/page_parametres/gestion_notifications",
              },
            ],
          },
        ],
      },
    ],
  },
];

export default acl;
