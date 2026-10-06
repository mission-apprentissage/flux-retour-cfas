# Jeu de données fictif de recette (`seed:recette`)

Fichier généré par `readme.ts` à partir du catalogue — ne pas éditer à la main.
Regénérer : `npx vitest run --project server tests/unit/jobs/seed-recette-readme.test.ts -u`.

## Fonctionnement

- Régénéré chaque nuit à 05h30 sur recette (cron déclaré uniquement si `MNA_TDB_ENV=recette`) : purge de tout le jeu fictif, puis recréation avec des dates recalculées au jour même. **Les manipulations de la veille sont perdues.**
- À la main : `yarn cli seed:recette` (`--dry-run` pour simuler, `--uninstall` pour tout retirer et remettre les flags des hôtes).
- Refuse de tourner hors recette/local/test, et s'arrête sans rien écrire (désinstallation comprise) si un hôte a une activité réelle : effectif ou dossier ML actif hors seed (les anciens dossiers soft-deleted sont ignorés). En cron, l'échec remonte dans Sentry.
- Tout le jeu est construit avant la moindre écriture : une erreur de construction ne laisse aucun état partiel.
- La purge ne touche que le jeu fictif : `_id` en `5eed`, dossiers des ML hôtes créés sur un effectif fictif, invitations émises par un compte fictif ou d'une ML hôte vers un CFA hôte. Les invitations de collègues restent.
- Si un vrai dossier porte déjà le même nom, prénom et date de naissance qu'un jeune fictif, la date de naissance fictive est décalée de quelques jours (l'index est unique sur toutes les ML).
- Tous les `_id` créés commencent par `5eed` ; les URL ci-dessous restent valides d'une nuit à l'autre.
- Identités fictives : e-mails en `@example.com` (domaine réservé), téléphones en 06 00 00 (plage de fiction ARCEP 06 39 98 rejetée par la validation serveur).
- WhatsApp : hors production, aucun envoi sans `MNA_TDB_WHATSAPP_TEST_PHONE_OVERRIDE`, et tout part alors vers ce seul numéro.

## Hôtes (organisations réelles de recette)

Accès par impersonation admin depuis l'organisation, ou avec un compte ci-dessous.

| Code | Organisation | Rôle dans le jeu | Organisation `_id` |
| --- | --- | --- | --- |
| ML_A | Mission Locale Ivry-Vitry-sur-Seine (ml_id 569) | ML activée par le seed, avec lien de RDV | `679b92f1bdd1dd56b488014e` |
| ML_B | Mission Locale d'Aubervilliers (ml_id 39) | ML non activée | `67b59632ba5ecb4ba6caaaec` |
| ML_CLICHY | Clichoise pour l'insertion sociale et professionnelle des jeunes, Clichy (ml_id 139) | ML réelle déjà activée, avec ses propres dossiers ; flags jamais modifiés | `67b59632ba5ecb4ba6caab32` |
| CFA_ON | ESTP, Cachan | Collaboration active | `693e1c17ae4afef0564640f1` |
| CFA_SUSP | Association Sup de Vinci, Saint-Maur-des-Fossés | Collaboration suspendue pour inactivité | `693e1c07ae4afef056463b30` |
| CFA_OFF | Maison du Sacré-Cœur, Thiais | Utilise le TDB, sans collaboration | `693e1c20ae4afef056464464` |
| CFA_SANS | AFASEC Grosbois, Boissy-Saint-Léger | Sans compte TDB | `693e1c18ae4afef056464133` |
| CFA_DECA | Plateform', Montreuil | Pilote DECA et collaboration active | `693e1c21ae4afef056464503` |
| CFA_REAL_CAMPUS | Real Campus by L'Oréal, Clichy | CFA réel sans collaboration, à inviter | `68e683565ad4d7d7e66e53d0` |
| CFA_AFTRAL | AFTRAL, Gennevilliers | CFA réel, collaboration activée à J-7 | `68e6835b5ad4d7d7e66e554b` |

## ML de Clichy (cas Z01 à Z41)

