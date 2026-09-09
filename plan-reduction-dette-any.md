# Plan — Réduction de la dette `any`

Mesures faites le 09/09/2026 sur la branche `complete-summer-refacto` (post-suppression MUI). Objectif final : `noImplicitAny: true` sur les trois workspaces, `@typescript-eslint/no-explicit-any: error` global, zéro `as any` hors tests, et un garde-fou CI qui empêche la dette de remonter entre-temps.

## 0. Avancement

| Lot | Contenu                                                                    | Statut                                                                                                            |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 0   | ESLint `warn` + overrides `error`, `ts-ignore` interdit, flags ui gratuits | **livré 09/09/2026** (pas de ratchet ni de script commité, décision D4)                                           |
| 1   | Modules sans types (`@types/*`, `.d.ts`)                                   | **livré 09/09/2026** (24 → 0 TS7016)                                                                              |
| 2   | Socle HTTP serveur (`returnResult`, validation, middlewares, filtres)      | **livré 09/09/2026** sauf 2.4 (`filters.ts`, `effectifs-filters.ts`) et 2.5 (`catch (e: any)`), reportés au lot 4 |
| 3   | `shared` (modèles Zod, primitives)                                         | **livré 09/09/2026** (98 → 2 : `is_lock` ×2 conservés, décision D6)                                               |
| 4   | `server/src` actions / jobs / utils                                        | à faire                                                                                                           |
| 5   | `ui` (httpClient, hooks, composants, utils)                                | à faire                                                                                                           |
| 6   | Tests serveur (factories typées)                                           | à faire                                                                                                           |
| 7   | Verrouillage (`noImplicitAny`, eslint `error`)                             | à faire                                                                                                           |

## 1. État des lieux

### 1.1 `any` explicite (grep `\bany\b`, hors commentaires, fichiers `.ts/.tsx` suivis par git, `.d.ts` exclus)

| Workspace | Occurrences | Fichiers touchés | Fichiers TS |
| --------- | ----------: | ---------------: | ----------: |
| server    |         864 |              151 |         497 |
| ui        |         193 |               79 |         623 |
| shared    |          98 |               12 |         113 |
| **Total** |   **1 155** |          **242** |   **1 233** |

- Tests : 635 (55 %) — source : 520.
- Par forme : `as any` 571 (dont ~480 en tests), `: any` 316, `Record<string, any>` 60, `any[]` 55, `<any>` génériques 25, `Promise<any>` 7.
- Marqueurs associés : `@ts-ignore` 2, `@ts-expect-error` 7, `eslint-disable` 35.
- `catch (e: any)` : ui 33, server 22.

### 1.2 `any` implicite (tsc `--noImplicitAny`, aujourd'hui désactivé en ui et server)

| Workspace | Erreurs | Fichiers | dont tests |
| --------- | ------: | -------: | ---------: |
| server    |     399 |       86 |         65 |
| ui        |      50 |       20 |          0 |
| shared    |       0 |        0 |          0 |

Répartition server par code : TS7006 (paramètre) 259, TS7031 (destructuring) 55, TS7053 (index) 33, TS7016 (module sans types) 24, TS7005 (variable) 16.

Le foyer principal est `server/src/http/routes` (161 erreurs) : 33 handlers déclarés `async (req, { locals }) => …` et passés à `returnResult` (177 usages) sans aucun type sur `req`/`locals`. Une seule correction de signature dans `returnResult` en règle la majorité.

### 1.3 Configuration actuelle

