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
        feature: "Message de maintenance",
        ref: "admin/page_message_maintenance",
      },
      {
        feature: "Upload de fichiers source",
        ref: "admin/page_upload",
      },
      {
        feature: "Dépublier un dossier",
        ref: "admin/dossier_depublier",
      },
    ],
  },
  {
    feature: "Accès aux fonctionnalités d'espace",
    ref: "wks",
    subFeatures: [
      {
        feature: "Voir la page d'espace",
        ref: "wks/page_espace",
        subFeatures: [
          {
            feature: "Voir la page mes dossiers",
            ref: "wks/page_espace/page_dossiers",
            subFeatures: [
              {
                feature: "Ajouter un nouveau dossier",
                ref: "wks/page_espace/page_dossiers/ajouter_nouveau_dossier",
              },
              {
                feature: "Supprimer un dossier de l'espace",
                ref: "wks/page_espace/page_dossiers/supprimer_dossier",
              },
              {
                feature: "Voir la liste des dossiers",
                ref: "wks/page_espace/page_dossiers/voir_liste_dossiers",
                uniqSubFeature: true,
                subFeatures: [
                  {
                    feature: "Voir tous les dossiers",
                    ref: "wks/page_espace/page_dossiers/voir_liste_dossiers/tous",
                  },
                  {
                    feature: "Voir uniquement les dossiers en cours d'instruction",
                    ref: "wks/page_espace/page_dossiers/voir_liste_dossiers/instruction_en_cours",
                  },
                ],
              },
            ],
          },
          {
            feature: "Voir la page des paramètres d'espace",
            ref: "wks/page_espace/page_parametres",
            subFeatures: [
              {
                feature: "Gestion des accès à l'espace",
                ref: "wks/page_espace/page_parametres/gestion_acces",
                subFeatures: [
                  {
                    feature: "Retirer un contributeur de l'espace",
                    ref: "wks/page_espace/page_parametres/gestion_acces/supprimer_contributeur",
                  },
                ],
              },
              {
                feature: "Gestion des notifications de l'espace",
                ref: "wks/page_espace/page_parametres/gestion_notifications",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    feature: "Afficher un dossier",
    ref: "dossier",
    subFeatures: [
      {
        feature: "Sauvegarder un dossier",
        ref: "dossier/sauvegarder",
      },
      {
        feature: "Supprimer un dossier",
        ref: "dossier/supprimer",
      },
      {
        feature: "Voir le formulaire",
        ref: "dossier/page_formulaire",
      },
      {
        feature: "Voir les pièces justificatives",
        ref: "dossier/page_documents",
        subFeatures: [
          {
            feature: "Ajouter un document",
            ref: "dossier/page_documents/ajouter_un_document",
          },
          {
            feature: "Supprimer un document",
            ref: "dossier/page_documents/supprimer_un_document",
          },
        ],
      },
      {
        feature: "Voir le contrat pdf",
        ref: "dossier/voir_contrat_pdf",
        subFeatures: [
          {
            feature: "Télécharger",
            ref: "dossier/voir_contrat_pdf/telecharger",
          },
        ],
      },
      {
        feature: "Voir la page de signature",
        ref: "dossier/page_signatures",
        subFeatures: [
          {
            feature: "Signer",
            ref: "dossier/page_signatures/signer",
          },
        ],
      },
      {
        feature: "Voir la page de statut",
        ref: "dossier/page_statut",
      },
      {
        feature: "Publication dossier",
        ref: "dossier/publication",
      },
      {
        feature: "Envoyer le dossier",
        ref: "dossier/envoyer",
      },
      {
        feature: "Voir les paramètres du dossier",
        ref: "dossier/page_parametres",
        subFeatures: [
          {
            feature: "Gestion des accès de dossier",
            ref: "dossier/page_parametres/gestion_acces",
          },
          {
            feature: "Gestion des notifications du dossier",
            ref: "dossier/page_parametres/gestion_notifications",
          },
        ],
      },
    ],
  },
  {
    feature: "Signature électronique - BETA",
    ref: "signature_beta",
  },
  {
    feature: "Télétransmettre Agecap",
    ref: "send_agecap",
  },
];

export default acl;
