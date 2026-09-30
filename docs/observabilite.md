# Observabilité — que faire d'une alerte

Cette page dit qui regarde quoi, et ce qu'on attend de vous quand une alerte arrive.
Elle ne décrit pas comment le code est instrumenté : pour ça, voir `shared/observability/`
et `server/src/common/services/sentry/`.

> **État au 23/09/2026** : l'instrumentation est en place dans le code. Les canaux Slack
> et les règles d'alerte Sentry restent à créer. Tant que c'est le cas, les événements
> sont consultables dans Sentry mais ne notifient personne.

## Les trois niveaux

Chaque événement porte un tag `alert_tier`. C'est lui, et lui seul, qui décide de la
notification.

| Niveau   | Ce que ça veut dire                                                                                                | Où ça arrive                                  | Ce qu'on attend                          |
| -------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ---------------------------------------- |
| `oncall` | Le service est inutilisable pour une population entière, ou on perd de la donnée usager sans pouvoir la rattraper. | `#tableau-de-bord-alerting`, **avec `@here`** | Prise en charge sous 30 min              |
| `jour`   | Une fonction est cassée ou dégradée, l'impact usager est visible, mais le rattrapage peut attendre.                | `#tableau-de-bord-alerting`, sans mention     | Traité avant la fin de la journée ouvrée |
| `veille` | Signal de qualité exploitable, aucune décision immédiate.                                                          | Nulle part — vue Sentry + Metabase            | Revue de sprint                          |

Les deux premiers niveaux partagent le même canal, faute de canal dédié aux
incidents. C'est la **mention** qui les sépare, et c'est elle qui fait le travail :
un message sans mention ne sort personne de sa tâche. Si le volume de `oncall`
rendait un jour le canal illisible, un canal séparé redeviendrait utile — la règle
d'alerte est le seul endroit à changer.

**Le test qui tranche les cas limites** : si personne ne sait quoi faire en recevant
l'alerte à trois heures du matin, ce n'est pas un `oncall`. Si personne ne va la lire
dans la semaine, ce n'est pas une alerte du tout.

`veille` est le **défaut**. Un événement qui ne dit rien de son niveau ne notifie
personne. C'est voulu : alerter se mérite, et une taxonomie qu'on doit entretenir à la
main finit toujours par rouiller.

## Comment le niveau est décidé

Trois mécanismes, dans cet ordre :

1. **Le code le pose explicitement**, via `captureTiered(error, { tier, errorKind, … })`.
   C'est le cas des dépendances injoignables (`oncall`), des erreurs de configuration et
   des erreurs serveur non gérées (`jour`).
2. **`JOB_META` le déduit du nom du job** (`server/src/common/services/sentry/alertContract.ts`).
   La table couvre les crons et les jobs qu'un cron enfile — ces derniers comptent, car
   le monitor d'un cron passe au vert dès qu'il a enfilé, sans rien savoir de la suite.
3. **À défaut, `veille`.**

Un niveau posé par le code n'est jamais écrasé par la table.

## Ajouter ou changer une alerte

**Monter un job d'un cran** : ajoutez ou modifiez son entrée dans `JOB_META`. Un test
refuse qu'un cron du registre soit absent de la table, donc ajouter un cron force à
déclarer son niveau.

**Rétrograder une alerte qui ne mérite pas son tag** : c'est la manœuvre la plus
importante, et elle doit rester facile. Passez le niveau à `veille` dans le code, avec
en commentaire ce qui l'a motivé. Une alerte qu'on apprend à ignorer coûte plus cher
qu'une alerte absente, parce qu'elle entraîne à ignorer les autres.

**Ne mettez jamais en tag** un siret, un uai, un identifiant d'organisme, d'effectif ou
d'utilisateur, ni une date ou une adresse e-mail. Les tags sont indexés par Sentry : une
valeur non bornée y rend les règles d'alerte inutilisables. Ces valeurs vont en `extra`
ou en contexte, où elles restent consultables. Une liste blanche l'applique
automatiquement, et déplace en `extra` tout tag qu'elle ne connaît pas.

## Ce qui ne doit pas devenir une alerte