- `server/tsconfig.json` : `strict: true` mais `noImplicitAny: false` (posé lors du passage à TypeScript, #2604).
- `ui/tsconfig.json` : `noImplicitAny: false`, `strictFunctionTypes: false`, `useUnknownInCatchVariables: false` (#3888). Coût réel mesuré de réactiver les deux derniers : **3 erreurs** (`FullTable.tsx` ×2, `GestionOrganismesClient.tsx` ×1).
- `shared/tsconfig.json` : strict complet, déjà propre côté implicite.
- `.eslintrc.cjs` racine : `@typescript-eslint/no-explicit-any: 0` et `ban-ts-comment: 0` pour tout le monorepo.
- CI (`ci.yml`) : jobs `lint` et `typecheck` présents, aucun compteur de dette.

### 1.4 Hotspots

Explicite, source :

- `shared/models/data/voeuxAffelnet.model.ts` — 62 (`z.any().nullish()` sur tout le `raw`)
- `shared/models/parts/zodPrimitives.ts` — 21 (`(v: any)` dans les `preprocess`)
- `ui/common/httpClient.ts` — 15 (`<T = any>` par défaut, `AxiosRequestConfig<any>`, champs d'erreur `any`)
- `server/src/http/middlewares/validateRequestMiddleware.ts` — 11 (`ZodEffects<any, T>`, `RequestHandler<…, any, …>`)
- `server/src/common/actions/helpers/filters.ts` — 11 (`preprocess((str: any) => str.split(","))`)
- `server/src/http/middlewares/helpers.ts` — 10 (`returnResult`, `requireOrganismePermission`, `(req.params as any).id`)
- `ui/app/(public)/auth/inscription/profil/ProfilClient.tsx` 11, `xlsxUtils.ts` 9, `organismes.actions.ts` 8, `mission-locale.actions.ts` 8, `users.actions.ts` 7, `effectifs.actions.ts` 7, `sentry.ts` 7, `UserForm.tsx` 7, `useExcelFileProcessor.ts` 6, `RolesHabilitationsClient.tsx` 6

Explicite, tests :

- `tba-contacts.test.ts` 98, `cfa-effectifs.actions.test.ts` 88, `whatsapp.test.ts` 67, `migrate-orphan-ml-records.test.ts` 25, `process-ingestion.test.ts` 20, `connexion-invitation-info.actions.test.ts` 19, `mission-locale.routes.test.ts` 16, `deca-cfa-pilot.test.ts` 16
- Motif dominant : `insertOne(buildX() as any)` et `override: Record<string, any> = {}` dans des factories locales non typées.

Implicite, source server :

- `mission-locale.routes.ts` (organisations) 33, `indicateurs-ml.routes.ts` 28, `affelnet.routes.ts` 22, `france-travail.routes.ts` 21, `admin.routes/mission-locale.routes.ts` 19, `effectifs-filters.ts` 14, `effectifs.actions.ts` 13, `emails.actions.ts` 11, `errorMiddleware.ts` 9, `passport-handlers.ts` 8, `mongodb.ts` 7, `contratsDossierApprenantSchemaV3.ts` 7

Implicite, ui :

- `EffectifQueueItemDetail.tsx` 9, `exportUtils.ts` 7, `httpClient.ts` 5, `ParametresClient.tsx` 4, `effectifFields.ts` 3 ; 25 des 50 sont des TS7053 (indexation d'un objet littéral par `string`).

### 1.5 Commandes de mesure (à figer dans un script au lot 0)

```sh
# explicite, par workspace
git ls-files 'ui/**/*.ts' 'ui/**/*.tsx' 'server/**/*.ts' 'shared/**/*.ts' \
  | grep -vE 'node_modules|\.next/|/dist/|\.d\.ts$' \
  | xargs grep -hE '\bany\b' | grep -vE '^\s*(//|\*|/\*)' | wc -l

# implicite, par workspace (le --pretty false est indispensable pour grepper)
cd server && npx tsc --noEmit --noImplicitAny --pretty false -p tsconfig.json | grep -c 'error TS'
cd ui && npx tsc --noEmit --noImplicitAny --pretty false -p tsconfig.json | grep -c 'error TS'
```

## 2. Principes

- **`unknown` plutôt que `any`**, puis narrowing (`typeof`, type guard, parse Zod). Un `any` qui reste doit être justifié en commentaire de commit, jamais dans le code.
- **`as any` interdit en source.** Si un cast est inévitable (typage tiers cassé), `@ts-expect-error` avec description, jamais `@ts-ignore`.
- **Défauts génériques en `unknown`**, pas en `any` (`httpClient`, `returnResult`, `validateRequestMiddleware`). Un défaut `any` contamine silencieusement tous les appelants.
- **Les schémas Zod de `shared` sont la source des types** (`z.infer`). Pas de duplication d'interfaces côté ui ni de types "maison" pour les réponses API quand un modèle `shared` existe.
- **Zéro changement de comportement runtime** par lot : typecheck + tests verts, diff fonctionnel nul. Les exceptions (lot 3.1, lot 2.4) sont signalées et livrées isolément.
- **Ratchet** : à partir du lot 0, les deux compteurs (explicite, implicite) ne peuvent que baisser. Toute PR qui les fait remonter échoue en CI.
- **PR petites, une fonctionnalité par commit**, découpage par domaine métier plutôt que par fichier. Pas de PR "remplace tous les `any` du repo".

## 3. Lots

### Lot 0 — Garde-fous (livré)

- ESLint racine : `@typescript-eslint/no-explicit-any: "warn"` global, override `error` sur 14 répertoires déjà propres (`ui/app/(cfa)`, `(cfa-detail)`, `(ml-detail)`, `(organisme)`, `(france-travail)`, `(decommissionnement)`, `suivi-des-indicateurs`, `ui/common/{constants,domain,filters,types}`, `shared/models/{routes,fixtures}`, `server/tests/data`), liste à étendre à chaque lot livré. `ban-ts-comment` réactivé : `ts-ignore` et `ts-nocheck` interdits, `ts-expect-error` libre. Les 2 `@ts-ignore` de `migrations.ts` étaient morts (aucune erreur masquée) et ont été retirés.
- `ui/tsconfig.json` : `strictFunctionTypes: true` et `useUnknownInCatchVariables: true` (3 erreurs corrigées : `FullTable.tsx` enveloppe les `OnChangeFn` de TanStack, `GestionOrganismesClient.tsx` accepte un `detail` optionnel).
- **Pas de ratchet CI ni de script versionné** (décision D4, Yohann 09/09) : le compteur sert uniquement pendant le chantier, hors repo. Les commandes de mesure de la section 1.5 restent la référence.

### Lot 1 — Modules sans types (livré, 24 → 0 TS7016)

- `@types/*` installés : server `jsonwebtoken`, `cors`, `cookie-parser`, `nodemailer`, `ejs`, `adm-zip`, `json2csv`, `swagger-ui-express` ; ui `luxon`, `lodash.get`.
- Déclarations locales `server/src/@types/*.d.ts` (9 modules) : `passport`, `passport-jwt`, `passport-localapikey`, `mjml`, `nodemailer-html-to-text`, `migrate-mongo`, `sha512crypt-node`, `lil-http-terminator`, `convert-csv-to-json`. Raisons de ne pas prendre les `@types` officiels :
  - `@types/passport` déclare `Request.user?: User` et écrase l'augmentation maison `user: AuthContext` (le conflit est avalé par `skipLibCheck`) → ~60 sites `req.user` deviennent `possibly undefined`. À reprendre au lot 4 (helper `getAuthUser(req)`), après quoi `@types/passport` + `@types/passport-jwt` remplaceront les `.d.ts` locaux.
  - `@types/mjml` et `@types/nodemailer-html-to-text` dépendent en `*` de `@types/mjml-core` 5 et `@types/html-to-text` 9, incompatibles avec les runtimes installés (mjml 4, html-to-text 7).
  - `@types/migrate-mongo` tire un second driver `mongodb@7` dans le lockfile.
- Les payloads JWT sont typés (`UserJwtPayload`, `TokenJwtPayload` dans `passport-handlers.ts`), ce qui a retiré 2 `any` explicites au passage.

### Lot 2 — Socle HTTP serveur (livré le 09/09 sauf 2.4 et 2.5)

Ce qui a été fait :

- `helpers.ts` : `RouteHandler<TLocals, TParams, TQuery, TBody>` et `returnResult<TLocals, …>` sans aucun `any` ; `DefaultParams = Record<string, string>` (choix assumé : le repo n'utilise ni splat ni paramètres répétés, alors que `ParamsDictionary` d'Express 5 dit `string | string[]`) ; interfaces de `locals` par famille (`MissionLocaleLocals`, `FranceTravailLocals`, `OrganismeLocals`, `RegionalLocals`, `IndicateursMlLocals`) ; les middlewares `require*` typent `res.locals` et `requireOrganismePermission` est déclaré `RequestHandler<never, unknown, never, never, OrganismeLocals>` pour s'unifier avec n'importe quelle chaîne validée.
- `validateRequestMiddleware` : `ZodType<T, ZodTypeDef, unknown>` (une seule signature), `next(errors)` au lieu de `(next as any)(…)`, export `isValidationErrorList`.
- `errorMiddleware` : `ErrorRequestHandler` typé, narrowing par `Boom.isBoom` / `instanceof ZodError` / liste de validation / `name === "ValidationError"` ; un non-`Error` levé est enveloppé au lieu de faire planter `boomify`.
- 38 handlers standalone typés dans 12 fichiers de routes ; les schémas Zod inline ont été hoistés en constantes pour en dériver `z.infer` (indicateurs-ml, admin ML, france-travail, affelnet, transmissions, erps, opcos, reseaux, public ML) ; les casts `as StatsPeriod` / `as string` / `as IOrganisation…` devenus inutiles ont été retirés.
- `zCommaSeparated` (`server/src/common/validation/commaSeparated.ts`) créé et utilisé dans `affelnet.routes.ts` ; reste à l'appliquer à `filters.ts` et `effectifs-filters.ts` (2.4).

Changements de comportement assumés (tous sur des entrées invalides, jamais sur le chemin nominal) :

- `requireMissionLocale` / `requireFranceTravail` : organisation introuvable ou de mauvais type → 404 immédiat au lieu d'un `null` propagé aux handlers.
- `POST /organisation/membres` et `POST /admin/fusion-organismes` : corps validé par Zod → 400 au lieu d'un `TypeError` 500 (ou d'un `new ObjectId(undefined)` aléatoire pour la fusion).
- `PUT /admin/reseaux/:id` : `organismeId` non-string → 400 (avant : `new ObjectId(123)` acceptait un nombre).
- `POST …/effectifs/validate` : corps non-tableau → `warnings: []` au lieu d'un plantage dans `computeWarnings…`.
- Schéma `arml` de `GET /admin/mission-locale/stats` : `z.array(id)` au lieu de `z.array(id.optional())` (aucune différence sur une query string).
- Non-`Error` levé dans une route → enveloppé dans une `Error` (avant : assertion de `boomify`).
- `req.err` (lu par `logMiddleware`) reçoit toujours une `Error` : pour une liste d'erreurs de validation (400), le log `request errored` porte une `Error` générique au lieu du tableau brut.

Reste dans `src/http` (≈ 30 implicites) : uniquement des callbacks `(d) =>` / `(val) =>` sur des données renvoyées en `any` par la couche actions (exports ML/FT, affelnet) → lot 4.

Plan initial :

- **2.1 `returnResult`** : signature typée `(req: Request<P, unknown, B, Q, L>, res: Response<unknown, L>) => Promise<unknown>` avec `TLocals` sans défaut `any`. Définir les types de `locals` par famille de routes (`{ missionLocale: IOrganisationMissionLocale }`, France Travail, admin, organisme) dans `middlewares/helpers.ts` et typer les 33 handlers `(req, { locals })`. `@types/express` est en 5.0.6 (Express 5.2), la généricité `Locals` de `RequestHandler` est donc disponible. Effet attendu : ~160 erreurs implicites en moins (`mission-locale` 33, `indicateurs-ml` 28, `affelnet` 22, `france-travail` 21, admin ML 19, organismes ML 8, `emails` 7, `transmission` 6).
- **2.2 `validateRequestMiddleware`** : `ZodEffects<any, T>` → `ZodType<T, ZodTypeDef, unknown>`, `RequestHandler<…, any, …>` → `unknown`, suppression du `(next as any)`.
- **2.3 Middlewares et socle** : `errorMiddleware` (signature `ErrorRequestHandler`), `passport-handlers`, `requireApiKeyAuthentication`, `mongodb.ts` (`configureDbSchemaValidation` prend un `IModelDescriptor`, pas un binding implicite), `createCollectionIndexes`, `(req.params as any).id` → `Request<{ id: string }>`.
- **2.4 `filters.ts`** : helper `zCommaSeparated(schema)` avec `preprocess((v: unknown) => …)` et garde `typeof v === "string"`, réutilisé dans `effectifs-filters.ts` (14 implicites). ⚠️ Changement de comportement assumé : une valeur non-string renvoyait un 500 (`.split` sur `undefined`), elle renverra un 400 Zod. À mentionner dans la PR.
- **2.5 `catch (e: any)` ×22** → `unknown` + helper `getErrorMessage(err: unknown)` / `Boom.isBoom`.

### Lot 3 — `shared` (livré le 09/09, 98 → 2)

Ce qui a été fait :

- `voeuxAffelnet.model.ts` : les 62 `z.any().nullish()` de `raw` passent en `z.string().nullish()` après relevé sur `tdb-preprod-copy` (370 518 documents, `raw` et `history[].raw` : 100 % `string`, `annee_scolaire_rentree` parfois absent). Côté Mongo, le validateur passe de `{}` à `bsonType: ["string", "null"]` sur ces champs.
- `effectifsDECA.apprenant.adresse` : `z.record(z.unknown()).nullish()` (preprod : 4 207 729 objets, 2 absents, aucun `null`). `organismesReferentiel.geojson.geometry.coordinates` : `z.array(z.unknown())` car la preprod contient des `Polygon`/`MultiPolygon` (tableaux imbriqués) en plus des `Point`.
- `auditLogs.data` et `usersMigration.emails[].payload` : `z.unknown()`. Vérifié avec `zodToMongoSchema` : `z.unknown()` produit le même validateur que `z.any()` (`{}`), `z.array(z.unknown())` ajoute seulement `items: {}`.
- `zodPrimitives.ts` : tous les `preprocess` en `(v: unknown)` ; `code_naf` et `code_rncp` narrowés par `typeof` (une valeur non-string ne plante plus le preprocess, elle tombe en erreur de validation) ; les `as any` sur les exemples OpenAPI étaient inutiles.
- `dossierApprenantSchemaV3.ts` : `stripModelAdditionalKeys<T>` générique (`Omit<Partial<T>, "_id">`), `nir_apprenant` en `z.unknown()`.
- `.d.ts` API Entreprise / MNA : `string | null` et `Array<unknown>` ; `deployedRegions`, `territoires` (`ACADEMIES_DEPARTEMENT_MAP` typé), `sortAlphabeticallyBy` (`Record<Key, unknown>` + `String()`, identique au comportement de `Intl.Collator`), `zodHelper`.
- Retombées côté server : `infoSiret.actions` (`complement_adresse ?? undefined`), `affelnet.routes` admin (garde sur `raw.academie`), `dossiers-apprenants.routes` (`_id` explicite dans la queue, garde `user.source` → 401 si absent, jamais atteint en pratique).

- Snapshot `validationSchema.test.ts.snap` mis à jour pour 3 collections (`voeuxAffelnet`, `effectifsDECA`, `missionLocaleEffectif`) : seuls `raw.*`, `history[].raw.*` et `apprenant.adresse` changent. Suite serveur : 1 409 tests verts.

Conservé : `is_lock: z.any()` dans `effectifs.model.ts` et `effectifsDECA.model.ts` (décision D6).

Plan initial :

- **3.1 `voeuxAffelnet.model.ts` (62 `z.any()`)** : ce schéma **est** appliqué comme validation Mongo (`configureDbSchemaValidation` au boot, `validationLevel: strict`, `validationAction: error`), donc un typage strict peut faire rejeter des inserts en prod. Démarche : `collection-schema` via MCP sur `tdb-preprod-copy` pour relever les types réels champ par champ, typer en `z.string().nullish()` / `z.coerce.date().nullish()` selon relevé, rejouer `hydrate-voeux-effectifs` sur la copie preprod, livrer dans une PR isolée avec rollback trivial. Voir D1.
- **3.2 `zodPrimitives.ts` (21)** : `(v: any)` → `unknown` avec narrowing ; idem `dossierApprenantSchemaV3.ts` (4), `zodHelper.ts` (2).
- **3.3 `.d.ts` API externes** (`ApiEntEtablissement`, `MnaOrganisme`, 8) : types réels ou `unknown`.
- **3.4 Divers** (`effectifs`, `effectifsDECA`, `auditLogs`, `organismesReferentiel`, `usersMigration`, `territoires`, `deployedRegions`, `sortAlphabetically` en générique `<T>`).

### Lot 4 — `server/src` actions, jobs, utils (~250 explicites, ~60 implicites, 3 j)

Découper en PR par domaine :

- **effectifs** : `effectifs.actions.ts` (7 + 13 implicites), `effectifs-filters.ts`, `contratsDossierApprenantSchemaV3.ts` (7)
- **organismes** : `organismes.actions.ts` (8), `hydrate-organismes.ts`, jobs fiabilisation UAI/SIRET
- **mission-locale** : `mission-locale.actions.ts` (8), routes ML restantes
- **brevo / emails** : `emails.actions.ts` (11 implicites), `emails.routes.ts`, `sentry.ts` (7)
- **users / auth** : `users.actions.ts` (7), `passport-handlers.ts`
- **utils & jobs** : `xlsxUtils.ts` (9), `hydrate-rome.ts`, `jobs/migrations`, `scripts/` (commandes CLI)

Règles transverses : `Record<string, any>` (60) → `Record<string, unknown>` ou le type du document ; pipelines Mongo → `Document[]` / `Filter<IEffectif>` ; `options: any` → interfaces d'options nommées.

### Lot 5 — `ui` (193 explicites, 50 implicites, 3 j)

- **5.1 `httpClient.ts`** en deux temps : (a) typer les appelants (71 `_get` et 17 `_post` sans générique aujourd'hui) domaine par domaine avec les types `shared` (`IEffectif`, `IOrganisme`, `IMissionLocaleEffectif`, `IOrganisationJson`…) ; (b) seulement ensuite basculer `<T = any>` → `<T = unknown>` et `AxiosRequestConfig<any>` → `AxiosRequestConfig`, typer `json/statusCode/prettyMessage`. Voir D2 pour l'origine des types de réponse. Ordre des domaines : ruptures (hooks React Query de `_components/ruptures/shared/hooks`), admin, effectifs, organismes, compte, inscription.
- **5.2 TS7053 (25)** : objets littéraux indexés par `string` → `as const` + garde `key in obj` / `keyof typeof` (`UserForm`, `UserTableCells`, `InscriptionMissionLocale`, `DoublonsDetailTable`, `EffectifQueueItemDetail`).
- **5.3 Utils** : `exportUtils.ts` (7), `stringUtils`, `date.utils`, `dateUtils`, `misc`, `siret`, `useExcelFileProcessor.ts` (6) → génériques et `unknown`.
- **5.4 Composants lourds** : `ProfilClient.tsx` (11), `UserForm.tsx` (7), `RolesHabilitationsClient.tsx` (6), `EffectifQueueItemDetail.tsx` (9), `ParametresClient.tsx` (4), `TeleversementTable`, `effectifFields.ts`. Formik : `Formik<FormValues>` / `useFormik<FormValues>` systématiques.
- **5.5 `catch (e: any)` ×33** → `unknown` + helper `getErrorMessage` partagé (le même que serveur, à placer dans `shared/utils`).

### Lot 6 — Tests serveur (635 explicites, 65 implicites, 3 j, parallélisable, faible risque)

- Factories typées dans `server/tests/data/` : `buildEffectif(overrides?: Partial<IEffectif>): WithoutId<IEffectif>`, `buildMlEffectif`, `buildOrganisme`, `buildOrganisation`, `buildUser`. Elles remplacent les factories locales (`insertEffectif`, `createMlEffectifDoc`, `buildEffectif` de `tba-contacts.test.ts`) et suppriment les 98 `insertOne(x as any)`.
- `override: Record<string, any>` → `Partial<T>` (ou `DeepPartial<T>` utilitaire dans `tests/utils`).
- Mocks : `vi.mocked(fn)` / `vi.fn<typeof fn>()` au lieu de `as any`.
- Cibles par volume : `tba-contacts` 98, `cfa-effectifs.actions` 88, `whatsapp` 67, `migrate-orphan-ml-records` 25, `process-ingestion` 20, `connexion-invitation-info` 19, `mission-locale.routes` 16 + 21 implicites, `deca-cfa-pilot` 16, `update-fiabilisation-uai-siret` 20 implicites.
- Fin de lot : override eslint `no-explicit-any: error` sur `server/tests` et `**/*.test.ts`.

### Lot 7 — Verrouillage (½ j)

- `noImplicitAny: true` dans `server/tsconfig.json` et `ui/tsconfig.json` (0 erreur attendue, à mesurer avant).
- `@typescript-eslint/no-explicit-any: "error"` global, suppression des overrides intermédiaires. Le job ratchet peut rester comme filet (baseline à 0) ou disparaître.
- CLAUDE.md : trois lignes de règle (`unknown` pas `any`, `as any` interdit en source, factories typées en tests).

## 4. Ordre, dépendances, effort

- 0 → 1 → 2 → { 3, 4, 5, 6 en parallèle } → 7. Le lot 5.1(b) dépend de D2 ; le lot 4 "mission-locale" dépend du lot 2.1.
- **Démarrer après le merge de #4662** : la branche courante est `complete-summer-refacto`, et le lot 2 touche `middlewares/helpers.ts` et les routes ML, qui sont déjà le hotspot de conflit avec #4658.
- Effort total ≈ 13 à 14 jours, en 15 à 20 PR. Les lots 4, 5, 6 sont découpables en tâches indépendantes d'une demi-journée.

## 5. Cibles par lot

| Après lot              |                         Explicite (≈) |           Implicite (≈) |
| ---------------------- | ------------------------------------: | ----------------------: |
| baseline               |                                 1 155 |                     449 |
| 1 (réel)               |                                 1 153 |                     412 |
| 2 (réel, sans 2.4/2.5) | 1 124 (server 833, ui 193, shared 98) | 278 (server 230, ui 48) |
| 3 (réel)               |  1 028 (server 833, ui 193, shared 2) |                     278 |
| 4                      |                                   745 |                     140 |
| 5                      |                                   550 |                      90 |
| 6                      |                                  < 50 |                       0 |
| 7                      |                      0 (eslint error) |     0 (`noImplicitAny`) |

Ces valeurs sont des ordres de grandeur ; le script du lot 0 fait foi.

## 6. Risques

- **`voeuxAffelnet` (3.1)** : le schéma sert de validation Mongo (confirmé), un type trop strict casse l'ingestion des vœux. Mitigation : relevé preprod, `nullish` partout, PR isolée, rollback = revert.
- **`httpClient` en `unknown` (5.1)** : bascule brutale = centaines d'erreurs. Mitigation : appelants d'abord, défaut ensuite.
- **`preprocess` avec garde `typeof` (2.4)** : 500 → 400 sur entrée malformée. Changement acceptable, à annoncer.
- **Tests (6)** : refactor massif des factories peut masquer une régression de test. Règle : ne toucher qu'aux données d'entrée, jamais aux assertions, et lancer la suite complète par PR.
- **Conflits** : ne pas ouvrir de PR de typage sur des fichiers en cours de review ailleurs.

## 7. Décisions à arbitrer

- **D1 — `voeuxAffelnet`** : typer strictement après relevé preprod (recommandé) ou basculer en `z.unknown()` (zéro risque, zéro gain).
- **D2 — Origine des types de réponse API côté ui** : `z.infer` sur les modèles `shared` + quelques types manuels dans `ui/common/api/` (recommandé, simple, pas de génération) ou `openapi-typescript` depuis `server/static/open-api.json` (dépend de la couverture réelle de l'OpenAPI, à vérifier ; aujourd'hui surtout v3 ingestion et v2 SIPA).
- **D3 — Tolérance en tests** : objectif zéro avec factories typées (recommandé) ou `warn` permanent sur `tests/`.
- **D4 — Garde-fou** : **tranché le 09/09 (Yohann)** : pas de script ni de job CI versionnés ; eslint `warn` + overrides `error` seulement, le compteur reste un outil de chantier hors repo.
- **D6 — `is_lock`** : forme récursive (booléens imbriqués qui miment l'arbre de l'effectif), consommée dans 11 fichiers. Un `z.lazy` récursif n'est pas garanti côté `zodToMongoSchema` (validateur strict au boot) ; un `z.record(z.unknown())` casserait les 11 consommateurs. Reco : traiter dans le lot 4 « effectifs » avec un type TS dédié (`IsLock`) et un schéma Zod non récursif à deux niveaux, testé sur la copie preprod.
- **D5 — Priorité entre 4, 5 et 6** selon disponibilité front / back ; le lot 6 est le meilleur candidat pour du travail en parallèle ou en fond de sprint.
