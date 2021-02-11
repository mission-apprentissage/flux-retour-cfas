![](https://avatars1.githubusercontent.com/u/63645182?s=200&v=4)

# Flux Retour CFAS

## Pré-requis

- NodeJs 14
- Yarn
- Docker & Docker-compose

## Présentation

Ce repository contient l'application des flux retours des cfas.

## Infrastructure & Déploiement

Ce projet fonctionne de manière autonome en local avec des conteneurs docker.

Pour déployer et faire fonctionner l'application sur un server dédié dans Azure il faut récupérer le contenu du répository flux-retour-cfas-infra.

Le répository flux-retour-cfas-infra est lui, privé car il est utilisé pour contenir l'ensemble des données sensibles (Clés SSH, mots de passes ...) nécessaires à la mise en place de l' application, merci de suivre sa documentation dédiée pour déployer l'application.

## Organisation des dossiers

Ce repository est organisé de la manière suivante :

```
    |-- .github
    |-- reverse_proxy
        |-- app
            |-- logrotate.d
                |-- logrotate.conf
            |-- nginx
                |-- conf.d
                  |-- locations
                    |-- api.inc
                  |-- default.conf
                |-- nginx.conf
            |-- start.sh
        |-- Dockerfile
    |-- server
        |-- assets
        |-- config
          |-- index.js
        |-- data
        |-- src
        |-- tests
          |-- integration
            |-- ...
          |-- unit
            |-- ...
          |-- utils
            |-- ...
    |-- .gitattributes
    |-- .gitignore
    |-- docker-compose.yml
    |-- docker-compose.override.yml

```

- Le dossier `/.github` va contenir l'ensemble des Github Actions.
- Le dossier `/reverse_proxy` va contenir le serveur Nginx et sa configuration en tant que reverse_proxy.
- Le dossier `/server` va contenir l'ensemble de l'application coté serveur, à savoir l'API Node Express.
- Le dossier `/ui` va contenir l'ensemble de l'application coté front, à savoir une application React implémentant le design system de l'État (https://www.gouvernement.fr/charte/charte-graphique-les-fondamentaux/introduction) grâce à [ChakraUI](https://chakra-ui.com/).
- Le fichier `/docker-compose.yml` va définir la configuration des conteneurs de l'application, _pour plus d'informations sur Docker cf: https://docs.docker.com/_
- Le fichier `/docker-compose.override.yml` va définir la configuration Docker spécifique à l'environnement local de développement.
  :warning: ce fichier est ignoré lors des commits (cf .gitignore) afin d'éviter la divulgation de secrets/tokens

## Gestion de la configuration

La gestion de la configuration se fait via bibliothèque [env-var](https://www.npmjs.com/package/env-var) et le fichier `docker-compose.override.yml`

La configuration est gérée exclusivement via variables d'environnement pour des raisons de sécurité et de cohérence entre environnements.

Le module `/server/config/index.js` expose un objet mappant les variables d'environnements nécessaires au fonctionnement de l'application. Il se charge également de parser les variables grâce à env-var afin de les rendre exploitable en javascript (la valeur "true" est convertie en boolean, 1234 en number etc...).

Chaque environnement possède son propre fichier d'override afin d'isoler les différentes configurations.

Pour la gestion et l'execution locale de l'application nous utilisons la bibliothèque [dotenv](https://github.com/motdotla/dotenv) et en local un fichier `.env` à placer dans le dossier `/server`.

**Ce fichier est privé et n'est pas disponible dans le repository.**

## Conteneurs Docker

### Présentation de la configuration Docker

Pour fonctionner ce projet a besoin des éléments dockérisés suivants :

- Un serveur Web Nginx jouant le role de reverse proxy, _défini dans le service `reverse_proxy` du docker-compose_.
- Un serveur Node Express, _défini dans le service `server` du docker-compose_.
- Un réseau _défini dans `flux_retour_cfas_network` du docker-compose_.
- Une base de donnée mongoDb _défini dans le service `mongodb` du docker-compose_.
- Une interface Web en React, _définie dans le service `ui` du docker-compose_.
- Un serveur FTP (VSFTPD) , _défini dans le service `ftp` du docker-compose_.

### Serveur Nodes & Nginx - Reverse Proxy

Le serveur nginx joue le role de reverse proxy sur le port 80.

Le serveur Web Node Express utilise le port 5000.

Dans la configuration de nginx, on fait référence au fichier `/reverse_proxy/app/nginx/conf.d/locations/api.inc` qui définir la gestion de l'API Node Express.

### Base de données MongoDb

Le base de données est une MongoDb et utilise le port par défaut 27017.

### Ui - React

L'interface web est une application React crée à partir du cli `create-react-app` (cf: https://create-react-app.dev/)

L'application implémente le design system de l'État Français https://gouvfr.atlassian.net/wiki/spaces/DB/overview?homepageId=145359476 grâce à un theme propagé par ChakraUI (https://chakra-ui.com/docs/theming/customize-theme).

### Server FTP

Le serveur FTP est monté via une image de VSFTPD (cf https://wiki.debian.org/fr/vsftpd)

### Démarrage de la stack

Pour créer la stack et monter l'environnement il suffit de lancer la commande suivante depuis le répertoire `/server` :

```bash
yarn docker:start
```

### Arret de la stack

Il est possible de stopper les conteneur en lancant la commande suivante depuis le répertoire `/server` :

```bash
yarn docker:stop
```

### Suppression de la stack

Pour supprimer l'ensemble de la stack et tuer tous les conteneurs il suffit de lancer la commande suivante depuis le répertoire `/server` :

```bash
yarn docker:clean
```

### Vérification du montage de la stack

Aprés avoir créé la stack pour vérifier que les conteneurs sont bien présents vous pouvez lancer la commande suivante depuis le répertoire `/server` :

```bash
docker exec -t -i flux_retour_cfas_server /bin/bash
```

De même pour consulter la liste des fichiers dans le docker :

```bash
docker exec flux_retour_cfas_server bash -c 'ls'
```

## Migrations

Le projet utilise [migrate-mongo](https://github.com/seppevs/migrate-mongo#readme). Les migrations se trouvent dans le répertoire `/server/src/migrations`

Pour créer une migration :
```sh
yarn migration:create ma-nouvelle-migration
```

Pour jouer les migrations :
```sh
yarn migration:up
```

Après chaque migration réussie [migrate-mongo](https://github.com/seppevs/migrate-mongo#readme) stocke dans la collection Mongo `changelog` une référence permettant de versionner le processus et ne pas rejouer à chaque fois toutes les migrations.

Les nouvelles migrations sont exécutées automatiquement à chaque déploiement.

## Linter

Un linter (via ESLint) est mis en place dans le projet, pour le lancer :

```bash
yarn lint
```

## Tests

Des tests sont mis en place en utilisant le framework Mocha.

_Pour en savoir plus sur Mocha : https://mochajs.org/_

Les tests sont en règle général découpés en 3 dossiers :

- Le dossier `/server/tests/unit` contient la liste des tests unitaires.
- Le dossier `/server/tests/integration` contient la liste des tests d'intégration
- Le dossier `/server/tests/utils` contient la liste des utilitaires communs de test.

## Server Node Express

### Http

La structure principale du serveur Node Express est définie dans `/server/src/http` et contient :

- La liste des middlewares express à appliquer
- La liste des routes d'API
- Le point d'entrée principal du serveur : `/server/src/http/server.js`

### Logger

Pour la gestion des logs nous utilisons la librairie bunyan _cf : https://www.npmjs.com/package/bunyan_

Par défaut 3 stream sont configurés :

- Dans la console.
- Dans un fichier JSON.
- Dans une chaine Slack.

Pour mettre en place les notifications Slack il est nécessaire d'utiliser les Webhooks et de créer une chaine dédiée dans votre espace de travail Slack.

Il vous faudra créer une application dans Slack et récupérer le lien de la Webhook, pour en savoir plus : https://api.slack.com/messaging/webhooks.

### Utilitaires

Certains modules utilitaires sont présents dans `/server/src/common/utils`

### Composants injectables

Un module permettant de contenir des composants "communs" et injectable dans les routes est proposé dans le fichier `/server/src/common/components/components.js`

Vous pouvez ajouter dans ce fichier des élements communs à réexploiter dans l'API.

## Debugger sous VSCode

Il est possible de débugger facilement le serveur Express contenu dans le Docker local **sous VSCode** en utilisant la configuration suivante \_a placer dans le fichier `/.vscode/launch.json` :

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Debug Express in docker",
      "address": "127.0.0.1",
      "port": 9229,
      "localRoot": "${workspaceFolder}/server/src",
      "remoteRoot": "/app/src",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

Cette configuration va utiliser la commande `debug` définie dans le fichier `/server/package.json` :

```json
{
  "scripts": {
    "debug": "nodemon --inspect=0.0.0.0 --signal SIGINT --ignore tests/ src/index.js"
  }
}
```

## Workflows & CI / CD

Dans le repertoire `/.github/workflows` sont définie les Github actions à mettre en place sur le repository.

Le workflow principal est définie dans `/.github/workflows/yarn-ci.yml` et se charge à chaque push sur une branche de :

- Vérifier l'installation des dépendances
- Lancer le linter
- Exécuter les tests unitaires.

## Jobs & Procédure de déploiement de l'application

Pour executer un job, que ce soit en local ou sur un des environnement (production / recette) il est recommandé d'executer les commandes **dans le conteneur docker `flux_retour_cfas_server`.**

**Attention, pour la création des users ayant un accès ftp il est nécéssaire de créer les users depuis le conteneur docker `flux_retour_cfas_server`, car il est nécessaire à VSFTPD d'écrire dans le fichier de configuration vsftp_pam pour la création des utilisateurs.**

### Jobs de suppression des données

Il est possible de supprimer les données en base de plusieurs manières :

- Pour supprimer toutes les données en base :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn clear:all"
```

- Pour supprimer uniquement les statuts des candidats en base :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn clear:statutsCandidats"
```

- Pour supprimer uniquement les logs (+usersEvents) en base :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn clear:logs"
```

- Pour supprimer uniquement les users (+ usersEvents) en base :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn clear:users"
```

### Jobs d'alimentation des données

Il est possible d'alimenter la base de donneés avec des données de réferences / test :

- Pour ajouter les users par défaut :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn seed:users"
```

- Pour ajouter des statuts candidats de test en base :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn seed:sample"
```

- Pour ajouter des statuts candidats randomisés en base :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn seed:randomizedSample"
```

### Jobs d'affichage des statistiques

Il est possible d'afficher en console les statistiques des données du flux retour :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn stats"
```

### Jobs de vérification et clean des données

- Pour valider et marquer les SIRET et UAI des statuts candidats en base :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn siret-uai:check-validity"
```

- Pour clean les SIRET invalides (comportant espaces et points) en base :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn siret:sanitize"
```

- Pour tenter de retrouver les SIRET manquants grâce à une table de correspondance UAI/SIRET fournie par Gesti en base :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn siret:retrieve-gesti"
```

- Pour tenter de retrouver les SIRET manquants sur les statuts candidats provenant de Ymag grâce aux UAI déjà présents en base :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn siret:retrieve-ymag"
```

- Pour tenter de retrouver les infos de localisation des établissements en base grâce au SIRET et à l'API Tables Correspondances :

```bash
docker exec -t -i flux_retour_cfas_server bash -c "yarn etablissements-location:retrieve"
```

### Procédure à suivre au premier déploiement

Dès le premier déploiement de l'application est recommandé de suivre la procédure suivante :

1. Affichage des stats pour vérifier que la base de données est vide.
2. Seed des users défaut
