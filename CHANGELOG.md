## [2.59.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.59.0...v2.59.1) (2022-12-02)

### Bug Fixes

- **ui:** correction ui ([10d16bc](https://github.com/mission-apprentissage/flux-retour-cfas/commit/10d16bcd3223b1920d3c09b9e8fff4790ff0df12))

# [2.59.0](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.58.0...v2.59.0) (2022-12-02)

### Features

- **server:** amelioration seed reseaux referentiel ([1400817](https://github.com/mission-apprentissage/flux-retour-cfas/commit/1400817a2ab2cc38c194ec59059be786c113c7b4))

# [2.58.0-beta.3](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.58.0-beta.2...v2.58.0-beta.3) (2022-11-30)

### Bug Fixes

- **server:** fix exporterUtils ([fddacae](https://github.com/mission-apprentissage/flux-retour-cfas/commit/fddacae80ad8285fa9b4e86a9582288354a0f1e8))

# [2.58.0-beta.2](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.58.0-beta.1...v2.58.0-beta.2) (2022-11-30)

### Bug Fixes

- **server:** fix le job seedReferentiel ([fc64513](https://github.com/mission-apprentissage/flux-retour-cfas/commit/fc64513f50fd8d5e6905ca6dc5d91b5cdef501d2))

# [2.58.0-beta.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.57.0...v2.58.0-beta.1) (2022-11-30)

### Bug Fixes

- **data:** supprime données inutiles modele dossiersApprenants 2 ([9067007](https://github.com/mission-apprentissage/flux-retour-cfas/commit/90670078bf5659a2e7a64fa0328236d9e641167c))
- fix l'ajout de réseaux aux dossiers apprenants depuis les cfas ([e3e8679](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e3e86792c91b449cd2e4909c5f8757da3c4f65dd))
- fix le modele cfas ([c65864f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/c65864f744cca6ca6ec656af8cc0c111cf828cb4))
- **infra:** encrypt sh ([91ed1ac](https://github.com/mission-apprentissage/flux-retour-cfas/commit/91ed1ace2e8e8e2d7fb3dcce5185b49a8d897b90))
- logger default export ([0321fcd](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0321fcdbf500386e511466d695a2dc2e809b65a6))
- merge & upgrade to ESM post mongoValidation ([fe3677a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/fe3677ad73fdf72bba7ece1c0296a2ea7ce6c7d1))
- modele effectifs apprennts ([25b66d9](https://github.com/mission-apprentissage/flux-retour-cfas/commit/25b66d9f0e34fe8e04ccba85dfe417ac9093e372))
- **server:** axios format prettier ([9ad4d01](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9ad4d012be2b509b819f1564b3769f45bcd11610))
- **server:** create createUserTokenSimple for user token from cerfa ([4e04c7a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/4e04c7a7cb5871c095a8ff362c7e94ebdeefb26e))
- **server:** fix le schema de validation du modele dossiersApprenants et supprime champs inutiles (migration) ([0b64d2c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0b64d2c99da7909dfb0c70bc6ca49e32269ef11e))
- **server:** migate-mongo using dotEnv ([0603eaa](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0603eaa6eb69b3c9a0d26693f0000f11a8cc34c9))
- **server:** migate-mongo using dotEnv ([#2247](https://github.com/mission-apprentissage/flux-retour-cfas/issues/2247)) ([177da9b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/177da9bf4afe0f4e0c957f1d8e2baa83c6ef95f1))
- **server:** missing js extensions in migrations ([5777f6b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5777f6bdf36ad2e2b519c4cae1516c387b775070))
- **server:** objectId kind of ref ([6581283](https://github.com/mission-apprentissage/flux-retour-cfas/commit/658128335e3ec9552d0ae6c41838abb15d06569e))
- **server:** unit test replace differenceInHours by differenceInCalendarDays ([b4c6a40](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b4c6a405c437599f08e3a5377ae4d7a0fdf47df0))
- **ui:** ajout de la balise Link ([0dd6a6e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0dd6a6e690ef31ecd57832b36568ea9e984ab218))
- **ui:** correction footer ([8ad166d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8ad166d33d5b77712162e46f29280c493c15b6b1))
- **ui:** corrige lien vers la page question réponses ([#2242](https://github.com/mission-apprentissage/flux-retour-cfas/issues/2242)) ([3f8d30f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3f8d30f834286d56b0b3e39989c4254b3329f545))

### Features

- add base mailer ([62209b6](https://github.com/mission-apprentissage/flux-retour-cfas/commit/62209b6c8b50176e4a2360776fd571e24896936c))
- **server:** id_erp_apprenant est maintenant obligatoire ([ca1468c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ca1468c7ea35ad37976e1492ff94c575a5509923))
- **ui:** add remixicon + responsive journal des evolutions ([c762c6a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/c762c6a87f55aab80c038e636e7c58e70c155c0e))
- **ui:** add table component ([ef531e3](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ef531e3f4ecf04a7ac47a8fd908f998ef6ccf42e))
- **ui:** ajout du systeme responsive sur le tableau ([3ba2e18](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3ba2e185b3d95d09f7eb114b33381fb45cfeeeb2))
- **ui:** ajout icon ([4b1b913](https://github.com/mission-apprentissage/flux-retour-cfas/commit/4b1b913d1dc27c89f59e44e932d32c8389cd92a2))
- **ui:** ajout icon mode connecter ([fd9a1c4](https://github.com/mission-apprentissage/flux-retour-cfas/commit/fd9a1c4d0abd649538fe34f27ecef11adbc0db0c))
- **ui:** ajout page politique de confidentialite ([ffa30a5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ffa30a58958b876ae0c9d237596247852b56eb6d))
- **ui:** ajout sommaire ([94809dc](https://github.com/mission-apprentissage/flux-retour-cfas/commit/94809dcd8436dc2682efdfb2dbad3a017a5d7721))
- **ui:** move component + add responsive ([355e948](https://github.com/mission-apprentissage/flux-retour-cfas/commit/355e94817e8df0c1876ddcf056bb0c0f45c9d810))
- **ui:** responsive contact ([06ed069](https://github.com/mission-apprentissage/flux-retour-cfas/commit/06ed069f92579fd47877b9cfd84e3edb0b1ab4dd))
- **ui:** responsive footer ([f7ba24d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f7ba24d7dfbda68d7d20582bb0d4c81175e63758))
- **ui:** responsive tag header ([976d64a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/976d64a8b8bb2c5bb9666580a66087de39f4e740))
- update env mechanism ([b272f9d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b272f9dd32ecfd1e9ac661c70d29ac33baa043c1))

# [2.57.0](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.56.0...v2.57.0) (2022-11-30)

### Features

- **server:** id_erp_apprenant est maintenant obligatoire ([114ee8b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/114ee8bb421dab0cdf913d3d7466df0572a7c288))

# [2.56.0](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.55.2...v2.56.0) (2022-11-29)

### Features

- nouvelle clé d'unicité id_erp_apprenant/uai/annee scolaire + suppression des doublons sur cette clé ([d67c871](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d67c8719f37e443acbeda4466f55126f91021ccf))

# [2.56.0-beta.4](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.56.0-beta.3...v2.56.0-beta.4) (2022-11-24)

### Features

- **server:** id_erp_apprenant est maintenant obligatoire ([ca1468c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ca1468c7ea35ad37976e1492ff94c575a5509923))

# [2.56.0-beta.3](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.56.0-beta.2...v2.56.0-beta.3) (2022-11-22)

### Bug Fixes

- **server:** améliore le calcul des effectifs en triant l'historique_statut_apprenant par date_statut puis date_reception ([95e930b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/95e930b29246c3239f6b23e9d9d767d4c6066a37))

## [2.55.2](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.55.1...v2.55.2) (2022-11-22)

### Bug Fixes

- **server:** améliore le calcul des effectifs en triant l'historique_statut_apprenant par date_statut puis date_reception ([95e930b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/95e930b29246c3239f6b23e9d9d767d4c6066a37))

## [2.55.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.55.0...v2.55.1) (2022-11-17)

### Bug Fixes

- **data:** supprime données inutiles modele dossiersApprenants 2 ([9067007](https://github.com/mission-apprentissage/flux-retour-cfas/commit/90670078bf5659a2e7a64fa0328236d9e641167c))
- fix l'ajout de réseaux aux dossiers apprenants depuis les cfas ([e3e8679](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e3e86792c91b449cd2e4909c5f8757da3c4f65dd))
- fix le modele cfas ([c65864f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/c65864f744cca6ca6ec656af8cc0c111cf828cb4))
- modele effectifs apprennts ([25b66d9](https://github.com/mission-apprentissage/flux-retour-cfas/commit/25b66d9f0e34fe8e04ccba85dfe417ac9093e372))

# [2.56.0-beta.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.55.2-beta.1...v2.56.0-beta.1) (2022-11-17)

### Bug Fixes

- **infra:** encrypt sh ([91ed1ac](https://github.com/mission-apprentissage/flux-retour-cfas/commit/91ed1ace2e8e8e2d7fb3dcce5185b49a8d897b90))
- logger default export ([0321fcd](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0321fcdbf500386e511466d695a2dc2e809b65a6))
- merge & upgrade to ESM post mongoValidation ([fe3677a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/fe3677ad73fdf72bba7ece1c0296a2ea7ce6c7d1))
- **server:** axios format prettier ([9ad4d01](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9ad4d012be2b509b819f1564b3769f45bcd11610))
- **server:** create createUserTokenSimple for user token from cerfa ([4e04c7a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/4e04c7a7cb5871c095a8ff362c7e94ebdeefb26e))
- **server:** migate-mongo using dotEnv ([0603eaa](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0603eaa6eb69b3c9a0d26693f0000f11a8cc34c9))
- **server:** missing js extensions in migrations ([5777f6b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5777f6bdf36ad2e2b519c4cae1516c387b775070))
- **server:** objectId kind of ref ([6581283](https://github.com/mission-apprentissage/flux-retour-cfas/commit/658128335e3ec9552d0ae6c41838abb15d06569e))
- **server:** unit test replace differenceInHours by differenceInCalendarDays ([b4c6a40](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b4c6a405c437599f08e3a5377ae4d7a0fdf47df0))
- **ui:** ajout de la balise Link ([0dd6a6e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0dd6a6e690ef31ecd57832b36568ea9e984ab218))
- **ui:** correction footer ([8ad166d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8ad166d33d5b77712162e46f29280c493c15b6b1))

### Features

- add base mailer ([62209b6](https://github.com/mission-apprentissage/flux-retour-cfas/commit/62209b6c8b50176e4a2360776fd571e24896936c))
- **ui:** add remixicon + responsive journal des evolutions ([c762c6a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/c762c6a87f55aab80c038e636e7c58e70c155c0e))
- **ui:** add table component ([ef531e3](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ef531e3f4ecf04a7ac47a8fd908f998ef6ccf42e))
- **ui:** ajout du systeme responsive sur le tableau ([3ba2e18](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3ba2e185b3d95d09f7eb114b33381fb45cfeeeb2))
- **ui:** ajout icon ([4b1b913](https://github.com/mission-apprentissage/flux-retour-cfas/commit/4b1b913d1dc27c89f59e44e932d32c8389cd92a2))
- **ui:** ajout icon mode connecter ([fd9a1c4](https://github.com/mission-apprentissage/flux-retour-cfas/commit/fd9a1c4d0abd649538fe34f27ecef11adbc0db0c))
- **ui:** ajout page politique de confidentialite ([ffa30a5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ffa30a58958b876ae0c9d237596247852b56eb6d))
- **ui:** ajout sommaire ([94809dc](https://github.com/mission-apprentissage/flux-retour-cfas/commit/94809dcd8436dc2682efdfb2dbad3a017a5d7721))
- **ui:** move component + add responsive ([355e948](https://github.com/mission-apprentissage/flux-retour-cfas/commit/355e94817e8df0c1876ddcf056bb0c0f45c9d810))
- **ui:** responsive contact ([06ed069](https://github.com/mission-apprentissage/flux-retour-cfas/commit/06ed069f92579fd47877b9cfd84e3edb0b1ab4dd))
- **ui:** responsive footer ([f7ba24d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f7ba24d7dfbda68d7d20582bb0d4c81175e63758))
- **ui:** responsive tag header ([976d64a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/976d64a8b8bb2c5bb9666580a66087de39f4e740))
- update env mechanism ([b272f9d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b272f9dd32ecfd1e9ac661c70d29ac33baa043c1))

## [2.55.2-beta.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.55.1...v2.55.2-beta.1) (2022-11-17)

### Bug Fixes

- **server:** fix le schema de validation du modele dossiersApprenants et supprime champs inutiles (migration) ([0b64d2c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0b64d2c99da7909dfb0c70bc6ca49e32269ef11e))
- **server:** migate-mongo using dotEnv ([#2247](https://github.com/mission-apprentissage/flux-retour-cfas/issues/2247)) ([177da9b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/177da9bf4afe0f4e0c957f1d8e2baa83c6ef95f1))
- **ui:** corrige lien vers la page question réponses ([#2242](https://github.com/mission-apprentissage/flux-retour-cfas/issues/2242)) ([3f8d30f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3f8d30f834286d56b0b3e39989c4254b3329f545))

## [2.55.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.55.0...v2.55.1) (2022-11-17)

### Bug Fixes

- hotfix retire permission pilot aux utilisateurs erp ([b11b31a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b11b31a7fb26afbda489803736c4064e6e65d385))

## [2.55.1-beta.3](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.55.1-beta.2...v2.55.1-beta.3) (2022-11-16)

### Bug Fixes

- **server:** migate-mongo using dotEnv ([#2247](https://github.com/mission-apprentissage/flux-retour-cfas/issues/2247)) ([177da9b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/177da9bf4afe0f4e0c957f1d8e2baa83c6ef95f1))

## [2.55.1-beta.2](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.55.1-beta.1...v2.55.1-beta.2) (2022-11-15)

### Bug Fixes

- **ui:** corrige lien vers la page question réponses ([#2242](https://github.com/mission-apprentissage/flux-retour-cfas/issues/2242)) ([3f8d30f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3f8d30f834286d56b0b3e39989c4254b3329f545))

## [2.55.1-beta.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.55.0...v2.55.1-beta.1) (2022-11-15)

### Bug Fixes

- **server:** fix le schema de validation du modele dossiersApprenants et supprime champs inutiles (migration) ([0b64d2c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0b64d2c99da7909dfb0c70bc6ca49e32269ef11e))

# [2.55.0](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.54.0...v2.55.0) (2022-11-09)

### Bug Fixes

- la création de formation n'échoue plus quand cfd_start_date ou cfd_end_date ne sont pas présents ([77b7028](https://github.com/mission-apprentissage/flux-retour-cfas/commit/77b702815f9e699b43d9ca80dbe918dce7e3ca88))

### Features

- la création de dossier apprenant ne dépend plus de la création de formation, faite dans un job à part ([bf59ca5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/bf59ca56cc38b7c2f5495d6ccd4cad8667c9a816))

# [2.55.0-beta.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.54.0...v2.55.0-beta.1) (2022-11-08)

### Bug Fixes

- la création de formation n'échoue plus quand cfd_start_date ou cfd_end_date ne sont pas présents ([77b7028](https://github.com/mission-apprentissage/flux-retour-cfas/commit/77b702815f9e699b43d9ca80dbe918dce7e3ca88))

### Features

- la création de dossier apprenant ne dépend plus de la création de formation, faite dans un job à part ([bf59ca5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/bf59ca56cc38b7c2f5495d6ccd4cad8667c9a816))

# [2.54.0](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.53.0...v2.54.0) (2022-10-27)

### Features

- **server:** remove url from cfa route ([#2151](https://github.com/mission-apprentissage/flux-retour-cfas/issues/2151)) ([fc51bb6](https://github.com/mission-apprentissage/flux-retour-cfas/commit/fc51bb61c57f2cc42cdfa1c9e4984c6a9050ca79))

# [2.54.0-beta.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.53.0...v2.54.0-beta.1) (2022-10-27)

### Features

- **server:** remove url from cfa route ([#2151](https://github.com/mission-apprentissage/flux-retour-cfas/issues/2151)) ([fc51bb6](https://github.com/mission-apprentissage/flux-retour-cfas/commit/fc51bb61c57f2cc42cdfa1c9e4984c6a9050ca79))

# [2.53.0](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.52.0...v2.53.0) (2022-10-25)

### Features

- la création de formations et de cfas n'echoue plus lorsque les domaines metiers liés ne sont pas trouvés ou que l'API LBA retourne une erreur ([dae3cec](https://github.com/mission-apprentissage/flux-retour-cfas/commit/dae3cecdd581da29d73efd0aae52826ffe9473ec))

# [2.53.0-beta.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.52.0...v2.53.0-beta.1) (2022-10-24)

### Features

- la création de formations et de cfas n'echoue plus lorsque les domaines metiers liés ne sont pas trouvés ou que l'API LBA retourne une erreur ([dae3cec](https://github.com/mission-apprentissage/flux-retour-cfas/commit/dae3cecdd581da29d73efd0aae52826ffe9473ec))

# [2.52.0](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.51.0...v2.52.0) (2022-10-19)

### Features

- ajoute les reseaux dans la collection referentielSiretUai depuis TDB et fichier Excellence Pro ([7013517](https://github.com/mission-apprentissage/flux-retour-cfas/commit/70135172f72578d24b9242f938ba0fb74aaa1efa))

# [2.52.0-beta.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.51.0...v2.52.0-beta.1) (2022-10-19)

### Features

- ajoute les reseaux dans la collection referentielSiretUai depuis TDB et fichier Excellence Pro ([7013517](https://github.com/mission-apprentissage/flux-retour-cfas/commit/70135172f72578d24b9242f938ba0fb74aaa1efa))

# [2.51.0](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.50.0...v2.51.0) (2022-10-18)

### Features

- create referentiel siret-uai collection ([8663989](https://github.com/mission-apprentissage/flux-retour-cfas/commit/86639896098e18322aca25b1afa6aa017a6dc59f))
- mise à jour de la source d'import du réseau Excellence Pro (CFA EC) ([4091bc5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/4091bc5af95976ee3dab136aac551fabec2d6d59))
- **server:** add draaf organisme type ([#1877](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1877)) ([78a6043](https://github.com/mission-apprentissage/flux-retour-cfas/commit/78a604300ccb24089fa68cfc7689db3445580d08))
- **server:** ajoute une route exposant les organismes du référentiel SIRET/UAI enrichi avec les réseaux du tdb ([cbd561f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/cbd561f16ba8e068aae2fd5ca0c96607f03ccf24))

# [2.51.0-beta.4](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.51.0-beta.3...v2.51.0-beta.4) (2022-10-18)

### Features

- **server:** ajoute une route exposant les organismes du référentiel SIRET/UAI enrichi avec les réseaux du tdb ([cbd561f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/cbd561f16ba8e068aae2fd5ca0c96607f03ccf24))

# [2.51.0-beta.3](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.51.0-beta.2...v2.51.0-beta.3) (2022-10-17)

### Features

- **server:** add draaf organisme type ([#1877](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1877)) ([78a6043](https://github.com/mission-apprentissage/flux-retour-cfas/commit/78a604300ccb24089fa68cfc7689db3445580d08))

# [2.51.0-beta.2](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.51.0-beta.1...v2.51.0-beta.2) (2022-10-17)

### Features

- mise à jour de la source d'import du réseau Excellence Pro (CFA EC) ([4091bc5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/4091bc5af95976ee3dab136aac551fabec2d6d59))

# [2.51.0-beta.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.50.0...v2.51.0-beta.1) (2022-10-17)

### Features

- create referentiel siret-uai collection ([8663989](https://github.com/mission-apprentissage/flux-retour-cfas/commit/86639896098e18322aca25b1afa6aa017a6dc59f))

# [2.50.0](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.49.1...v2.50.0) (2022-10-10)

### Bug Fixes

- clear cfas collection before seed ([#832](https://github.com/mission-apprentissage/flux-retour-cfas/issues/832)) ([ae32525](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ae32525f982e15ef19471699348371daf2a52d70))
- correction des textes de la faq et mention legales ([de8e362](https://github.com/mission-apprentissage/flux-retour-cfas/commit/de8e362179f312b17526dfec80b52edda8305081))
- deleted doublon and change uaiCode Corse ([eb0b7ce](https://github.com/mission-apprentissage/flux-retour-cfas/commit/eb0b7cee3b21a6454b77d4b90adbd4a8ca575762))
- docker compose override add referentiel url ([#945](https://github.com/mission-apprentissage/flux-retour-cfas/issues/945)) ([5400be0](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5400be0f27148900901edc05b39e2609780a9ba8))
- dotEnv path in tests ([#932](https://github.com/mission-apprentissage/flux-retour-cfas/issues/932)) ([a7d6461](https://github.com/mission-apprentissage/flux-retour-cfas/commit/a7d6461feabb5249e7230be46afd42666906069c))
- getOrganismeWithSiret renvoie null plutôt que la NULL value du cache lorsqu'aucun organisme n'est trouvé dans le référentiel ([62e9e1a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/62e9e1a8a2e74c300359b81514b393b49c750b32))
- remove bcn collections useless ([#778](https://github.com/mission-apprentissage/flux-retour-cfas/issues/778)) ([9c8ba89](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9c8ba892d38a1edf230011b26bde81517fb0cfb7))
- remove error file ([9a6ca5a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9a6ca5a3f87ac6cacc1aa038a2ddcb2bce4853c6))
- remove statuts gesti en cours de recrutement ([#777](https://github.com/mission-apprentissage/flux-retour-cfas/issues/777)) ([bbeff7a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/bbeff7a621b7524258e2112e86a349faefdd6db9))
- remove useless files ([#941](https://github.com/mission-apprentissage/flux-retour-cfas/issues/941)) ([729db73](https://github.com/mission-apprentissage/flux-retour-cfas/commit/729db7367ad4c238c134037657070727f23fbf5b))
- removed accent ([cd10af8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/cd10af8d40a878006411d1e06a3986306625048a))
- removed date_entree_formation ([7c7e413](https://github.com/mission-apprentissage/flux-retour-cfas/commit/7c7e4138d949cf2df0f24b19cdfe4dfef9d54e2b))
- **server:** add cfa sat ([5ffc703](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5ffc703d18b293ed20d1279300620cf08c518215))
- **server:** add default sample migration ([#1260](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1260)) ([dc30d6f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/dc30d6f4ab417a6fab9e4a93f4ab653f4a95c053))
- **server:** add job name for retrieve rncp in tco job ([#1705](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1705)) ([3fcf1c8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3fcf1c856154c64fde43267ed807ff5ea448861a))
- **server:** change name ([3f19ccf](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3f19ccf16568bfe2205bf820e9f37bf84ec45ade))
- **server:** created_at to date for JobEventModel ([2a3f57c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/2a3f57c3c21fc9cff2700c7d73705b5097bec3ab))
- **server:** delete default:null ([11eedf3](https://github.com/mission-apprentissage/flux-retour-cfas/commit/11eedf3c754961c8fc7238da542c6185ef20b2dc))
- **server:** delete list-reseau ([d22b9cc](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d22b9cc6794005023b0187e42958c99a332981e5))
- **server:** delete model, jobs listReseaux ([ddf1b03](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ddf1b03367b088304871a39ff8c64c386712d55c))
- **server:** delete nom_tokenized + add !loading ([d26c971](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d26c971bcd4eee82ba271149c26cd0f6c28843ee))
- **server:** delete reseau cfa + error message ([c975a3b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/c975a3b49ad7988fe131eaa6edc49a6d33faa1b0))
- **server:** delete space nom_apprenant & prenom_apprenant ([f69b45f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f69b45f33421878d7a72dab6c032d175f00af4a3))
- **server:** deleted isRequired field ([a4e0d8d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/a4e0d8dc7b8f7d9283efd8e32033306f752bb260))
- **server:** deleted search results limit ([35d901c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/35d901cf8d9f32cae53d4af39143c12c0131db4e))
- **server:** fix seedCfas : remove ovhStorage, fix nom to nom_etablissement & handle empty value ([#981](https://github.com/mission-apprentissage/flux-retour-cfas/issues/981)) ([4e72ecf](https://github.com/mission-apprentissage/flux-retour-cfas/commit/4e72ecf7c32585c0ce86b5b67db519d68f1d956f))
- **server:** handle no cfa found for export-csv-repartition-effectifs-par-organisme ([#1148](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1148)) ([b74db64](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b74db6469d55894c1da7317ab9e5657f58731717))
- **server:** jobEvents unit tests ([9722fb1](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9722fb171319d8d91c519e39f60d1cca09c8964e))
- **server:** removed JobName ([d352b46](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d352b46b520e8b92bd45447f812f2b5d38e9981c))
- **server:** replace outdated function ([9c4a27e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9c4a27e2da9aa29f687aedb160ecdd14ba23fd78))
- **server:** replace replaced by trim & change test name ([27c5a69](https://github.com/mission-apprentissage/flux-retour-cfas/commit/27c5a69ca3fa82f14224698977d67ceb7c40d062))
- **server:** return network list ([993ee20](https://github.com/mission-apprentissage/flux-retour-cfas/commit/993ee2079b4accce18e5be3b28a19d27633fe695))
- **server:** simplification ([8da074d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8da074d4a286bfa6eeb680dff156d68e01bdfc22))
- **server:** test unitaire ([f39c2d8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f39c2d806b6a7d0c732b00f84311c5e872746f73))
- **server:** update ([b6bc8b2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b6bc8b2c0ddbb61b70d5df0bd6c06b17f649cac7))
- **server:** update user not changing permissions ([#1591](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1591)) ([63379f7](https://github.com/mission-apprentissage/flux-retour-cfas/commit/63379f76cdff0d0ee8dec11493f82e00632cfae4))
- **server:** warning forward ([df1bbf4](https://github.com/mission-apprentissage/flux-retour-cfas/commit/df1bbf46d9082ffc584de89bbd8b74416853b104))
- simplification variable ([f95228c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f95228cd9641de031b850d27fd56773897ba92d1))
- siret_valid = true while siret is not valid ([#1234](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1234)) ([1baf8b8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/1baf8b880f8aae186e9dbdaccded6f876b696f68))
- **ui:** add condition ([afb9c51](https://github.com/mission-apprentissage/flux-retour-cfas/commit/afb9c51f78254f7167ec1bd141064d5c532e8402))
- **ui:** add login popin connexion ([#953](https://github.com/mission-apprentissage/flux-retour-cfas/issues/953)) ([028d4d8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/028d4d8edde422f0455c86b84b5db8007cd04c02))
- **ui:** add navigations pages for questionsReponses ([#1729](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1729)) ([b793fa7](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b793fa79d2b56b537e64f3bb96a228a8bf1424f1))
- **ui:** add propsType ([0062338](https://github.com/mission-apprentissage/flux-retour-cfas/commit/00623383a150e5a8e690586eee9e0e06a1999296))
- **ui:** change name ([e6abe64](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e6abe641060c30142198dbdf64a80d9f84f0f2a3))
- **ui:** change name test ([099f8cc](https://github.com/mission-apprentissage/flux-retour-cfas/commit/099f8cc45879de6edbcb5c991827fe5057aed647))
- **ui:** change parameter ([e118b81](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e118b8161905e8a0642a43dcc8e2b71f4e0a97b3))
- **ui:** clean code ([16ef0eb](https://github.com/mission-apprentissage/flux-retour-cfas/commit/16ef0eb236f49d35f7ed792b296a95475db0561e))
- **ui:** delete console log ([2deef3d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/2deef3df0768a3e6a7904a0ec370a2b0958eae38))
- **ui:** delete duplicate folder ([7ccc009](https://github.com/mission-apprentissage/flux-retour-cfas/commit/7ccc009079300153490968ac0b4591afab4adb90))
- **ui:** delete isLogged ([9ef4537](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9ef4537272bacbff6d6802355118ebc4975bc01f))
- **ui:** delete stash ([6e29ae5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/6e29ae5911aa81932b1e7fc707fdc5be96f6561b))
- **ui:** delete SubmitPrivateLinkDemand ([10a86e2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/10a86e28b0f1839b98a1c2b8f32f1f094bbef180))
- **ui:** download CSV for Cfa with named data / anonymized label ([#1594](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1594)) ([f5b6635](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f5b66358030113016a74db3ca8cfc3a22f1d68cc))
- **ui:** envoie une requête pour vérifier l'existence d'un SIRET ou d'un UAI uniquement quand l'utilisateur clique sur vérifier ([eeb8961](https://github.com/mission-apprentissage/flux-retour-cfas/commit/eeb89614978992400fd398273c280415c4b10d3f))
- **ui:** InfosFormationSection & useFetchFormationInfo props ([#1418](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1418)) ([00c6209](https://github.com/mission-apprentissage/flux-retour-cfas/commit/00c6209f0aee5bdd30282729288a37561f2d5f0b))
- **ui:** isLoading useless ([#1566](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1566)) ([8d1bd88](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8d1bd886890761bbb37688d1b2de98e7427129eb))
- **ui:** mentions legales ([#1765](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1765)) ([99a31b9](https://github.com/mission-apprentissage/flux-retour-cfas/commit/99a31b9446195c8328232b653fe7f9e52fbfb9e7))
- **ui:** modification name component ([509777a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/509777a1b19aa884bdcffadd420116f3347e1d31))
- **ui:** orthographe ([9e7bec5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9e7bec5cc5680ebaa83b9245f114f699de75ad6b))
- **ui:** QUERY_KEY to QUERY_KEYS ([59c1880](https://github.com/mission-apprentissage/flux-retour-cfas/commit/59c1880d091bb7c63cf2935678530325944ac7ae))
- **ui:** rectification taille de la box indicateur ([51fb5f2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/51fb5f2b10844694a8858285738d24e445de44ae))
- **ui:** refresh post remove on users & reseauxCfas ([#1568](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1568)) ([c3946f4](https://github.com/mission-apprentissage/flux-retour-cfas/commit/c3946f4a40a7af9dbc4167e5bece311640f9fd4c))
- **ui:** remove hook ([8bd257c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8bd257c1689cc50d489ce5e60a86f14a3c0bba42))
- **ui:** remove useless a in ActionSection ([#1219](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1219)) ([205965c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/205965c60915894379bcd329c72a1eb0498e7fe5))
- **ui:** remove useless prop ([#1216](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1216)) ([3376103](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3376103998f4e8cc6d47e983f742d5903ad6d792))
- **ui:** removed HOC ([da9281b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/da9281b012688c3e9773b7c8beba4c91f2d6f53c))
- **ui:** rename all constant ([1aaccd7](https://github.com/mission-apprentissage/flux-retour-cfas/commit/1aaccd7150f5d851b737a17fb7d6396d5b846a80))
- **ui:** rename code by uaiCode ([b4e1f2b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b4e1f2b6c9e40efa715ba7910126c856de09b87d))
- **ui:** rename file ([ace3163](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ace31630876d32a514376aa5486f2361f3a87f7a))
- **ui:** rename function ([8e4c147](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8e4c1475e1d2b34e0a78a921ff3c0ce9e17cdde7))
- **ui:** rename hook ([0106ac2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0106ac2c90d53f8c896692845029b2b61eefe107))
- **ui:** replace tooltipLabel type to node ([#1206](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1206)) ([34cb4df](https://github.com/mission-apprentissage/flux-retour-cfas/commit/34cb4dfc7802d2cb7a74561a4f862ccbb3732fd4))
- **ui:** siret is not required ([e5fab4a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e5fab4ab9a850d142e4fcae5a13b966d686bbbf8))
- **ui:** update count prop to number type for ApercuDesDonneesSection ([#1218](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1218)) ([96831e2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/96831e277ca4285aa352b865e36c202a4fd4f929))
- **ui:** update tooltips & add bold ([#1104](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1104)) ([609262f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/609262f5e90269b9efb7bfca15cebf40d24544f5))
- **ui:** vérifie que le token d'auth n'est pas expiré pour déterminer si l'utilisateur doit se login ([cdb67fb](https://github.com/mission-apprentissage/flux-retour-cfas/commit/cdb67fb6242267223c42c9656cd52009f08305a3))
- **ui:** vue organisme pour un utilisateur réseau ([8ca3921](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8ca3921d1c2a6c62b0c29c37f4ce98d199874d8b))
- **ui:** warning isUserCfa ([ef000dd](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ef000dd1443014893a21ecb36c534bd8b77aa03a))
- **ui:** warning tooltip ([e1030a7](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e1030a7976b507575aeebcdc0c6c9a82fe0724a2))
- **ui:** wording nature organisme ([#1708](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1708)) ([4635627](https://github.com/mission-apprentissage/flux-retour-cfas/commit/46356271f92b124c80d49484860009fc2cb75f80))
- update ([a874073](https://github.com/mission-apprentissage/flux-retour-cfas/commit/a874073f9eb3e958dc64599b16b46d8256092e3a))

### Features

- add api route for get dossierApprenants + tests ([#924](https://github.com/mission-apprentissage/flux-retour-cfas/issues/924)) ([db64ada](https://github.com/mission-apprentissage/flux-retour-cfas/commit/db64ada8ee54225fea122fc1c9d8c4a3d2279fec))
- add cfd end & beginning date field & update retrieve cfd history job ([#783](https://github.com/mission-apprentissage/flux-retour-cfas/issues/783)) ([3ff1667](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3ff16670bc2d2ffe9816367834e5316f29c2e413))
- add favicon ([18f9a45](https://github.com/mission-apprentissage/flux-retour-cfas/commit/18f9a45baca6324d428677b60d15a0eab6c2c7ce))
- add filter by siret ([afd8d37](https://github.com/mission-apprentissage/flux-retour-cfas/commit/afd8d379878cbba72b690e3e4456cee9250ec65e))
- add migration ([21c44a5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/21c44a5ee00413e3ea9904b6d55ff3e6374a06b1))
- add migration ([e829922](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e829922d9ee92977a790f71ff1b3f80530ba26e6))
- add user organisme & region ([#1565](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1565)) ([bf6d68d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/bf6d68d1222e17a918b9cfdaadfcd03f52d5b8f4))
- ajout d'un process de release en mode sem-ver + codeql, conventional commit et Makefile à la racine ([#1869](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1869)) ([704abab](https://github.com/mission-apprentissage/flux-retour-cfas/commit/704ababec733d51154e48e86e32c9fa751ec9ea8))
- allow export xlsx on private views for cfa role ([#980](https://github.com/mission-apprentissage/flux-retour-cfas/issues/980)) ([fad3c40](https://github.com/mission-apprentissage/flux-retour-cfas/commit/fad3c405de33c6c48db740bf0dc7a57c4ce4ef49))
- creation constante dashlord ([9aabad0](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9aabad03c081dc41f8ac28063eb027bb2b6927d6))
- export xlsx effectifs for indicateurs ([#772](https://github.com/mission-apprentissage/flux-retour-cfas/issues/772)) ([0594aab](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0594aab387954697a7f604c232a9bd498921eea2))
- filter users in admin view for username / email & organisme ([#1567](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1567)) ([32401f1](https://github.com/mission-apprentissage/flux-retour-cfas/commit/32401f11fdfc8e2bf94756349426e4a4d8eb3378))
- refacto rco api route to effectifsApprenants route ([#922](https://github.com/mission-apprentissage/flux-retour-cfas/issues/922)) ([bc51acf](https://github.com/mission-apprentissage/flux-retour-cfas/commit/bc51acfc3896707b0e6ec303477cb829056a7278))
- refonte pages publiques ([#947](https://github.com/mission-apprentissage/flux-retour-cfas/issues/947)) ([969d935](https://github.com/mission-apprentissage/flux-retour-cfas/commit/969d9356cb676db6a1ae3bc4f511bffb48703636)), closes [#891](https://github.com/mission-apprentissage/flux-retour-cfas/issues/891) [#902](https://github.com/mission-apprentissage/flux-retour-cfas/issues/902) [#915](https://github.com/mission-apprentissage/flux-retour-cfas/issues/915) [#916](https://github.com/mission-apprentissage/flux-retour-cfas/issues/916) [#907](https://github.com/mission-apprentissage/flux-retour-cfas/issues/907) [#875](https://github.com/mission-apprentissage/flux-retour-cfas/issues/875) [#925](https://github.com/mission-apprentissage/flux-retour-cfas/issues/925) [#933](https://github.com/mission-apprentissage/flux-retour-cfas/issues/933) [#934](https://github.com/mission-apprentissage/flux-retour-cfas/issues/934) [#935](https://github.com/mission-apprentissage/flux-retour-cfas/issues/935) [#937](https://github.com/mission-apprentissage/flux-retour-cfas/issues/937) [#940](https://github.com/mission-apprentissage/flux-retour-cfas/issues/940) [#942](https://github.com/mission-apprentissage/flux-retour-cfas/issues/942)
- remove user ([#1563](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1563)) ([885545a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/885545a3a572abaf3a2bc3aa05af74ef789e1f2b))
- repartion multi siret cfa view ([#917](https://github.com/mission-apprentissage/flux-retour-cfas/issues/917)) ([13eeec2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/13eeec2dc1169bf11ad7810b77cd9f63c2a9a169))
- rework cfa filter ([#965](https://github.com/mission-apprentissage/flux-retour-cfas/issues/965)) ([e48118b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e48118bb79ecd5b4001d96911444f161ebddf86b))
- rework formations filter ([#973](https://github.com/mission-apprentissage/flux-retour-cfas/issues/973)) ([5f95bec](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5f95bec64e4e4890030d80338b66dbd966cea7ca))
- **server:** add code region corse ([cfcf7cd](https://github.com/mission-apprentissage/flux-retour-cfas/commit/cfcf7cd5bdecf8bf5057d0f380c22ee5efd94ebe))
- **server:** add created_at effectif ([95805f8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/95805f8973b4132593ac0b7d79268b333e68cac7))
- **server:** add created_at jobEvent + test ([6637a21](https://github.com/mission-apprentissage/flux-retour-cfas/commit/6637a211ca832fc09f5c20fd68129731a17aca62))
- **server:** add created_at remove ([1e878ff](https://github.com/mission-apprentissage/flux-retour-cfas/commit/1e878ffa5f5ba77c9c3e214cde1924d823d5024c))
- **server:** add date_de_naissance_apprenant to unicity & set it mandatory ([#845](https://github.com/mission-apprentissage/flux-retour-cfas/issues/845)) ([317e654](https://github.com/mission-apprentissage/flux-retour-cfas/commit/317e6541d1c9eb866b9e9736ee2339a1e436d941))
- **server:** add default unknow value for user fields in userEvents ([#1633](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1633)) ([d631715](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d6317157a10b0bb5b4421113ad403d42496338fe))
- **server:** add effectifs-national route cache ([77af013](https://github.com/mission-apprentissage/flux-retour-cfas/commit/77af013eab6c6c4c3908711d7f66cc9d001484d9))
- **server:** add fields to userEvent & update create method ([#1588](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1588)) ([ada5d0d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ada5d0dd3c09dcaad59165af9bec7b97f543f87d))
- **server:** add findOne ([0fb3d1a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0fb3d1ac11731d786c1f65502c7f51c56efbf6ea))
- **server:** add job find cfa contacts in referentiel api ([#939](https://github.com/mission-apprentissage/flux-retour-cfas/issues/939)) ([ec694e3](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ec694e3eadcb8c9bbb58dbdd416903e942efc9a0))
- **server:** add missing api unit test ([#848](https://github.com/mission-apprentissage/flux-retour-cfas/issues/848)) ([b86fdc0](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b86fdc05365abfd1ec4be77540fb614a0fd0ff67))
- **server:** add regex control for siret in api input ([#1235](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1235)) ([e222fc8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e222fc8b6ca7b81893568711dd8a2d0a5bba4b45))
- **server:** add retrieve uai/siret gestionnaires & formateurs job from catalog ([#1222](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1222)) ([25eb142](https://github.com/mission-apprentissage/flux-retour-cfas/commit/25eb142b57e54def0f6c4b895ad471ea8503328b))
- **server:** add searchTerm sirets ([4d51fd6](https://github.com/mission-apprentissage/flux-retour-cfas/commit/4d51fd612456c9e3405a06f3b0aa36d489ae5a50))
- **server:** add test ([d38aca6](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d38aca63ddea9b0b9e8582c7aba4c859da2bb50f))
- **server:** check collection exists before indexes creation / deletion ([#1571](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1571)) ([e2e01aa](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e2e01aa527b745b8cedc75c139ae5760fa5fd658))
- **server:** create effectifs public route + test uni ([6d44e9e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/6d44e9e59b901fa6dd0ef852c96c51c4e528dc32))
- **server:** create reseauxCfas collection & refactor seedCfas using it ([#929](https://github.com/mission-apprentissage/flux-retour-cfas/issues/929)) ([1c5770e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/1c5770e5a42c0891d903e66de330c83b5205cfa7))
- **server:** create test ([6295dd0](https://github.com/mission-apprentissage/flux-retour-cfas/commit/6295dd020f6bd7f95617af26558ab910110f3375))
- **server:** create test ([ab245bd](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ab245bde197dece40b5e5b9fded258688f25477e))
- **server:** created factory test ([5009cad](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5009cad6d27d5879203c8d46af08cd2a2b6f2cff))
- **server:** Creation date parameter ([d28b129](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d28b129e42cb0ab7466e3e770dfae0701b1e8655))
- **server:** export anonymized function & route & unit tests ([53cdd68](https://github.com/mission-apprentissage/flux-retour-cfas/commit/53cdd68db19fe4d4b8dc9be93cce8bd77deca089))
- **server:** fix duplicates dossiersApprenants with leading / ending spaces on nom_apprenant / prenom_apprenant ([49dff42](https://github.com/mission-apprentissage/flux-retour-cfas/commit/49dff426dd096b72714ff1701ab1f17df194dd53))
- **server:** indexes siret ([a449e78](https://github.com/mission-apprentissage/flux-retour-cfas/commit/a449e7838d67b41f86e599f438a1299607188991))
- **server:** refacto factory & base class & update tests ([#1220](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1220)) ([7c4e99e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/7c4e99e71fe1974f4e72602d0ff4d049a9c34734))
- **server:** refacto remove script dossiersApprenants nonRecus depuis ([#1342](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1342)) ([dcccd38](https://github.com/mission-apprentissage/flux-retour-cfas/commit/dcccd38b415727f32ede2497559451c016b788e3))
- **server:** refacto tracking & add unit tests ([207f065](https://github.com/mission-apprentissage/flux-retour-cfas/commit/207f065b4f39bbdddbc9f24388be02690008da05))
- **server:** remove useless export csv repartitons ([f0f040f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f0f040ff1015e7783fba95917c4e4acb163ecefe))
- **server:** reseau cfa + testUni ([d5cad7f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d5cad7f026e3084c0adf230159af9aca1f8f2360))
- **server:** test unitaire ([c0adefb](https://github.com/mission-apprentissage/flux-retour-cfas/commit/c0adefbd5bbd9ec5fdd9c0948091a78af40924e4))
- **server:** update anonymized csv columns ([#1528](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1528)) ([900395b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/900395bd7697576d462fc87a38624acb1692bc7e))
- **server:** update users search case insensitive + region ([#1570](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1570)) ([a54c733](https://github.com/mission-apprentissage/flux-retour-cfas/commit/a54c733365d115a22bbfd6c34920ee3fbedcaa0a))
- track csv export & refacto tracking ([#1592](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1592)) ([fbaad4b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/fbaad4bac5f44a944e8e9f729c1459169de1b346))
- **ui:** add .env.example file ([#926](https://github.com/mission-apprentissage/flux-retour-cfas/issues/926)) ([8029e21](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8029e216355acf1cf821a5124ee47a104d128561))
- **ui:** add auto complete ([84736f7](https://github.com/mission-apprentissage/flux-retour-cfas/commit/84736f7ff8ca9d741c2c260c135f4a73c48681e8))
- **ui:** add banner network on header & disable network selected state for network user ([#959](https://github.com/mission-apprentissage/flux-retour-cfas/issues/959)) ([47ba039](https://github.com/mission-apprentissage/flux-retour-cfas/commit/47ba0393d5db797cd2ba0ea2f751aee8875abeee))
- **ui:** add download block for multiSiret cfa view ([#1520](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1520)) ([72ad785](https://github.com/mission-apprentissage/flux-retour-cfas/commit/72ad785dde0c31ab30e47531e8547188bc13a6ba))
- **ui:** add fetchEffectifsAnonymizedDataListCsvExport ([9f740af](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9f740af695179ec45ae11a2ab0f72778e196a2a0))
- **ui:** add filter ([6a99eb0](https://github.com/mission-apprentissage/flux-retour-cfas/commit/6a99eb0f622914b01298231d050f31f6c7b4d482))
- **ui:** add loader on downloadBlock ([ef32b57](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ef32b57a434ed3e66dd4327c97a616b813da433a))
- **ui:** add mailTo button to help page ([#993](https://github.com/mission-apprentissage/flux-retour-cfas/issues/993)) ([bdefbf0](https://github.com/mission-apprentissage/flux-retour-cfas/commit/bdefbf0394382aacf30f03427c08325c65cd6259))
- **ui:** add new picto & new colors to effectifCards ([#961](https://github.com/mission-apprentissage/flux-retour-cfas/issues/961)) ([a6c8b82](https://github.com/mission-apprentissage/flux-retour-cfas/commit/a6c8b822b290491333cce839c28edcc3252a5d4d))
- **ui:** add overflow auto on overlay ([#1203](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1203)) ([8b8a69a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8b8a69a920d5f350dc7862711685717487b68734))
- **ui:** add pagination & create component loading / NoResults ([5bdb2b2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5bdb2b2c7f4ebd52029d2c6c20ca49b95948d088))
- **ui:** add pagination to usersTable ([#1561](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1561)) ([91d3a6f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/91d3a6ff162ff9302d56c016fb08301ba3b02e16))
- **ui:** add reseau ([0fbdd54](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0fbdd54323529b0ae606b34c4828e2a2fe26fd01))
- **ui:** add text ([9ca1a88](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9ca1a8806f94cded606784d6af7a95a253d60a86))
- **ui:** ajout du lien Accessibilité : Non conforme vers dashlord ([3e5b021](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3e5b021f6d451765635286c1afa5e18f31fc6ce6))
- **ui:** ajout du svg notfound ([5635d8e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5635d8e88f18832fd709a58dd3f3166fb3a95d3b))
- **ui:** change tabs position & copyPrivateUrlLink position ([#1519](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1519)) ([695dc4a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/695dc4a6506fa89b22a38ac7bafd1e816c1f3b18))
- **ui:** Connexion button with arrow in hover ([#1165](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1165)) ([bfa5a59](https://github.com/mission-apprentissage/flux-retour-cfas/commit/bfa5a59adb0fc12cda33bcd66a98d3e732b4a78b))
- **ui:** create admin folder ([dd3d096](https://github.com/mission-apprentissage/flux-retour-cfas/commit/dd3d0969e1d12060203ea4a1303d947c3e1e26f1))
- **ui:** create constant QUERY_KEY ([04f8bce](https://github.com/mission-apprentissage/flux-retour-cfas/commit/04f8bce9fadc1679ab8ce1a020283262e10e67db))
- **ui:** create formatDate function ([cd768b8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/cd768b8ea80808e7c3d893666b8fe06a511d26cf))
- **ui:** create hook and delete indicateurNational ([13bea89](https://github.com/mission-apprentissage/flux-retour-cfas/commit/13bea890c10f03e0e3d634f72d2fcdcf972c669e))
- **ui:** create mentions legales page ([5c91507](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5c9150764d50ad2067c1366d2fdf598b0edafd78))
- **ui:** create route navbar administrator ([349446c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/349446ce0cc0d71304432e04036ef1b605566eff))
- **ui:** create variant ([ce294c3](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ce294c320f0a0e5c96b8a2ac24dcf9b7d08eb911))
- **ui:** created hook ([dddb17c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/dddb17c033c95b368c6c6dc06b83b8487f3988ef))
- **ui:** creation d'un composant link ([ce25968](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ce25968615ace652390b6415ab94a1f527cf1378))
- **ui:** creation du composant baseAccordion et tout deplier/replier ([5e59a7f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5e59a7fe2967aa85440ed71b255a8865b62fbc9c))
- **ui:** delete comment and add toaster ([1481084](https://github.com/mission-apprentissage/flux-retour-cfas/commit/14810845bf07f735599a49d0a6deda6f239709fb))
- **ui:** export csv for cfa & private cfa view ([43a53d1](https://github.com/mission-apprentissage/flux-retour-cfas/commit/43a53d14c134fc01bdbc782cda4660700fe3eed8))
- **ui:** export csv for formation ([354298e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/354298eaa3a3a49bec75d44ff4dd97c951dd5b27))
- **ui:** export csv for réseau ([798f910](https://github.com/mission-apprentissage/flux-retour-cfas/commit/798f910e62a3181d231366b9e4e3d07be4ca9690))
- **ui:** export csv for territoire départemental ([45af107](https://github.com/mission-apprentissage/flux-retour-cfas/commit/45af1072fe687cd0c5df745311b60c6185de92d1))
- **ui:** export csv for territoire national ([e74f3e4](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e74f3e4e4411b5f69e5a7a80aa0c8fa0685afe89))
- **ui:** export csv for territoire régional ([889ce02](https://github.com/mission-apprentissage/flux-retour-cfas/commit/889ce0240f08ea42d51420faf5e5b17cb4069af8))
- **ui:** fix docker-compose & add alert component for env dev or recette ([#1654](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1654)) ([df2a25f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/df2a25f55204f0eb9bdddbc68d272906b82710cb))
- **ui:** handle no organismes & count = 0 ([#1795](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1795)) ([3585938](https://github.com/mission-apprentissage/flux-retour-cfas/commit/35859380f62aa7d3b51188aff426232b48542069))
- **ui:** hook ([8db0376](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8db037699e90df75327f617459408f8108ff9385))
- **ui:** Multi siret detail view ([#1252](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1252)) ([6c92e35](https://github.com/mission-apprentissage/flux-retour-cfas/commit/6c92e3574c1e8fb42cea885226e678799728ba43))
- **ui:** new design ([e9add38](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e9add3816767f5d39b11c6271a4b54cdaa7d9257))
- **ui:** new DownloadBlock component ([#1430](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1430)) ([546b5e9](https://github.com/mission-apprentissage/flux-retour-cfas/commit/546b5e9e7cdb07abc6940ae52852429214aa2b29))
- **ui:** page 404 ([#1788](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1788)) ([2bd08ef](https://github.com/mission-apprentissage/flux-retour-cfas/commit/2bd08efc8874ec61e3671a78bb463db6cc30560f))
- **ui:** redesign des InfosSections ([#838](https://github.com/mission-apprentissage/flux-retour-cfas/issues/838)) ([9ed3fb6](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9ed3fb679785bb190cf7ae95eb8476e5a700736b))
- **ui:** remove file extension from DownloadBlock ([#1523](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1523)) ([e32c759](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e32c7590978127b1be9ef5a48e7294c8ed83e1a8))
- **ui:** resize OverlayMenu for changeView ([#1569](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1569)) ([88880eb](https://github.com/mission-apprentissage/flux-retour-cfas/commit/88880eb40f47a0182565cc98abfb331e97f321e2))
- **ui:** update ([8087d10](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8087d10b8371323c8cc5968143d008337925bac5))
- **ui:** update cfa filter placeholder for siret ([#1207](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1207)) ([0290df3](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0290df3b14a78f1fd71577c0ae222fd31a5fcff5))
- **ui:** update chiffres national ([#1315](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1315)) ([c0694de](https://github.com/mission-apprentissage/flux-retour-cfas/commit/c0694de5b12c7f73717a12916c98e2a29ee90826))
- **ui:** update effectifs & changelog ([#1545](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1545)) ([f87d10b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f87d10b91d40cd1adf2674864c4cb8182bd9447e))
- **ui:** update effectifs national ([#1636](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1636)) ([4cb1e35](https://github.com/mission-apprentissage/flux-retour-cfas/commit/4cb1e356aca8eff88527d45dc17bc5f093d11471))
- **ui:** update ERPs ready & tuto pdf link ([#1468](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1468)) ([67c574e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/67c574e3633779cb7db43788f0e5b5ea686af5a0))
- **ui:** Update the evolution log ([7e8416c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/7e8416c75683c96d0de6f18f95c6facc05ef24de))
- **ui:** url private link ([5c9d6f5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5c9d6f57025778268e92c1d3827af2fb533b1213))
- update ([9364537](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9364537038e61ad7d0c6ac5ce33f6ab4082f59f9))
- update rncp field to rncps list field for formations ([#1395](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1395)) ([2fad9ae](https://github.com/mission-apprentissage/flux-retour-cfas/commit/2fad9ae3eae4c68deb20a68169cc81035d0118e1))
- update total-organisme route adding anneeScolaire filter ([#1650](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1650)) ([b105b77](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b105b7762c73ab2e259575a1e85f5d4640e6d1f1))
- update user ([#1581](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1581)) ([36fb810](https://github.com/mission-apprentissage/flux-retour-cfas/commit/36fb8104bb2c5d51becb7cd5a943564371b31c40))

### Reverts

- revert : new indicateur (#946) ([95481c8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/95481c8d239bdb46ff39c8ef9f5332c8ef5123dc)), closes [#946](https://github.com/mission-apprentissage/flux-retour-cfas/issues/946) [#921](https://github.com/mission-apprentissage/flux-retour-cfas/issues/921)
- Revert "Add network ExcellencePro (#857)" (#863) ([8751fa6](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8751fa6294623b336e15e076830b44f835cfe783)), closes [#857](https://github.com/mission-apprentissage/flux-retour-cfas/issues/857) [#863](https://github.com/mission-apprentissage/flux-retour-cfas/issues/863)

# [2.50.0-beta.5](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.50.0-beta.4...v2.50.0-beta.5) (2022-10-10)

### Bug Fixes

- getOrganismeWithSiret renvoie null plutôt que la NULL value du cache lorsqu'aucun organisme n'est trouvé dans le référentiel ([62e9e1a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/62e9e1a8a2e74c300359b81514b393b49c750b32))

# [2.50.0-beta.4](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.50.0-beta.3...v2.50.0-beta.4) (2022-10-10)

### Bug Fixes

- **ui:** vérifie que le token d'auth n'est pas expiré pour déterminer si l'utilisateur doit se login ([cdb67fb](https://github.com/mission-apprentissage/flux-retour-cfas/commit/cdb67fb6242267223c42c9656cd52009f08305a3))

# [2.50.0-beta.3](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.50.0-beta.2...v2.50.0-beta.3) (2022-10-10)

### Bug Fixes

- **ui:** envoie une requête pour vérifier l'existence d'un SIRET ou d'un UAI uniquement quand l'utilisateur clique sur vérifier ([eeb8961](https://github.com/mission-apprentissage/flux-retour-cfas/commit/eeb89614978992400fd398273c280415c4b10d3f))

# [2.50.0-beta.2](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.50.0-beta.1...v2.50.0-beta.2) (2022-10-10)

### Bug Fixes

- **ui:** vue organisme pour un utilisateur réseau ([8ca3921](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8ca3921d1c2a6c62b0c29c37f4ce98d199874d8b))

# [2.50.0-beta.1](https://github.com/mission-apprentissage/flux-retour-cfas/compare/v2.49.1...v2.50.0-beta.1) (2022-10-06)

### Bug Fixes

- clear cfas collection before seed ([#832](https://github.com/mission-apprentissage/flux-retour-cfas/issues/832)) ([ae32525](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ae32525f982e15ef19471699348371daf2a52d70))
- correction des textes de la faq et mention legales ([de8e362](https://github.com/mission-apprentissage/flux-retour-cfas/commit/de8e362179f312b17526dfec80b52edda8305081))
- deleted doublon and change uaiCode Corse ([eb0b7ce](https://github.com/mission-apprentissage/flux-retour-cfas/commit/eb0b7cee3b21a6454b77d4b90adbd4a8ca575762))
- docker compose override add referentiel url ([#945](https://github.com/mission-apprentissage/flux-retour-cfas/issues/945)) ([5400be0](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5400be0f27148900901edc05b39e2609780a9ba8))
- dotEnv path in tests ([#932](https://github.com/mission-apprentissage/flux-retour-cfas/issues/932)) ([a7d6461](https://github.com/mission-apprentissage/flux-retour-cfas/commit/a7d6461feabb5249e7230be46afd42666906069c))
- remove bcn collections useless ([#778](https://github.com/mission-apprentissage/flux-retour-cfas/issues/778)) ([9c8ba89](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9c8ba892d38a1edf230011b26bde81517fb0cfb7))
- remove error file ([9a6ca5a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9a6ca5a3f87ac6cacc1aa038a2ddcb2bce4853c6))
- remove statuts gesti en cours de recrutement ([#777](https://github.com/mission-apprentissage/flux-retour-cfas/issues/777)) ([bbeff7a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/bbeff7a621b7524258e2112e86a349faefdd6db9))
- remove useless files ([#941](https://github.com/mission-apprentissage/flux-retour-cfas/issues/941)) ([729db73](https://github.com/mission-apprentissage/flux-retour-cfas/commit/729db7367ad4c238c134037657070727f23fbf5b))
- removed accent ([cd10af8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/cd10af8d40a878006411d1e06a3986306625048a))
- removed date_entree_formation ([7c7e413](https://github.com/mission-apprentissage/flux-retour-cfas/commit/7c7e4138d949cf2df0f24b19cdfe4dfef9d54e2b))
- **server:** add cfa sat ([5ffc703](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5ffc703d18b293ed20d1279300620cf08c518215))
- **server:** add default sample migration ([#1260](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1260)) ([dc30d6f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/dc30d6f4ab417a6fab9e4a93f4ab653f4a95c053))
- **server:** add job name for retrieve rncp in tco job ([#1705](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1705)) ([3fcf1c8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3fcf1c856154c64fde43267ed807ff5ea448861a))
- **server:** change name ([3f19ccf](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3f19ccf16568bfe2205bf820e9f37bf84ec45ade))
- **server:** created_at to date for JobEventModel ([2a3f57c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/2a3f57c3c21fc9cff2700c7d73705b5097bec3ab))
- **server:** delete default:null ([11eedf3](https://github.com/mission-apprentissage/flux-retour-cfas/commit/11eedf3c754961c8fc7238da542c6185ef20b2dc))
- **server:** delete list-reseau ([d22b9cc](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d22b9cc6794005023b0187e42958c99a332981e5))
- **server:** delete model, jobs listReseaux ([ddf1b03](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ddf1b03367b088304871a39ff8c64c386712d55c))
- **server:** delete nom_tokenized + add !loading ([d26c971](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d26c971bcd4eee82ba271149c26cd0f6c28843ee))
- **server:** delete reseau cfa + error message ([c975a3b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/c975a3b49ad7988fe131eaa6edc49a6d33faa1b0))
- **server:** delete space nom_apprenant & prenom_apprenant ([f69b45f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f69b45f33421878d7a72dab6c032d175f00af4a3))
- **server:** deleted isRequired field ([a4e0d8d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/a4e0d8dc7b8f7d9283efd8e32033306f752bb260))
- **server:** deleted search results limit ([35d901c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/35d901cf8d9f32cae53d4af39143c12c0131db4e))
- **server:** fix seedCfas : remove ovhStorage, fix nom to nom_etablissement & handle empty value ([#981](https://github.com/mission-apprentissage/flux-retour-cfas/issues/981)) ([4e72ecf](https://github.com/mission-apprentissage/flux-retour-cfas/commit/4e72ecf7c32585c0ce86b5b67db519d68f1d956f))
- **server:** handle no cfa found for export-csv-repartition-effectifs-par-organisme ([#1148](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1148)) ([b74db64](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b74db6469d55894c1da7317ab9e5657f58731717))
- **server:** jobEvents unit tests ([9722fb1](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9722fb171319d8d91c519e39f60d1cca09c8964e))
- **server:** removed JobName ([d352b46](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d352b46b520e8b92bd45447f812f2b5d38e9981c))
- **server:** replace outdated function ([9c4a27e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9c4a27e2da9aa29f687aedb160ecdd14ba23fd78))
- **server:** replace replaced by trim & change test name ([27c5a69](https://github.com/mission-apprentissage/flux-retour-cfas/commit/27c5a69ca3fa82f14224698977d67ceb7c40d062))
- **server:** return network list ([993ee20](https://github.com/mission-apprentissage/flux-retour-cfas/commit/993ee2079b4accce18e5be3b28a19d27633fe695))
- **server:** simplification ([8da074d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8da074d4a286bfa6eeb680dff156d68e01bdfc22))
- **server:** test unitaire ([f39c2d8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f39c2d806b6a7d0c732b00f84311c5e872746f73))
- **server:** update ([b6bc8b2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b6bc8b2c0ddbb61b70d5df0bd6c06b17f649cac7))
- **server:** update user not changing permissions ([#1591](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1591)) ([63379f7](https://github.com/mission-apprentissage/flux-retour-cfas/commit/63379f76cdff0d0ee8dec11493f82e00632cfae4))
- **server:** warning forward ([df1bbf4](https://github.com/mission-apprentissage/flux-retour-cfas/commit/df1bbf46d9082ffc584de89bbd8b74416853b104))
- simplification variable ([f95228c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f95228cd9641de031b850d27fd56773897ba92d1))
- siret_valid = true while siret is not valid ([#1234](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1234)) ([1baf8b8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/1baf8b880f8aae186e9dbdaccded6f876b696f68))
- **ui:** add condition ([afb9c51](https://github.com/mission-apprentissage/flux-retour-cfas/commit/afb9c51f78254f7167ec1bd141064d5c532e8402))
- **ui:** add login popin connexion ([#953](https://github.com/mission-apprentissage/flux-retour-cfas/issues/953)) ([028d4d8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/028d4d8edde422f0455c86b84b5db8007cd04c02))
- **ui:** add navigations pages for questionsReponses ([#1729](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1729)) ([b793fa7](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b793fa79d2b56b537e64f3bb96a228a8bf1424f1))
- **ui:** add propsType ([0062338](https://github.com/mission-apprentissage/flux-retour-cfas/commit/00623383a150e5a8e690586eee9e0e06a1999296))
- **ui:** change name ([e6abe64](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e6abe641060c30142198dbdf64a80d9f84f0f2a3))
- **ui:** change name test ([099f8cc](https://github.com/mission-apprentissage/flux-retour-cfas/commit/099f8cc45879de6edbcb5c991827fe5057aed647))
- **ui:** change parameter ([e118b81](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e118b8161905e8a0642a43dcc8e2b71f4e0a97b3))
- **ui:** clean code ([16ef0eb](https://github.com/mission-apprentissage/flux-retour-cfas/commit/16ef0eb236f49d35f7ed792b296a95475db0561e))
- **ui:** delete console log ([2deef3d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/2deef3df0768a3e6a7904a0ec370a2b0958eae38))
- **ui:** delete duplicate folder ([7ccc009](https://github.com/mission-apprentissage/flux-retour-cfas/commit/7ccc009079300153490968ac0b4591afab4adb90))
- **ui:** delete isLogged ([9ef4537](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9ef4537272bacbff6d6802355118ebc4975bc01f))
- **ui:** delete stash ([6e29ae5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/6e29ae5911aa81932b1e7fc707fdc5be96f6561b))
- **ui:** delete SubmitPrivateLinkDemand ([10a86e2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/10a86e28b0f1839b98a1c2b8f32f1f094bbef180))
- **ui:** download CSV for Cfa with named data / anonymized label ([#1594](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1594)) ([f5b6635](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f5b66358030113016a74db3ca8cfc3a22f1d68cc))
- **ui:** InfosFormationSection & useFetchFormationInfo props ([#1418](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1418)) ([00c6209](https://github.com/mission-apprentissage/flux-retour-cfas/commit/00c6209f0aee5bdd30282729288a37561f2d5f0b))
- **ui:** isLoading useless ([#1566](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1566)) ([8d1bd88](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8d1bd886890761bbb37688d1b2de98e7427129eb))
- **ui:** mentions legales ([#1765](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1765)) ([99a31b9](https://github.com/mission-apprentissage/flux-retour-cfas/commit/99a31b9446195c8328232b653fe7f9e52fbfb9e7))
- **ui:** modification name component ([509777a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/509777a1b19aa884bdcffadd420116f3347e1d31))
- **ui:** orthographe ([9e7bec5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9e7bec5cc5680ebaa83b9245f114f699de75ad6b))
- **ui:** QUERY_KEY to QUERY_KEYS ([59c1880](https://github.com/mission-apprentissage/flux-retour-cfas/commit/59c1880d091bb7c63cf2935678530325944ac7ae))
- **ui:** rectification taille de la box indicateur ([51fb5f2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/51fb5f2b10844694a8858285738d24e445de44ae))
- **ui:** refresh post remove on users & reseauxCfas ([#1568](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1568)) ([c3946f4](https://github.com/mission-apprentissage/flux-retour-cfas/commit/c3946f4a40a7af9dbc4167e5bece311640f9fd4c))
- **ui:** remove hook ([8bd257c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8bd257c1689cc50d489ce5e60a86f14a3c0bba42))
- **ui:** remove useless a in ActionSection ([#1219](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1219)) ([205965c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/205965c60915894379bcd329c72a1eb0498e7fe5))
- **ui:** remove useless prop ([#1216](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1216)) ([3376103](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3376103998f4e8cc6d47e983f742d5903ad6d792))
- **ui:** removed HOC ([da9281b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/da9281b012688c3e9773b7c8beba4c91f2d6f53c))
- **ui:** rename all constant ([1aaccd7](https://github.com/mission-apprentissage/flux-retour-cfas/commit/1aaccd7150f5d851b737a17fb7d6396d5b846a80))
- **ui:** rename code by uaiCode ([b4e1f2b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b4e1f2b6c9e40efa715ba7910126c856de09b87d))
- **ui:** rename file ([ace3163](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ace31630876d32a514376aa5486f2361f3a87f7a))
- **ui:** rename function ([8e4c147](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8e4c1475e1d2b34e0a78a921ff3c0ce9e17cdde7))
- **ui:** rename hook ([0106ac2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0106ac2c90d53f8c896692845029b2b61eefe107))
- **ui:** replace tooltipLabel type to node ([#1206](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1206)) ([34cb4df](https://github.com/mission-apprentissage/flux-retour-cfas/commit/34cb4dfc7802d2cb7a74561a4f862ccbb3732fd4))
- **ui:** siret is not required ([e5fab4a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e5fab4ab9a850d142e4fcae5a13b966d686bbbf8))
- **ui:** update count prop to number type for ApercuDesDonneesSection ([#1218](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1218)) ([96831e2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/96831e277ca4285aa352b865e36c202a4fd4f929))
- **ui:** update tooltips & add bold ([#1104](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1104)) ([609262f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/609262f5e90269b9efb7bfca15cebf40d24544f5))
- **ui:** warning isUserCfa ([ef000dd](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ef000dd1443014893a21ecb36c534bd8b77aa03a))
- **ui:** warning tooltip ([e1030a7](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e1030a7976b507575aeebcdc0c6c9a82fe0724a2))
- **ui:** wording nature organisme ([#1708](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1708)) ([4635627](https://github.com/mission-apprentissage/flux-retour-cfas/commit/46356271f92b124c80d49484860009fc2cb75f80))
- update ([a874073](https://github.com/mission-apprentissage/flux-retour-cfas/commit/a874073f9eb3e958dc64599b16b46d8256092e3a))

### Features

- add api route for get dossierApprenants + tests ([#924](https://github.com/mission-apprentissage/flux-retour-cfas/issues/924)) ([db64ada](https://github.com/mission-apprentissage/flux-retour-cfas/commit/db64ada8ee54225fea122fc1c9d8c4a3d2279fec))
- add cfd end & beginning date field & update retrieve cfd history job ([#783](https://github.com/mission-apprentissage/flux-retour-cfas/issues/783)) ([3ff1667](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3ff16670bc2d2ffe9816367834e5316f29c2e413))
- add favicon ([18f9a45](https://github.com/mission-apprentissage/flux-retour-cfas/commit/18f9a45baca6324d428677b60d15a0eab6c2c7ce))
- add filter by siret ([afd8d37](https://github.com/mission-apprentissage/flux-retour-cfas/commit/afd8d379878cbba72b690e3e4456cee9250ec65e))
- add migration ([21c44a5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/21c44a5ee00413e3ea9904b6d55ff3e6374a06b1))
- add migration ([e829922](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e829922d9ee92977a790f71ff1b3f80530ba26e6))
- add user organisme & region ([#1565](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1565)) ([bf6d68d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/bf6d68d1222e17a918b9cfdaadfcd03f52d5b8f4))
- ajout d'un process de release en mode sem-ver + codeql, conventional commit et Makefile à la racine ([#1869](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1869)) ([704abab](https://github.com/mission-apprentissage/flux-retour-cfas/commit/704ababec733d51154e48e86e32c9fa751ec9ea8))
- allow export xlsx on private views for cfa role ([#980](https://github.com/mission-apprentissage/flux-retour-cfas/issues/980)) ([fad3c40](https://github.com/mission-apprentissage/flux-retour-cfas/commit/fad3c405de33c6c48db740bf0dc7a57c4ce4ef49))
- creation constante dashlord ([9aabad0](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9aabad03c081dc41f8ac28063eb027bb2b6927d6))
- export xlsx effectifs for indicateurs ([#772](https://github.com/mission-apprentissage/flux-retour-cfas/issues/772)) ([0594aab](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0594aab387954697a7f604c232a9bd498921eea2))
- filter users in admin view for username / email & organisme ([#1567](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1567)) ([32401f1](https://github.com/mission-apprentissage/flux-retour-cfas/commit/32401f11fdfc8e2bf94756349426e4a4d8eb3378))
- refacto rco api route to effectifsApprenants route ([#922](https://github.com/mission-apprentissage/flux-retour-cfas/issues/922)) ([bc51acf](https://github.com/mission-apprentissage/flux-retour-cfas/commit/bc51acfc3896707b0e6ec303477cb829056a7278))
- refonte pages publiques ([#947](https://github.com/mission-apprentissage/flux-retour-cfas/issues/947)) ([969d935](https://github.com/mission-apprentissage/flux-retour-cfas/commit/969d9356cb676db6a1ae3bc4f511bffb48703636)), closes [#891](https://github.com/mission-apprentissage/flux-retour-cfas/issues/891) [#902](https://github.com/mission-apprentissage/flux-retour-cfas/issues/902) [#915](https://github.com/mission-apprentissage/flux-retour-cfas/issues/915) [#916](https://github.com/mission-apprentissage/flux-retour-cfas/issues/916) [#907](https://github.com/mission-apprentissage/flux-retour-cfas/issues/907) [#875](https://github.com/mission-apprentissage/flux-retour-cfas/issues/875) [#925](https://github.com/mission-apprentissage/flux-retour-cfas/issues/925) [#933](https://github.com/mission-apprentissage/flux-retour-cfas/issues/933) [#934](https://github.com/mission-apprentissage/flux-retour-cfas/issues/934) [#935](https://github.com/mission-apprentissage/flux-retour-cfas/issues/935) [#937](https://github.com/mission-apprentissage/flux-retour-cfas/issues/937) [#940](https://github.com/mission-apprentissage/flux-retour-cfas/issues/940) [#942](https://github.com/mission-apprentissage/flux-retour-cfas/issues/942)
- remove user ([#1563](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1563)) ([885545a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/885545a3a572abaf3a2bc3aa05af74ef789e1f2b))
- repartion multi siret cfa view ([#917](https://github.com/mission-apprentissage/flux-retour-cfas/issues/917)) ([13eeec2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/13eeec2dc1169bf11ad7810b77cd9f63c2a9a169))
- rework cfa filter ([#965](https://github.com/mission-apprentissage/flux-retour-cfas/issues/965)) ([e48118b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e48118bb79ecd5b4001d96911444f161ebddf86b))
- rework formations filter ([#973](https://github.com/mission-apprentissage/flux-retour-cfas/issues/973)) ([5f95bec](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5f95bec64e4e4890030d80338b66dbd966cea7ca))
- **server:** add code region corse ([cfcf7cd](https://github.com/mission-apprentissage/flux-retour-cfas/commit/cfcf7cd5bdecf8bf5057d0f380c22ee5efd94ebe))
- **server:** add created_at effectif ([95805f8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/95805f8973b4132593ac0b7d79268b333e68cac7))
- **server:** add created_at jobEvent + test ([6637a21](https://github.com/mission-apprentissage/flux-retour-cfas/commit/6637a211ca832fc09f5c20fd68129731a17aca62))
- **server:** add created_at remove ([1e878ff](https://github.com/mission-apprentissage/flux-retour-cfas/commit/1e878ffa5f5ba77c9c3e214cde1924d823d5024c))
- **server:** add date_de_naissance_apprenant to unicity & set it mandatory ([#845](https://github.com/mission-apprentissage/flux-retour-cfas/issues/845)) ([317e654](https://github.com/mission-apprentissage/flux-retour-cfas/commit/317e6541d1c9eb866b9e9736ee2339a1e436d941))
- **server:** add default unknow value for user fields in userEvents ([#1633](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1633)) ([d631715](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d6317157a10b0bb5b4421113ad403d42496338fe))
- **server:** add effectifs-national route cache ([77af013](https://github.com/mission-apprentissage/flux-retour-cfas/commit/77af013eab6c6c4c3908711d7f66cc9d001484d9))
- **server:** add fields to userEvent & update create method ([#1588](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1588)) ([ada5d0d](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ada5d0dd3c09dcaad59165af9bec7b97f543f87d))
- **server:** add findOne ([0fb3d1a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0fb3d1ac11731d786c1f65502c7f51c56efbf6ea))
- **server:** add job find cfa contacts in referentiel api ([#939](https://github.com/mission-apprentissage/flux-retour-cfas/issues/939)) ([ec694e3](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ec694e3eadcb8c9bbb58dbdd416903e942efc9a0))
- **server:** add missing api unit test ([#848](https://github.com/mission-apprentissage/flux-retour-cfas/issues/848)) ([b86fdc0](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b86fdc05365abfd1ec4be77540fb614a0fd0ff67))
- **server:** add regex control for siret in api input ([#1235](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1235)) ([e222fc8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e222fc8b6ca7b81893568711dd8a2d0a5bba4b45))
- **server:** add retrieve uai/siret gestionnaires & formateurs job from catalog ([#1222](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1222)) ([25eb142](https://github.com/mission-apprentissage/flux-retour-cfas/commit/25eb142b57e54def0f6c4b895ad471ea8503328b))
- **server:** add searchTerm sirets ([4d51fd6](https://github.com/mission-apprentissage/flux-retour-cfas/commit/4d51fd612456c9e3405a06f3b0aa36d489ae5a50))
- **server:** add test ([d38aca6](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d38aca63ddea9b0b9e8582c7aba4c859da2bb50f))
- **server:** check collection exists before indexes creation / deletion ([#1571](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1571)) ([e2e01aa](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e2e01aa527b745b8cedc75c139ae5760fa5fd658))
- **server:** create effectifs public route + test uni ([6d44e9e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/6d44e9e59b901fa6dd0ef852c96c51c4e528dc32))
- **server:** create reseauxCfas collection & refactor seedCfas using it ([#929](https://github.com/mission-apprentissage/flux-retour-cfas/issues/929)) ([1c5770e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/1c5770e5a42c0891d903e66de330c83b5205cfa7))
- **server:** create test ([6295dd0](https://github.com/mission-apprentissage/flux-retour-cfas/commit/6295dd020f6bd7f95617af26558ab910110f3375))
- **server:** create test ([ab245bd](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ab245bde197dece40b5e5b9fded258688f25477e))
- **server:** created factory test ([5009cad](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5009cad6d27d5879203c8d46af08cd2a2b6f2cff))
- **server:** Creation date parameter ([d28b129](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d28b129e42cb0ab7466e3e770dfae0701b1e8655))
- **server:** export anonymized function & route & unit tests ([53cdd68](https://github.com/mission-apprentissage/flux-retour-cfas/commit/53cdd68db19fe4d4b8dc9be93cce8bd77deca089))
- **server:** fix duplicates dossiersApprenants with leading / ending spaces on nom_apprenant / prenom_apprenant ([49dff42](https://github.com/mission-apprentissage/flux-retour-cfas/commit/49dff426dd096b72714ff1701ab1f17df194dd53))
- **server:** indexes siret ([a449e78](https://github.com/mission-apprentissage/flux-retour-cfas/commit/a449e7838d67b41f86e599f438a1299607188991))
- **server:** refacto factory & base class & update tests ([#1220](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1220)) ([7c4e99e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/7c4e99e71fe1974f4e72602d0ff4d049a9c34734))
- **server:** refacto remove script dossiersApprenants nonRecus depuis ([#1342](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1342)) ([dcccd38](https://github.com/mission-apprentissage/flux-retour-cfas/commit/dcccd38b415727f32ede2497559451c016b788e3))
- **server:** refacto tracking & add unit tests ([207f065](https://github.com/mission-apprentissage/flux-retour-cfas/commit/207f065b4f39bbdddbc9f24388be02690008da05))
- **server:** remove useless export csv repartitons ([f0f040f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f0f040ff1015e7783fba95917c4e4acb163ecefe))
- **server:** reseau cfa + testUni ([d5cad7f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/d5cad7f026e3084c0adf230159af9aca1f8f2360))
- **server:** test unitaire ([c0adefb](https://github.com/mission-apprentissage/flux-retour-cfas/commit/c0adefbd5bbd9ec5fdd9c0948091a78af40924e4))
- **server:** update anonymized csv columns ([#1528](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1528)) ([900395b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/900395bd7697576d462fc87a38624acb1692bc7e))
- **server:** update users search case insensitive + region ([#1570](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1570)) ([a54c733](https://github.com/mission-apprentissage/flux-retour-cfas/commit/a54c733365d115a22bbfd6c34920ee3fbedcaa0a))
- track csv export & refacto tracking ([#1592](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1592)) ([fbaad4b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/fbaad4bac5f44a944e8e9f729c1459169de1b346))
- **ui:** add .env.example file ([#926](https://github.com/mission-apprentissage/flux-retour-cfas/issues/926)) ([8029e21](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8029e216355acf1cf821a5124ee47a104d128561))
- **ui:** add auto complete ([84736f7](https://github.com/mission-apprentissage/flux-retour-cfas/commit/84736f7ff8ca9d741c2c260c135f4a73c48681e8))
- **ui:** add banner network on header & disable network selected state for network user ([#959](https://github.com/mission-apprentissage/flux-retour-cfas/issues/959)) ([47ba039](https://github.com/mission-apprentissage/flux-retour-cfas/commit/47ba0393d5db797cd2ba0ea2f751aee8875abeee))
- **ui:** add download block for multiSiret cfa view ([#1520](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1520)) ([72ad785](https://github.com/mission-apprentissage/flux-retour-cfas/commit/72ad785dde0c31ab30e47531e8547188bc13a6ba))
- **ui:** add fetchEffectifsAnonymizedDataListCsvExport ([9f740af](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9f740af695179ec45ae11a2ab0f72778e196a2a0))
- **ui:** add filter ([6a99eb0](https://github.com/mission-apprentissage/flux-retour-cfas/commit/6a99eb0f622914b01298231d050f31f6c7b4d482))
- **ui:** add loader on downloadBlock ([ef32b57](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ef32b57a434ed3e66dd4327c97a616b813da433a))
- **ui:** add mailTo button to help page ([#993](https://github.com/mission-apprentissage/flux-retour-cfas/issues/993)) ([bdefbf0](https://github.com/mission-apprentissage/flux-retour-cfas/commit/bdefbf0394382aacf30f03427c08325c65cd6259))
- **ui:** add new picto & new colors to effectifCards ([#961](https://github.com/mission-apprentissage/flux-retour-cfas/issues/961)) ([a6c8b82](https://github.com/mission-apprentissage/flux-retour-cfas/commit/a6c8b822b290491333cce839c28edcc3252a5d4d))
- **ui:** add overflow auto on overlay ([#1203](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1203)) ([8b8a69a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8b8a69a920d5f350dc7862711685717487b68734))
- **ui:** add pagination & create component loading / NoResults ([5bdb2b2](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5bdb2b2c7f4ebd52029d2c6c20ca49b95948d088))
- **ui:** add pagination to usersTable ([#1561](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1561)) ([91d3a6f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/91d3a6ff162ff9302d56c016fb08301ba3b02e16))
- **ui:** add reseau ([0fbdd54](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0fbdd54323529b0ae606b34c4828e2a2fe26fd01))
- **ui:** add text ([9ca1a88](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9ca1a8806f94cded606784d6af7a95a253d60a86))
- **ui:** ajout du lien Accessibilité : Non conforme vers dashlord ([3e5b021](https://github.com/mission-apprentissage/flux-retour-cfas/commit/3e5b021f6d451765635286c1afa5e18f31fc6ce6))
- **ui:** ajout du svg notfound ([5635d8e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5635d8e88f18832fd709a58dd3f3166fb3a95d3b))
- **ui:** change tabs position & copyPrivateUrlLink position ([#1519](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1519)) ([695dc4a](https://github.com/mission-apprentissage/flux-retour-cfas/commit/695dc4a6506fa89b22a38ac7bafd1e816c1f3b18))
- **ui:** Connexion button with arrow in hover ([#1165](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1165)) ([bfa5a59](https://github.com/mission-apprentissage/flux-retour-cfas/commit/bfa5a59adb0fc12cda33bcd66a98d3e732b4a78b))
- **ui:** create admin folder ([dd3d096](https://github.com/mission-apprentissage/flux-retour-cfas/commit/dd3d0969e1d12060203ea4a1303d947c3e1e26f1))
- **ui:** create constant QUERY_KEY ([04f8bce](https://github.com/mission-apprentissage/flux-retour-cfas/commit/04f8bce9fadc1679ab8ce1a020283262e10e67db))
- **ui:** create formatDate function ([cd768b8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/cd768b8ea80808e7c3d893666b8fe06a511d26cf))
- **ui:** create hook and delete indicateurNational ([13bea89](https://github.com/mission-apprentissage/flux-retour-cfas/commit/13bea890c10f03e0e3d634f72d2fcdcf972c669e))
- **ui:** create mentions legales page ([5c91507](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5c9150764d50ad2067c1366d2fdf598b0edafd78))
- **ui:** create route navbar administrator ([349446c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/349446ce0cc0d71304432e04036ef1b605566eff))
- **ui:** create variant ([ce294c3](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ce294c320f0a0e5c96b8a2ac24dcf9b7d08eb911))
- **ui:** created hook ([dddb17c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/dddb17c033c95b368c6c6dc06b83b8487f3988ef))
- **ui:** creation d'un composant link ([ce25968](https://github.com/mission-apprentissage/flux-retour-cfas/commit/ce25968615ace652390b6415ab94a1f527cf1378))
- **ui:** creation du composant baseAccordion et tout deplier/replier ([5e59a7f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5e59a7fe2967aa85440ed71b255a8865b62fbc9c))
- **ui:** delete comment and add toaster ([1481084](https://github.com/mission-apprentissage/flux-retour-cfas/commit/14810845bf07f735599a49d0a6deda6f239709fb))
- **ui:** export csv for cfa & private cfa view ([43a53d1](https://github.com/mission-apprentissage/flux-retour-cfas/commit/43a53d14c134fc01bdbc782cda4660700fe3eed8))
- **ui:** export csv for formation ([354298e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/354298eaa3a3a49bec75d44ff4dd97c951dd5b27))
- **ui:** export csv for réseau ([798f910](https://github.com/mission-apprentissage/flux-retour-cfas/commit/798f910e62a3181d231366b9e4e3d07be4ca9690))
- **ui:** export csv for territoire départemental ([45af107](https://github.com/mission-apprentissage/flux-retour-cfas/commit/45af1072fe687cd0c5df745311b60c6185de92d1))
- **ui:** export csv for territoire national ([e74f3e4](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e74f3e4e4411b5f69e5a7a80aa0c8fa0685afe89))
- **ui:** export csv for territoire régional ([889ce02](https://github.com/mission-apprentissage/flux-retour-cfas/commit/889ce0240f08ea42d51420faf5e5b17cb4069af8))
- **ui:** fix docker-compose & add alert component for env dev or recette ([#1654](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1654)) ([df2a25f](https://github.com/mission-apprentissage/flux-retour-cfas/commit/df2a25f55204f0eb9bdddbc68d272906b82710cb))
- **ui:** handle no organismes & count = 0 ([#1795](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1795)) ([3585938](https://github.com/mission-apprentissage/flux-retour-cfas/commit/35859380f62aa7d3b51188aff426232b48542069))
- **ui:** hook ([8db0376](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8db037699e90df75327f617459408f8108ff9385))
- **ui:** Multi siret detail view ([#1252](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1252)) ([6c92e35](https://github.com/mission-apprentissage/flux-retour-cfas/commit/6c92e3574c1e8fb42cea885226e678799728ba43))
- **ui:** new design ([e9add38](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e9add3816767f5d39b11c6271a4b54cdaa7d9257))
- **ui:** new DownloadBlock component ([#1430](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1430)) ([546b5e9](https://github.com/mission-apprentissage/flux-retour-cfas/commit/546b5e9e7cdb07abc6940ae52852429214aa2b29))
- **ui:** page 404 ([#1788](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1788)) ([2bd08ef](https://github.com/mission-apprentissage/flux-retour-cfas/commit/2bd08efc8874ec61e3671a78bb463db6cc30560f))
- **ui:** redesign des InfosSections ([#838](https://github.com/mission-apprentissage/flux-retour-cfas/issues/838)) ([9ed3fb6](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9ed3fb679785bb190cf7ae95eb8476e5a700736b))
- **ui:** remove file extension from DownloadBlock ([#1523](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1523)) ([e32c759](https://github.com/mission-apprentissage/flux-retour-cfas/commit/e32c7590978127b1be9ef5a48e7294c8ed83e1a8))
- **ui:** resize OverlayMenu for changeView ([#1569](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1569)) ([88880eb](https://github.com/mission-apprentissage/flux-retour-cfas/commit/88880eb40f47a0182565cc98abfb331e97f321e2))
- **ui:** update ([8087d10](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8087d10b8371323c8cc5968143d008337925bac5))
- **ui:** update cfa filter placeholder for siret ([#1207](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1207)) ([0290df3](https://github.com/mission-apprentissage/flux-retour-cfas/commit/0290df3b14a78f1fd71577c0ae222fd31a5fcff5))
- **ui:** update chiffres national ([#1315](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1315)) ([c0694de](https://github.com/mission-apprentissage/flux-retour-cfas/commit/c0694de5b12c7f73717a12916c98e2a29ee90826))
- **ui:** update effectifs & changelog ([#1545](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1545)) ([f87d10b](https://github.com/mission-apprentissage/flux-retour-cfas/commit/f87d10b91d40cd1adf2674864c4cb8182bd9447e))
- **ui:** update effectifs national ([#1636](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1636)) ([4cb1e35](https://github.com/mission-apprentissage/flux-retour-cfas/commit/4cb1e356aca8eff88527d45dc17bc5f093d11471))
- **ui:** update ERPs ready & tuto pdf link ([#1468](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1468)) ([67c574e](https://github.com/mission-apprentissage/flux-retour-cfas/commit/67c574e3633779cb7db43788f0e5b5ea686af5a0))
- **ui:** Update the evolution log ([7e8416c](https://github.com/mission-apprentissage/flux-retour-cfas/commit/7e8416c75683c96d0de6f18f95c6facc05ef24de))
- **ui:** url private link ([5c9d6f5](https://github.com/mission-apprentissage/flux-retour-cfas/commit/5c9d6f57025778268e92c1d3827af2fb533b1213))
- update ([9364537](https://github.com/mission-apprentissage/flux-retour-cfas/commit/9364537038e61ad7d0c6ac5ce33f6ab4082f59f9))
- update rncp field to rncps list field for formations ([#1395](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1395)) ([2fad9ae](https://github.com/mission-apprentissage/flux-retour-cfas/commit/2fad9ae3eae4c68deb20a68169cc81035d0118e1))
- update total-organisme route adding anneeScolaire filter ([#1650](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1650)) ([b105b77](https://github.com/mission-apprentissage/flux-retour-cfas/commit/b105b7762c73ab2e259575a1e85f5d4640e6d1f1))
- update user ([#1581](https://github.com/mission-apprentissage/flux-retour-cfas/issues/1581)) ([36fb810](https://github.com/mission-apprentissage/flux-retour-cfas/commit/36fb8104bb2c5d51becb7cd5a943564371b31c40))

### Reverts

- revert : new indicateur (#946) ([95481c8](https://github.com/mission-apprentissage/flux-retour-cfas/commit/95481c8d239bdb46ff39c8ef9f5332c8ef5123dc)), closes [#946](https://github.com/mission-apprentissage/flux-retour-cfas/issues/946) [#921](https://github.com/mission-apprentissage/flux-retour-cfas/issues/921)
- Revert "Add network ExcellencePro (#857)" (#863) ([8751fa6](https://github.com/mission-apprentissage/flux-retour-cfas/commit/8751fa6294623b336e15e076830b44f835cfe783)), closes [#857](https://github.com/mission-apprentissage/flux-retour-cfas/issues/857) [#863](https://github.com/mission-apprentissage/flux-retour-cfas/issues/863)
