# Développement

- [Développement](#développement)
  - [Pré-requis](#pré-requis)
  - [Organisation des dossiers](#organisation-des-dossiers)
  - [Opérations](#opérations)
    - [Installation et Mise à jour des dépendences](#installation-et-mise-à-jour-des-dépendences)
  - [Linter](#linter)
  - [Prettier](#prettier)
  - [Typescript](#typescript)
    - [Arrêt de l'application](#arrêt-de-lapplication)
    - [Suppression de la stack](#suppression-de-la-stack)
      - [Server CLI](#server-cli)
    - [Emails](#emails)
    - [Debugger sous VSCode](#debugger-sous-vscode)
      - [Server Inspect](#server-inspect)
      - [Processor Inspect](#processor-inspect)
      - [Server Test](#server-test)
  - [Aller plus loin](#aller-plus-loin)

## Organisation des dossiers

Ce projet est organisé de la manière suivante :

```
.
├── .bin
│   └── scripts
├── .git
│   ├── hooks
│   ├── info
│   ├── lfs
│   ├── logs
│   ├── objects
│   └── refs
├── .github
│   ├── ISSUE_TEMPLATE
│   └── workflows
├── .husky
│   └── _
├── .infra
│   ├── ansible
│   ├── files
│   └── vault
├── .vscode
├── .yarn
│   ├── cache
│   ├── plugins
│   └── releases
├── server
│   ├── coverage
│   ├── dist
│   ├── src
│   ├── static
│   └── tests
├── shared
│   ├── constants
│   └── utils
└── ui
    ├── .next
    ├── .storybook
    ├── .swc
    ├── common
    ├── components
    ├── hooks
    ├── modules
    ├── pages
    ├── public
    ├── stories
    ├── styles
    └── theme
├── Dockerfile
├── LICENSE
├── README.md
├── .talismanrc
├── .prettierignore
├── .dockerignore
├── .eslintrc.cjs
├── .gitattributes
├── docker-bake.json
├── docker-compose.yml
├── jest.config.js
├── package.json
├── release.config.js
```

- Le dossier `/.infra` contient la configuration de l'instructure.
- Le dossier `/.github` contient l'ensemble des Github Actions.
- Le dossier `server` contient l'ensemble de l'application coté serveur, à savoir l'API Node Express.
- Le dossier `shared` contient le code partagé entre l'ui et le server
- Le dossier `ui` contient l'ensemble de l'application coté front, à savoir le code NextJs.
- Le fichier `/docker-compose.yml` va définir la configuration des conteneurs de l'application, _pour plus d'informations sur Docker cf: https://docs.docker.com/_
- Le fichier `/docker-compose.debug.yml` va définir la configuration Docker spécifique à l'environnement local de développement nécessaire au debugging local.

## Opérations

Veuillez consulter le [README](../README.md#développement) principal pour le démarrage.

### Installation et Mise à jour des dépendences

Pour installer et mettre à jour les dépendences, vous pouvez au choix:

- Modifier les différents `package.json` et appliquer les changements via `yarn install`
- Ajouter des dépendences via la commande `yarn add -E`

Pour refleter les changements, il faudra relancer les applications via la commande `make start`

**Note:** les changements appliqués à `.yarn/cache` doivent etre commit dans le repository.

## Linter

Un linter (via ESLint) est mis en place dans le projet, pour le lancer :

```bash
yarn lint
```

**Note:** eslint est run automatiquement à chaque commit

## Prettier

Prettier est mis en place dans le projet, pour le lancer :

```bash
yarn prettier:fix
```

**Note:** eslint est run automatiquement à chaque commit

## Typescript

L'application utilise TypeScript, pour vérifier que les erreurs liés au type veuillez lancer:

```bash
yarn typecheck
```

### Arrêt de l'application

Il est possible de stopper l'application en lancant la commande suivante :

```bash
yarn services:stop
```

### Suppression de la stack

Pour supprimer l'ensemble de la stack et tuer tous les conteneurs il suffit de lancer la commande suivante :

```bash
yarn services:clean
```

#### Server CLI

De manière général, il est recommandé d'utiliser une session interactive.

Vous pouvez utiliser la cli du server, dans la session interactive `docker compose run --rm -it server sh`:

- `yarn cli --help`: List l'ensemble des commandes disponibles
- `yarn cli seed`: Seed de la database
- `yarn cli migrations:status`: Vérification du status des migrations
- `yarn cli migrations:up`: Execution des migrations
- `yarn cli migrations:create`: Creation d'une nouvelle migration

Il est aussi possible de lancer ces commandes sans session interactive comme par example:

```bash
yarn cli --help
```

### Emails

Le server SMTP de test [Mailpit](https://github.com/axllent/mailpit) est utilisé localement pour prendre en charge l'envoi d'emails localement.

Vous pouvez accéder à l'interface utilisateur à l'addresse suivante [http://localhost:1025](http://localhost:1025).

### Debugger sous VSCode

Il est possible de débugger facilement **sous VSCode** grace à la configuration Vscode partagée.

#### Server Inspect

- Lancer la task `Attach Server`
- Lancer l'application en utilisant la commande `make debug` au lieu de `make start`.

#### Processor Inspect

- Lancer la task `Attach Processor`
- Lancer l'application en utilisant la commande `make debug` au lieu de `make start`.

#### Server Test

Utilisez l'extension VsCode [Vitest](https://marketplace.visualstudio.com/items?itemName=ZixuanChen.vitest-explorer)

## Aller plus loin

- [Développement du Server](./developpement/server.md)
