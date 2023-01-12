# Développement

## Pré-requis

- Docker & Docker-compose
- Nodejs 16
- Yarn

## Organisation des dossiers

Ce projet est organisé de la manière suivante :

```
    |-- .infra
    |-- .github
    |-- reverse_proxy
    |-- server
    |-- ui
    |-- docker-compose.yml
    |-- docker-compose.override.yml

```

- Le dossier `/.github` contient l'ensemble des Github Actions.
- Le dossier `/reverse_proxy` contient le serveur Nginx et sa configuration en tant que reverse_proxy.
- Le dossier `server` contient l'ensemble de l'application coté serveur, à savoir l'API Node Express.
- Le dossier `ui` contient l'ensemble de l'application coté front, à savoir le code NextJs.
- Le fichier `/docker-compose.yml` va définir la configuration des conteneurs de l'application, _pour plus d'informations sur Docker cf: https://docs.docker.com/_
- Le fichier `/docker-compose.override.yml` va définir la configuration Docker spécifique à l'environnement local de développement.

=======

### Varaibles d'environnement

Avant de démarrer la stack il vous faut copier et renommer les fichier suivant :

```bash
cp ui/.env.example ui/.env
cp server/.env.example server/.env
```

Les variables par défaut ne permettent pas :

- De recuperer les information liées à un siret
- L'affichage de la page de statistiques
- L'upload de fichier
- La signature électronique
- L'envoi vers AGECAP.

### Démarrage de la stack

Pour créer la stack et monter l'environnement il suffit de lancer la commande suivante :

```bash
make install
make start
```

### Hydratation du projet en local

Pour créer des jeux de test facilement il suffit de lancer les commandes suivante :

```bash
yarn --cwd server seed -e admin@mail.com
yarn --cwd server imports
```

=======

## Conteneurs Docker

- Un serveur Web Nginx jouant le role de reverse proxy, _défini dans le service `reverse_proxy` du docker-compose_.
- Un serveur Node Express, _défini dans le service `server` du docker-compose_.
- Une base de donnée mongoDb _défini dans le service `mongodb` du docker-compose_.
- Un serveur Front sous NextJs _défini dans le service `ui` du docker-compose_.
- Un antivirus _défini dans le service `clamav` du docker-compose_.

### Seulement sur les environnements production, recette et test

- Un outil de statistiques \_défini dans le service `metabase` dans le repository d'infrastructure.

### Seulement sur les environnements de test

- Un serveur SMTP mailHog \_défini dans le service `smtp` du docker-compose.override.

### Serveur Nodes & Nginx - Reverse Proxy

Le serveur nginx joue le role de reverse proxy sur le port 80.

Le serveur Web Node Express utilise le port 5000.

Dans la configuration de nginx, on fait référence au fichier `/reverse_proxy/app/nginx/conf.d/locations/api.inc` qui définir la gestion de l'API Node Express.
Dans la configuration de nginx, on fait référence au fichier `/reverse_proxy/app/nginx/conf.d/locations/ui.inc` qui définir la gestion de l'UI React.
Dans la configuration des websocket, on fait référence au fichier `/reverse_proxy/app/nginx/conf.d/locations/ws.inc` qui définir la gestion de socket.io.
Dans la configuration de smtp, on fait référence au fichier `/reverse_proxy/app/nginx/conf.d/locations/smtp.inc` qui définir la gestion de MailHog.
Dans la configuration de metabase, on fait référence au fichier `/reverse_proxy/app/nginx/conf.d/locations/metabase.inc` qui définir la gestion de Metabase.

### Base de données MongoDb

Le base de données est une MongoDb et utilise le port par défaut 27017.

### Arrêt de la stack

Il est possible de stopper les conteneur en lancant la commande suivante :

```bash
make stop
```

### Suppression de la stack

Pour supprimer l'ensemble de la stack et tuer tous les conteneurs il suffit de lancer la commande suivante :

```bash
make clean
```

### Vérification du montage de la stack

Après avoir créé la stack pour vérifier que les conteneurs sont bien présents vous pouvez lancer la commande suivante depuis le répertoire `server` :

```bash
docker exec -t -i cerfa_server /bin/bash
```

De même pour consulter la liste des fichiers dans le docker :

```bash
docker exec cerfa_server bash -c 'ls'
```

## Linter

Un linter (via ESLint) est mis en place dans le projet, pour le lancer :

```bash
yarn lint
```

## Tests

Des tests sont mis en place en utilisant le framework Mocha.

_Pour en savoir plus sur Mocha : https://mochajs.org/_

Les tests sont en règle général découpés en 3 dossiers :

- Le dossier `server/tests/unit` contient la liste des tests unitaires.
- Le dossier `server/tests/integration` contient la liste des tests d'intégration
- Le dossier `server/tests/utils` contient la liste des utilitaires communs de test.

## Server Node Express

### Http

La structure principale du serveur Node Express est définie dans `server/src/http` et contient :

- La liste des middlewares express à appliquer
- La liste des routes d'API
- Le point d'entrée principal du serveur : `server/src/httpserver.js`

Il est possible de tester en local le server express via `http://localhost/api`

### Logger

Pour la gestion des logs nous utilisons la librairie bunyan _cf : https://www.npmjs.com/package/bunyan_

Par défaut plusieurs streams sont disponibles :

- console
- json
- slack
- mongodb

Pour mettre en place les notifications Slack il est nécessaire d'utiliser les Webhooks et de créer une chaine dédiée dans votre espace de travail Slack.

Il vous faudra créer une application dans Slack et récupérer le lien de la Webhook, pour en savoir plus : https://api.slack.com/messaging/webhooks.

### Utilitaires

Certains modules utilitaires sont présents dans `server/src/common/utils`

### Composants injectables

Un module permettant de contenir des composants "communs" et injectable dans les routes est proposé dans le fichier `server/src/common/components/components.js`

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
      "localRoot": "${workspaceFolder}server/src",
      "remoteRoot": "/app/src",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

Cette configuration va utiliser la commande `debug` définie dans le fichier `server/package.json` :

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