Les 41 dossiers de la ML Clichoise, repris du jeu importé à la main le 22/09/2026. `ML_CLICHY`, `CFA_REAL_CAMPUS` et `CFA_AFTRAL` sont des organisations réelles qui ont déjà leurs propres dossiers et effectifs, visibles à côté des dossiers fictifs :

- le contrôle d'activité réelle ne s'applique pas à elles, et la purge ne touche jamais leurs vrais dossiers ;
- la ML n'est jamais modifiée (ni activation, ni lien de RDV), même à la désinstallation ;
- aucun effectif fictif n'est créé chez ces deux CFA ;
- les traitements passés sont signés par le compte `auteurClichy` de `hosts.ts`, ou sans auteur s'il n'existe pas.

## Comptes

Mot de passe commun : variable `MNA_TDB_SEED_RECETTE_PASSWORD` (sops, `env.recette.yml`) — à demander, jamais écrit ici. Sans elle, les comptes existent mais ne sont pas connectables.

| Nom | E-mail | Hôte | Rôle CFA | Code |
| --- | --- | --- | --- | --- |
| Claire Fontaine | claire.fontaine@example.com | ML_A | — | ML_A_CONSEIL_1 |
| Karim Benali | karim.benali@example.com | ML_A | — | ML_A_CONSEIL_2 |
| Élodie Marchetti | elodie.marchetti@example.com | ML_CLICHY | — | ML_CLICHY_CONSEIL |
| Sophie Marchand | sophie.marchand@example.com | CFA_ON | admin | CFA_ON_ADMIN |
| Julien Carpentier | julien.carpentier@example.com | CFA_ON | member | CFA_ON_MEMBRE |
| Nadia Haddad | nadia.haddad@example.com | CFA_SUSP | admin | CFA_SUSP_ADMIN |
| Pierre Lemoine | pierre.lemoine@example.com | CFA_OFF | admin | CFA_OFF_ADMIN |
| Aurélie Chevalier | aurelie.chevalier@example.com | CFA_DECA | admin | CFA_DECA_ADMIN |
| Karim BENALI | karim.benali@cfa-metiers-clichy.example | CFA_REAL_CAMPUS | admin | CFA_REAL_CAMPUS_ADMIN |
| Sophie LAURENT | sophie.laurent@campus92-formation.example | CFA_AFTRAL | admin | CFA_AFTRAL_ADMIN |

## Jeunes et cas testés