| Signal                                | Où le consulter                                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Erreurs de transmission des ERP       | En base (`effectifsQueue`) et dans l'UI, sous `transmissions` : chaque organisme voit ses erreurs par date             |
| Durées et statuts des crons           | Metabase, sur `job_processor.jobs`                                                                                     |
| Dérive du référentiel des territoires | Un événement `veille` par exécution du cron mensuel                                                                    |
| Interruption d'un job au déploiement  | En base : `status: "errored"`, `output.error: "Interrupted"`                                                           |
| Les `logger.error` applicatifs        | Logs bunyan → Fluentd. **Ne les branchez pas sur Sentry** : c'est précisément ce qui avait rendu l'outil inexploitable |

## Le budget

Un contrat sans budget se refait noyer. Ces seuils sont des garde-fous, pas des objectifs.

|          | Régime nominal                 | Si dépassé                                                              |
| -------- | ------------------------------ | ----------------------------------------------------------------------- |
| `oncall` | ≤ 5 notifications par mois     | On retire le tag : c'est un incident d'observabilité, pas de production |
| `jour`   | ≤ 15 notifications par semaine | Revue hebdomadaire, on rétrograde                                       |

## Les budgets de crons

Chaque cron déclare deux valeurs à côté de son `cron_string`, et un test refuse qu'un
nouveau cron les omette :

- **`checkinMargin`** — le retard de démarrage toléré avant que Sentry ne le marque
  « missed ». Il couvre l'**attente en file**, pas une dérive d'horloge : le worker est
  unique et séquentiel, donc un cron attend derrière tout ce qui tourne déjà.
- **`maxRuntimeInMinutes`** — la durée tolérée avant « timeout ». Posée au double de la
  durée maximale observée.

Les valeurs viennent d'une mesure sur 90 jours de `job_processor.jobs`, reportée en
commentaire à côté de chaque cron. **À refaire quand les volumes auront changé** : les
défauts de la bibliothèque (5 min et 60 min) maintenaient neuf monitors au rouge en
permanence, sans qu'aucun cron ne soit réellement en panne.

L'ordonnancement nocturne en découle : le batch de 2h30 occupe le worker jusqu'à 4h27,
et les crons qui suivent sont espacés pour ne pas s'attendre. Avant d'ajouter un cron
entre 2h30 et 6h, vérifie où il tombe dans cette file.

## Les deux sondes de santé

Elles répondent à deux questions différentes :

| Route                        | Question                          | Lecteur         | Comportement si Mongo est KO                                              |
| ---------------------------- | --------------------------------- | --------------- | ------------------------------------------------------------------------- |
| `/api/healthcheck`           | Le process répond-il ?            | La sonde Docker | **200** — le champ `mongodb` passe à `false`, mais le statut ne bouge pas |
| `/api/healthcheck/readiness` | Les dépendances répondent-elles ? | La supervision  | **503**                                                                   |

Docker ne doit pas lire la readiness : redémarrer l'API ne répare pas Mongo, et une
base brièvement absente pendant un déploiement ferait tuer les deux réplicas au pire
moment. Un redémarrage est en revanche la bonne réponse à un process figé, ce que la
liveness détecte.

Les deux passent par le même contrôle, qui signale la panne à Sentry **à la transition
seulement** : la sonde Docker interroge la route toutes les 10 secondes sur deux
réplicas, soit 720 appels par heure.

## Les limites connues

- **Le heartbeat d'ingestion ne surveille rien entre 2h30 et 4h27.** Il partage le worker
  avec le batch nocturne, d'où sa marge de 120 minutes. L'ingestion elle-même n'est pas
  bloquée — elle tourne sur `queue_processor`, un service distinct — mais un blocage
  survenu à 3h ne sera signalé qu'à la fin du batch. Le porter par le `queue_processor`
  lèverait la limite.
- **La page Crons de Sentry** est fiable depuis le correctif apporté à `job-processor`
  (`.yarn/patches/`), mais la source de vérité reste `job_processor.jobs`. Le patch sera
  retiré au passage en version 2.5.0.
- **Le scheduler de crons** de `job-processor` émet un événement par minute quand il
  échoue, sans rien qui permette de le distinguer d'une erreur applicative. Il n'est pas
  filtré.
- **Les erreurs du navigateur restent minifiées** : les source maps sont servies
  publiquement mais jamais envoyées à Sentry. Tant que ce point n'est pas traité, les
  erreurs `next-client` sont peu exploitables.
