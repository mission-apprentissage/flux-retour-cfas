# Jeu de données fictif de recette (`seed:recette`)

Fichier généré par `readme.ts` à partir du catalogue — ne pas éditer à la main.
Regénérer : `npx vitest run --project server tests/unit/jobs/seed-recette-readme.test.ts -u`.

## Fonctionnement

- Régénéré chaque nuit à 05h00 sur recette (cron déclaré uniquement si `MNA_TDB_ENV=recette`) : purge de tout le jeu fictif, puis recréation avec des dates recalculées au jour même. **Les manipulations de la veille sont perdues.**
- À la main : `yarn cli seed:recette` (`--dry-run` pour simuler, `--uninstall` pour tout retirer et remettre les flags des hôtes).
- Refuse de tourner hors recette/local/test, et s'arrête sans rien écrire si un hôte a une activité réelle (effectif ou dossier ML hors seed).
- Tous les `_id` créés commencent par `5eed` ; les URL ci-dessous restent valides d'une nuit à l'autre.
- Identités fictives : e-mails en `@example.com` (domaine réservé), téléphones dans la plage de fiction ARCEP 06 39 98.
- WhatsApp : hors production, aucun envoi sans `MNA_TDB_WHATSAPP_TEST_PHONE_OVERRIDE`, et tout part alors vers ce seul numéro.

## Hôtes (organisations réelles de recette)

Accès par impersonation admin depuis l'organisation, ou avec un compte ci-dessous.

| Code | Organisation | Rôle dans le jeu | Organisation `_id` |
| --- | --- | --- | --- |
| ML_A | Mission Locale Ivry-Vitry-sur-Seine (ml_id 569) | ML activée par le seed, avec lien de RDV | `679b92f1bdd1dd56b488014e` |
| ML_B | Mission Locale d'Aubervilliers (ml_id 39) | ML non activée | `67b59632ba5ecb4ba6caaaec` |
| CFA_ON | ESTP, Cachan | Collaboration active | `693e1c17ae4afef0564640f1` |
| CFA_SUSP | Association Sup de Vinci, Saint-Maur-des-Fossés | Collaboration suspendue pour inactivité | `693e1c07ae4afef056463b30` |
| CFA_OFF | Maison du Sacré-Cœur, Thiais | Utilise le TDB, sans collaboration | `693e1c20ae4afef056464464` |
| CFA_SANS | AFASEC Grosbois, Boissy-Saint-Léger | Sans compte TDB | `693e1c18ae4afef056464133` |
| CFA_DECA | Plateform', Montreuil | Pilote DECA et collaboration active | `693e1c21ae4afef056464503` |

## Comptes

Mot de passe commun : variable `MNA_TDB_SEED_RECETTE_PASSWORD` (sops, `env.recette.yml`) — à demander, jamais écrit ici. Sans elle, les comptes existent mais ne sont pas connectables.

| Nom | E-mail | Hôte | Rôle CFA | Code |
| --- | --- | --- | --- | --- |
| Claire Fontaine | claire.fontaine@example.com | ML_A | — | ML_A_CONSEIL_1 |
| Karim Benali | karim.benali@example.com | ML_A | — | ML_A_CONSEIL_2 |
| Sophie Marchand | sophie.marchand@example.com | CFA_ON | admin | CFA_ON_ADMIN |
| Julien Carpentier | julien.carpentier@example.com | CFA_ON | member | CFA_ON_MEMBRE |
| Nadia Haddad | nadia.haddad@example.com | CFA_SUSP | admin | CFA_SUSP_ADMIN |
| Pierre Lemoine | pierre.lemoine@example.com | CFA_OFF | admin | CFA_OFF_ADMIN |
| Aurélie Chevalier | aurelie.chevalier@example.com | CFA_DECA | admin | CFA_DECA_ADMIN |

## Jeunes et cas testés

| Cas | Jeune | Ce qu'il teste | Où le voir | Fiche |
| --- | --- | --- | --- | --- |
| A01 STANDARD | Lucas Bernard | Rupture récente, CFA sans compte | ML_A › À traiter ou recontacter | `/mission-locale/5eed01000000000000000001` |
| A02 DECA | Chloé Dubois | Rupture remontée par DECA (CFA sans DECA côté CFA) | ML_A › À traiter ou recontacter | `/mission-locale/5eed02000000000000000002` |
| A03 MINEUR | Hugo Thomas | Jeune de 17 ans → prioritaire | ML_A › À traiter ou recontacter (+ Dossiers prioritaires) | `/mission-locale/5eed01000000000000000003` |
| A04 RQTH | Manon Robert | Jeune de 28 ans avec RQTH → visible et prioritaire | ML_A › À traiter ou recontacter (+ Dossiers prioritaires) | `/mission-locale/5eed01000000000000000004` |
| A09 A CONTACTER | Louis Moreau | Le jeune a confirmé vouloir être contacté (badge « à contacter ») | ML_A › À traiter ou recontacter | `/mission-locale/5eed01000000000000000009` |
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
| I56 ML B ANCIENNE | Lina David | ML non activée : rupture ancienne, sans fenêtre d'activation | ML_B › À traiter ou recontacter | `/mission-locale/5eed01000000000000000038` |
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
| J140 CFA_DECA INSCRIT, ENTRÉE À VENIR | Clara Roux | Tableau des effectifs CFA_DECA : inscrit, entrée à venir | CFA_DECA › Effectifs | `/cfa/5eed0100000000000000008c` |
| J141 CFA_DECA INSCRIT SANS CONTRAT | Théo Vincent | Tableau des effectifs CFA_DECA : inscrit sans contrat | CFA_DECA › Effectifs | `/cfa/5eed0100000000000000008d` |
| J142 CFA_DECA APPRENTI | Anaïs Fournier | Tableau des effectifs CFA_DECA : apprenti | CFA_DECA › Effectifs | `/cfa/5eed0100000000000000008e` |
| J143 CFA_DECA ABANDON (EXCLUSION) | Noah Morel | Tableau des effectifs CFA_DECA : abandon (exclusion) | CFA_DECA › Effectifs | `/cfa/5eed0100000000000000008f` |
| J144 CFA_DECA FIN DE FORMATION | Maëlys Girard | Tableau des effectifs CFA_DECA : fin de formation | CFA_DECA › Effectifs | `/cfa/5eed01000000000000000090` |

## Autres données

- **L65 INVITATION CFA** : La ML a déjà invité le CFA sans collaboration à collaborer