| Cas | Jeune | Ce qu'il teste | Où le voir | Fiche |
| --- | --- | --- | --- | --- |
| A01 STANDARD | Lucas Bernard | Rupture récente, CFA sans compte | ML_A › À traiter ou recontacter | `/mission-locale/5eed01000000000000000001` |
| A02 DECA | Chloé Dubois | Rupture remontée par DECA pour un CFA sans ERP | ML_A › À traiter ou recontacter ; CFA_DECA › Ruptures de 45 j et plus | `/mission-locale/5eed02000000000000000002` |
| A03 MINEUR | Hugo Thomas | Jeune de 17 ans → prioritaire | ML_A › À traiter ou recontacter (+ Dossiers prioritaires) | `/mission-locale/5eed01000000000000000003` |
| A04 RQTH | Manon Robert | Jeune avec RQTH → visible et prioritaire | ML_A › À traiter ou recontacter (+ Dossiers prioritaires) | `/mission-locale/5eed01000000000000000004` |
| A10 PLUS DE 180 J | Jade Simon | Rupture il y a 200 jours, jeune passé en abandon → groupe « plus de 180 j » | ML_A › À traiter ou recontacter | `/mission-locale/5eed0100000000000000000a` |
| A11 NOUVEAU CONTRAT | Gabriel Laurent | Jeune reparti en contrat depuis la rupture → bandeau « nouveau contrat » | ML_A › À traiter ou recontacter | `/mission-locale/5eed0100000000000000000b` |
| B12 FIN DE FORMATION | Sarah Lefebvre | À recontacter, formation terminée depuis | ML_A › À traiter ou recontacter | `/mission-locale/5eed0100000000000000000c` |
| B13 RECONTACTER | Adam Michel | Contacté sans retour il y a 2 jours | ML_A › À traiter ou recontacter | `/mission-locale/5eed0100000000000000000d` |
| B14 RELANCE URGENTE | Emma Garcia | Contacté sans retour il y a 10 jours → « Relance urgente » | ML_A › À traiter ou recontacter | `/mission-locale/5eed0100000000000000000e` |
| C15 RDV PRIS | Yanis David | Rendez-vous pris | ML_A › Traités | `/mission-locale/5eed0100000000000000000f` |
| C16 NOUVEAU PROJET | Lina Bertrand | Nouveau projet | ML_A › Traités | `/mission-locale/5eed01000000000000000010` |
| C17 DEJA ACCOMPAGNE | Mathis Roux | Déjà accompagné par la ML | ML_A › Traités | `/mission-locale/5eed01000000000000000011` |
| C18 COORDONNEES INCORRECTES | Zoé Vincent | Coordonnées incorrectes | ML_A › Traités | `/mission-locale/5eed01000000000000000012` |
| C19 INJOIGNABLE | Rayan Fournier | Injoignable après relances | ML_A › Traités | `/mission-locale/5eed01000000000000000013` |
| C20 NOUVEAU CONTRAT | Clara Morel | A retrouvé un contrat (déclaré par la ML) | ML_A › Traités | `/mission-locale/5eed01000000000000000014` |
| C21 NE SOUHAITE PAS | Théo Girard | Ne souhaite pas être recontacté | ML_A › Traités | `/mission-locale/5eed01000000000000000015` |
| C22 AUTRE | Anaïs André | Autre situation, précisée | ML_A › Traités | `/mission-locale/5eed01000000000000000016` |
| C23 CHERCHE CONTRAT | Noah Lefèvre | Cherche un nouveau contrat | ML_A › Traités | `/mission-locale/5eed01000000000000000017` |
| C24 REORIENTATION | Maëlys Mercier | Réorientation | ML_A › Traités | `/mission-locale/5eed01000000000000000018` |
| C25 NE VEUT PAS ACCOMPAGNEMENT | Kylian Dupont | Ne veut pas d'accompagnement | ML_A › Traités | `/mission-locale/5eed01000000000000000019` |
| I54 ML B A TRAITER | Emma Michel | ML non activée : dossier à traiter | ML_B › À traiter ou recontacter | `/mission-locale/5eed01000000000000000036` |
| I55 ML B TRAITE | Yanis Garcia | ML non activée : dossier traité | ML_B › Traités | `/mission-locale/5eed01000000000000000037` |
| K63 PLUS DE 26 ANS | Noah André | A eu 26 ans depuis la création du dossier, sans RQTH → absent | ML_A : absent des listes (vérifie un filtre) | — |
| K64 MOINS DE 16 ANS | Maëlys Lefèvre | Jeune de 15 ans → absent | ML_A : absent des listes (vérifie un filtre) | — |
| A05 SOUHAITE UN RDV | Nathan Richard | A répondu oui au message de préqualification et a cliqué sur le lien de prise de RDV | ML_A › À traiter ou recontacter (+ Dossiers prioritaires) | `/mission-locale/5eed01000000000000000005` |
| A06 RAPPEL DEMANDE | Camille Petit | A demandé à être rappelé en réponse au message WhatsApp | ML_A › À traiter ou recontacter (+ Dossiers prioritaires) | `/mission-locale/5eed01000000000000000006` |
| A07 CONTACT OPPORTUN | Enzo Durand | Score de réponse élevé (0,82) : bon moment pour appeler | ML_A › À traiter ou recontacter | `/mission-locale/5eed01000000000000000007` |
| A08 SCORE FAIBLE AVEC AVIS | Inès Leroy | Score de réponse faible (0,40), le conseiller a donné son avis sur l'indice | ML_A › À traiter ou recontacter | `/mission-locale/5eed01000000000000000008` |
| H44 WHATSAPP ENVOYE | Manon Thomas | Message WhatsApp envoyé, pas encore distribué | ML_A › À traiter ou recontacter | `/mission-locale/5eed0100000000000000002c` |
| H45 WHATSAPP DISTRIBUE | Nathan Robert | Message WhatsApp distribué | ML_A › À traiter ou recontacter | `/mission-locale/5eed0100000000000000002d` |
| H46 WHATSAPP LU | Camille Richard | Message WhatsApp lu, sans réponse | ML_A › À traiter ou recontacter | `/mission-locale/5eed0100000000000000002e` |
| H47 WHATSAPP ECHEC | Enzo Petit | Échec d'envoi du message WhatsApp | ML_A › À traiter ou recontacter | `/mission-locale/5eed0100000000000000002f` |
| H48 PAS BESOIN D AIDE | Inès Durand | A répondu ne pas avoir besoin d'aide → dossier clos | ML_A › Traités | `/mission-locale/5eed01000000000000000030` |
| H49 STOP WHATSAPP | Louis Leroy | A répondu STOP : ne reçoit plus de messages | ML_A › À traiter ou recontacter | `/mission-locale/5eed01000000000000000031` |
| H50 PREQUALIF NON | Jade Moreau | A répondu non au message de préqualification → dossier clos | ML_A › Traités | `/mission-locale/5eed01000000000000000032` |
| H51 PREQUALIF SANS REPONSE | Gabriel Simon | Message de préqualification distribué, sans réponse | ML_A › À traiter ou recontacter | `/mission-locale/5eed01000000000000000033` |
| D26 COLLAB EN CONTRAT RISQUE FAIBLE | Océane Lambert | Collaboration sur un jeune encore en contrat, risque faible | ML_A › À traiter ou recontacter (+ Dossiers prioritaires, Collaborations) ; CFA_ON › Suivi ML › Collaborations | `/mission-locale/5eed0100000000000000001a` |
| D27 COLLAB EN CONTRAT RISQUE ELEVE | Ethan Bonnet | Collaboration sur un jeune encore en contrat, risque très élevé | ML_A › À traiter ou recontacter (+ Dossiers prioritaires, Collaborations) ; CFA_ON › Suivi ML › Collaborations | `/mission-locale/5eed0100000000000000001b` |
| D28 COLLAB RUPTURE TOUJOURS AU CFA | Yasmine François | Collaboration après rupture, le jeune suit toujours sa formation | ML_A › À traiter ou recontacter (+ Dossiers prioritaires, Collaborations) ; CFA_ON › Ruptures de moins de 45 j, Suivi ML › Collaborations | `/mission-locale/5eed0100000000000000001c` |
| D29 COLLAB SORTI DU CFA | Mehdi Martinez | Collaboration après rupture, le jeune a quitté le CFA | ML_A › À traiter ou recontacter (+ Dossiers prioritaires, Collaborations) ; CFA_ON › Ruptures de moins de 45 j, Suivi ML › Collaborations | `/mission-locale/5eed0100000000000000001d` |
| D30 COLLAB TRAITEE PAR LA ML | Louise Legrand | Collaboration traitée par la ML, notification non lue côté CFA | ML_A › Traités (+ Collaborations) ; CFA_ON › Ruptures de moins de 45 j, Suivi ML › Collaborations | `/mission-locale/5eed0100000000000000001e` |
| D31 COLLAB A RECONTACTER | Tom Garnier | Collaboration contactée sans retour depuis 9 jours → relance urgente | ML_A › À traiter ou recontacter (+ Dossiers prioritaires, Collaborations) ; CFA_ON › Ruptures de moins de 45 j, Suivi ML › Collaborations | `/mission-locale/5eed0100000000000000001f` |
| D32 RUPTURE MOINS DE 45 J | Ambre Faure | Rupture récente non transmise : invisible côté ML, à démarrer côté CFA | ML_A : absent des listes (vérifie un filtre) ; CFA_ON › Ruptures de moins de 45 j | `/cfa/5eed01000000000000000020` |
| D33 RUPTURE PLUS DE 45 J | Sacha Rousseau | Rupture de plus de 45 jours transmise automatiquement à la ML | ML_A › À traiter ou recontacter ; CFA_ON › Ruptures de 45 j et plus | `/mission-locale/5eed01000000000000000021` |
| D35 RUPTURE DECLAREE PAR LE CFA | Axel Guérin | Rupture déclarée par le CFA alors que l'ERP le voit encore en contrat | ML_A : absent des listes (vérifie un filtre) ; CFA_ON › Ruptures de moins de 45 j | `/cfa/5eed01000000000000000023` |
| D36 CONTACTE PAR LA ML HORS COLLAB | Élise Muller | Rupture transmise automatiquement puis traitée par la ML, sans collaboration | ML_A › Traités ; CFA_ON › Ruptures de 45 j et plus, Suivi ML › Hors collaboration | `/mission-locale/5eed01000000000000000024` |
| D37 COLLAB COMPLETE MINEUR | Bilal Henry | Collaboration complète d'un mineur : motifs commentés, infos vérifiées, référent tiers | ML_A › À traiter ou recontacter (+ Dossiers prioritaires, Collaborations) ; CFA_ON › Ruptures de moins de 45 j, Suivi ML › Collaborations | `/mission-locale/5eed01000000000000000025` |
| E38 SUSPENDU RUPTURE RECENTE | Romane Roussel | CFA suspendu : une rupture récente est visible tout de suite côté ML | ML_A › À traiter ou recontacter ; CFA_SUSP › Ruptures de moins de 45 j | `/mission-locale/5eed01000000000000000026` |
| E39 SUSPENDU COLLAB ANTERIEURE | Jules Nicolas | CFA suspendu : collaboration envoyée avant la suspension | ML_A › À traiter ou recontacter (+ Dossiers prioritaires, Collaborations) ; CFA_SUSP › Ruptures de 45 j et plus, Suivi ML › Collaborations | `/mission-locale/5eed01000000000000000027` |
| F40 CFA SANS COLLAB RUPTURE | Léa Perrin | CFA qui utilise le TDB sans collaboration : rupture visible côté ML | ML_A › À traiter ou recontacter ; CFA_OFF › Ruptures de moins de 45 j | `/mission-locale/5eed01000000000000000028` |
| F41 CFA SANS COLLAB CONTACTE | Lucas Martin | CFA sans collaboration : dossier traité par la ML | ML_A › Traités ; CFA_OFF › Ruptures de moins de 45 j, Suivi ML › Hors collaboration | `/mission-locale/5eed01000000000000000029` |
| G42 DECA VISIBLE COTE CFA | Chloé Bernard | Rupture DECA visible côté CFA (pilote DECA) | ML_A › À traiter ou recontacter ; CFA_DECA › Ruptures de 45 j et plus | `/mission-locale/5eed0200000000000000002a` |
| G43 DECA COLLAB | Hugo Dubois | Collaboration sur une rupture DECA | ML_A › À traiter ou recontacter (+ Dossiers prioritaires, Collaborations) ; CFA_DECA › Ruptures de moins de 45 j, Suivi ML › Collaborations | `/mission-locale/5eed0200000000000000002b` |
| J100 CFA_ON INSCRIT, ENTRÉE À VENIR | Clara Vincent | Tableau des effectifs CFA_ON : inscrit, entrée à venir | CFA_ON › Effectifs | `/cfa/5eed01000000000000000064` |
| J101 CFA_ON INSCRIT SANS CONTRAT | Théo Fournier | Tableau des effectifs CFA_ON : inscrit sans contrat | CFA_ON › Effectifs | `/cfa/5eed01000000000000000065` |
| J102 CFA_ON APPRENTI | Anaïs Morel | Tableau des effectifs CFA_ON : apprenti | CFA_ON › Effectifs | `/cfa/5eed01000000000000000066` |
| J103 CFA_ON ABANDON (EXCLUSION) | Noah Girard | Tableau des effectifs CFA_ON : abandon (exclusion) | CFA_ON › Effectifs | `/cfa/5eed01000000000000000067` |
| J104 CFA_ON FIN DE FORMATION | Maëlys André | Tableau des effectifs CFA_ON : fin de formation | CFA_ON › Effectifs | `/cfa/5eed01000000000000000068` |
| J110 CFA_SUSP INSCRIT, ENTRÉE À VENIR | Louise François | Tableau des effectifs CFA_SUSP : inscrit, entrée à venir | CFA_SUSP › Effectifs | `/cfa/5eed0100000000000000006e` |
| J111 CFA_SUSP INSCRIT SANS CONTRAT | Tom Martinez | Tableau des effectifs CFA_SUSP : inscrit sans contrat | CFA_SUSP › Effectifs | `/cfa/5eed0100000000000000006f` |
| J112 CFA_SUSP APPRENTI | Ambre Legrand | Tableau des effectifs CFA_SUSP : apprenti | CFA_SUSP › Effectifs | `/cfa/5eed01000000000000000070` |
| J113 CFA_SUSP ABANDON (EXCLUSION) | Sacha Garnier | Tableau des effectifs CFA_SUSP : abandon (exclusion) | CFA_SUSP › Effectifs | `/cfa/5eed01000000000000000071` |
| J114 CFA_SUSP FIN DE FORMATION | Nour Faure | Tableau des effectifs CFA_SUSP : fin de formation | CFA_SUSP › Effectifs | `/cfa/5eed01000000000000000072` |
| J120 CFA_OFF INSCRIT, ENTRÉE À VENIR | Léa Roussel | Tableau des effectifs CFA_OFF : inscrit, entrée à venir | CFA_OFF › Effectifs | `/cfa/5eed01000000000000000078` |
| J121 CFA_OFF INSCRIT SANS CONTRAT | Lucas Nicolas | Tableau des effectifs CFA_OFF : inscrit sans contrat | CFA_OFF › Effectifs | `/cfa/5eed01000000000000000079` |
| J122 CFA_OFF APPRENTI | Chloé Perrin | Tableau des effectifs CFA_OFF : apprenti | CFA_OFF › Effectifs | `/cfa/5eed0100000000000000007a` |
| J123 CFA_OFF ABANDON (EXCLUSION) | Hugo Martin | Tableau des effectifs CFA_OFF : abandon (exclusion) | CFA_OFF › Effectifs | `/cfa/5eed0100000000000000007b` |
| J124 CFA_OFF FIN DE FORMATION | Manon Bernard | Tableau des effectifs CFA_OFF : fin de formation | CFA_OFF › Effectifs | `/cfa/5eed0100000000000000007c` |
| J130 CFA_SANS INSCRIT, ENTRÉE À VENIR | Jade Durand | Tableau des effectifs CFA_SANS : inscrit, entrée à venir | CFA_SANS › Effectifs | `/cfa/5eed01000000000000000082` |
| J131 CFA_SANS INSCRIT SANS CONTRAT | Gabriel Leroy | Tableau des effectifs CFA_SANS : inscrit sans contrat | CFA_SANS › Effectifs | `/cfa/5eed01000000000000000083` |
| J132 CFA_SANS APPRENTI | Sarah Moreau | Tableau des effectifs CFA_SANS : apprenti | CFA_SANS › Effectifs | `/cfa/5eed01000000000000000084` |
| J133 CFA_SANS ABANDON (EXCLUSION) | Adam Simon | Tableau des effectifs CFA_SANS : abandon (exclusion) | CFA_SANS › Effectifs | `/cfa/5eed01000000000000000085` |
| J134 CFA_SANS FIN DE FORMATION | Emma Laurent | Tableau des effectifs CFA_SANS : fin de formation | CFA_SANS › Effectifs | `/cfa/5eed01000000000000000086` |
| J140 CFA_DECA INSCRIT, ENTRÉE À VENIR | Clara Roux | Tableau des effectifs CFA_DECA : inscrit, entrée à venir | CFA_DECA › Effectifs | `/cfa/5eed0200000000000000008c` |
| J141 CFA_DECA INSCRIT SANS CONTRAT | Théo Vincent | Tableau des effectifs CFA_DECA : inscrit sans contrat | CFA_DECA › Effectifs | `/cfa/5eed0200000000000000008d` |
| J142 CFA_DECA APPRENTI | Anaïs Fournier | Tableau des effectifs CFA_DECA : apprenti | CFA_DECA › Effectifs | `/cfa/5eed0200000000000000008e` |
| J143 CFA_DECA ABANDON (EXCLUSION) | Noah Morel | Tableau des effectifs CFA_DECA : abandon (exclusion) | CFA_DECA › Effectifs | `/cfa/5eed0200000000000000008f` |
| J144 CFA_DECA FIN DE FORMATION | Maëlys Girard | Tableau des effectifs CFA_DECA : fin de formation | CFA_DECA › Effectifs | `/cfa/5eed02000000000000000090` |
| Z01 CLICHY | Lisa DUPUIS | Jeune mineur, prioritaire | ML_CLICHY › À traiter ou recontacter (+ Dossiers prioritaires) | `/mission-locale/5eed010000000000000003e9` |
| Z02 CLICHY | Mathis LEFEVRE | Jeune mineur, prioritaire | ML_CLICHY › À traiter ou recontacter (+ Dossiers prioritaires) | `/mission-locale/5eed020000000000000003ea` |
| Z03 CLICHY | Margaux LEROY | Jeune RQTH, prioritaire | ML_CLICHY › À traiter ou recontacter (+ Dossiers prioritaires) | `/mission-locale/5eed010000000000000003eb` |
| Z04 CLICHY | Sacha FLEURY | Jeune RQTH, prioritaire | ML_CLICHY › À traiter ou recontacter (+ Dossiers prioritaires) ; CFA_AFTRAL › Ruptures de moins de 45 j | `/mission-locale/5eed010000000000000003ec` |
| Z05 CLICHY | Assia RICHARD | A confirmé vouloir être contacté (visible sur la fiche) | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed010000000000000003ed` |
| Z06 CLICHY | Samuel THOMAS | A confirmé vouloir être contacté (visible sur la fiche) | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed010000000000000003ee` |
| Z07 CLICHY | Nour MERCIER | A demandé un RDV en réponse au WhatsApp de préqualification | ML_CLICHY › À traiter ou recontacter (+ Dossiers prioritaires) | `/mission-locale/5eed010000000000000003ef` |
| Z08 CLICHY | Jules POIRIER | Injoignable, a demandé à être rappelé par WhatsApp | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed010000000000000003f0` |
| Z09 CLICHY | Sarah BOYER | Collaboration AFTRAL après rupture | ML_CLICHY › À traiter ou recontacter (+ Dossiers prioritaires, Collaborations) ; CFA_AFTRAL › Ruptures de moins de 45 j, Suivi ML › Collaborations | `/mission-locale/5eed010000000000000003f1` |
| Z10 CLICHY | Matéo ROCHE | Collaboration AFTRAL, encore en contrat, risque très élevé | ML_CLICHY › À traiter ou recontacter (+ Dossiers prioritaires, Collaborations) ; CFA_AFTRAL › Suivi ML › Collaborations | `/mission-locale/5eed010000000000000003f2` |
| Z11 CLICHY | Kenza MARCHAL | Jeune mineur, prioritaire | ML_CLICHY › À traiter ou recontacter (+ Dossiers prioritaires) | `/mission-locale/5eed020000000000000003f3` |
| Z12 CLICHY | Enzo MEYER | Rupture à traiter, score de réponse élevé | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed010000000000000003f4` |
| Z13 CLICHY | Justine ROUSSEAU | Rupture à traiter | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed010000000000000003f5` |
| Z14 CLICHY | Ismaël ROYER | Rupture à traiter | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed020000000000000003f6` |
| Z15 CLICHY | Chloé ROYER | Rupture à traiter | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed010000000000000003f7` |
| Z16 CLICHY | Enzo RIVIERE | Rupture à traiter | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed010000000000000003f8` |
| Z17 CLICHY | Nour BARON | Rupture à traiter | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed020000000000000003f9` |
| Z18 CLICHY | Thomas PEREZ | Rupture à traiter | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed010000000000000003fa` |
| Z19 CLICHY | Mathilde AUBERT | Rupture à traiter | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed010000000000000003fb` |
| Z20 CLICHY | Jules HENRY | Rupture à traiter | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed020000000000000003fc` |
| Z21 CLICHY | Justine LEMAIRE | Rupture à traiter | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed010000000000000003fd` |
| Z22 CLICHY | Matéo NOEL | Rupture à traiter | ML_CLICHY › À traiter ou recontacter ; CFA_AFTRAL › Ruptures de moins de 45 j | `/mission-locale/5eed010000000000000003fe` |
| Z23 CLICHY | Inès LACROIX | Rupture à traiter | ML_CLICHY › À traiter ou recontacter ; CFA_AFTRAL › Ruptures de moins de 45 j | `/mission-locale/5eed010000000000000003ff` |
| Z24 CLICHY | Tom JULIEN | Rupture à traiter | ML_CLICHY › À traiter ou recontacter ; CFA_AFTRAL › Ruptures de 45 j et plus | `/mission-locale/5eed01000000000000000400` |
| Z25 CLICHY | Charlotte LAURENT | Contacté sans retour | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed01000000000000000401` |
| Z26 CLICHY | Axel BRUNET | Contacté sans retour, relance WhatsApp envoyée | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed01000000000000000402` |
| Z27 CLICHY | Candice MORIN | Contacté sans retour, a répondu « pas besoin » au WhatsApp | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed02000000000000000403` |
| Z28 CLICHY | Adrien DUBOIS | Contacté sans retour | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed01000000000000000404` |
| Z29 CLICHY | Justine GAILLARD | Contacté sans retour | ML_CLICHY › À traiter ou recontacter | `/mission-locale/5eed01000000000000000405` |
| Z30 CLICHY | Quentin MARTIN | Dossier traité | ML_CLICHY › Traités | `/mission-locale/5eed01000000000000000406` |
| Z31 CLICHY | Candice CARRE | Dossier traité | ML_CLICHY › Traités | `/mission-locale/5eed01000000000000000407` |
| Z32 CLICHY | Nolan ROBERT | Dossier traité | ML_CLICHY › Traités | `/mission-locale/5eed02000000000000000408` |
| Z33 CLICHY | Alice AUBERT | Dossier traité | ML_CLICHY › Traités | `/mission-locale/5eed01000000000000000409` |
| Z34 CLICHY | Nathan COUSIN | Dossier traité | ML_CLICHY › Traités | `/mission-locale/5eed0100000000000000040a` |
| Z35 CLICHY | Lola MARTIN | Dossier traité | ML_CLICHY › Traités | `/mission-locale/5eed0100000000000000040b` |
| Z36 CLICHY | Paul LEMAIRE | Dossier traité | ML_CLICHY › Traités | `/mission-locale/5eed0200000000000000040c` |
| Z37 CLICHY | Célia PAUL | Dossier traité | ML_CLICHY › Traités | `/mission-locale/5eed0100000000000000040d` |
| Z38 CLICHY | Samuel VASSEUR | Dossier traité | ML_CLICHY › Traités | `/mission-locale/5eed0100000000000000040e` |
| Z39 CLICHY | Amandine DUVAL | Dossier traité | ML_CLICHY › Traités | `/mission-locale/5eed0100000000000000040f` |
| Z40 CLICHY | Axel REMY | Collaboration AFTRAL traitée par la ML | ML_CLICHY › Traités (+ Collaborations) ; CFA_AFTRAL › Ruptures de 45 j et plus, Suivi ML › Collaborations | `/mission-locale/5eed01000000000000000410` |
| Z41 CLICHY | Juliette DUVAL | Dossier traité | ML_CLICHY › Traités ; CFA_AFTRAL › Ruptures de 45 j et plus, Suivi ML › Hors collaboration | `/mission-locale/5eed01000000000000000411` |

## Autres données

- **L65 INVITATION CFA** : La ML a déjà invité le CFA sans collaboration à collaborer
