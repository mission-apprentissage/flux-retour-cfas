# Sources externes de données

## Introduction

Le Tableau de bord utilise certaines données externes récupérées via API.
Ce document détaille la liste des données et l'usage qui en est fait.

## Référentiel

https://referentiel.apprentissage.onisep.fr/ & https://referentiel.apprentissage.onisep.fr/construction/source

Le Référentiel des organismes de formation en apprentissage contient 96% d’organismes validés sur le territoire national.

### Organismes

Nous utilisons la listes des organismes du référentiel pour fiabiliser les organismes transmettant des données au TDB.
Pour cela nous utilisons l'API du référentiel qui nous renvoie le contenu de la collection organismes (construite via l'aggrégation de différentes sources, cf. https://referentiel.apprentissage.onisep.fr/construction)

### UAIs de la base ACCE

Nous utilisons la liste des UAIs du référentiel pour identifier d'éventuels organismes inconnus transmettant des données au TDB.
Pour cela nous utilisons l'API du référentiel qui nous renvoie le contenu de la collection UAI (construite via la récupération des données de la base ACCE)

## Catalogue

https://catalogue-apprentissage.intercariforef.org/

## API Entreprise

https://entreprise.api.gouv.fr

## API CFADock

https://www.cfadock.fr/Home/ApiDescription

## LaBonneAlternance

https://labonnealternance.apprentissage.beta.gouv.fr/

## DECA, par l'API de la BAL

Les contrats d'apprentissage DECA de la DGEFP arrivent par la BAL, maintenue par l'équipe La bonne alternance, qui interroge l'API DECA chaque nuit.

- Le job `hydrate:contrats-deca-raw` lit chaque dimanche à 19h00, en production, la route `GET /v1/deca/contrats` de l'API de la BAL, page par page, jusqu'au dernier contrat.
- Il crée ou met à jour un effectif DECA par année scolaire du contrat.
- Les contrats aux statuts Annulé et Supprimé ne sont pas importés. Leurs effectifs déjà en base sont supprimés en fin d'import, et les vœux Affelnet qui pointaient vers eux sont déliés.
- La BAL anonymise un contrat deux ans après sa date de fin.
- Accès : une clé d'API de la BAL dans `MNA_TDB_BAL_DECA_API_KEY`, en production seulement. Elle vaut un an, et le job prévient dans Sentry trente jours avant l'échéance. La BAL la régénère sur demande, ce qui invalide l'ancienne aussitôt : mettre à jour la variable et déployer le même jour.
- Reprise : après un échec, le job journalise le curseur à passer en `--after` pour reprendre la lecture.
