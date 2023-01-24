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
    feature: "Accès aux fonctionnalités d'organisme",
    ref: "organisme",
    subFeatures: [
      {
        feature: "Voir la page tableau de board d'un organisme",
        ref: "organisme/tableau_de_bord",
      },
      {
        feature: "Voir la page effectifs",
        ref: "organisme/page_effectifs",
        subFeatures: [
          {
            feature: "Edition des effectifs",
            ref: "organisme/page_effectifs/edition",
          },
          {
            feature: "Ajouter un apprenant",
            ref: "organisme/page_effectifs/ajout_apprenant",
          },
          {
            feature: "Télécharger les données anonymisées",
            ref: "organisme/page_effectifs/telecharger",
          },
        ],
      },
      {
        feature: "Voir la page sifa2",
        ref: "organisme/page_sifa",
        subFeatures: [
          {
            feature: "Edition sifa",
            ref: "organisme/page_sifa/edition",
          },
          {
            feature: "Télécharger SIFA",
            ref: "organisme/page_sifa/telecharger",
          },
        ],
      },
      {
        feature: "Voir la page des paramètres d'organisme",
        ref: "organisme/page_parametres",
        subFeatures: [
          {
            feature: "Gestion des accès à l'organisme",
            ref: "organisme/page_parametres/gestion_acces",
            subFeatures: [
              {
                feature: "Retirer un contributeur de l'organisme",
                ref: "organisme/page_parametres/gestion_acces/supprimer_contributeur",
              },
            ],
          },
          {
            feature: "Gestion des notifications de l'organisme",
            ref: "organisme/page_parametres/gestion_notifications",
          },
          {
            feature: "Gestion clé d'api",
            ref: "organisme/page_parametres/api_key",
          },
        ],
      },
    ],
  },
];

export default acl;
