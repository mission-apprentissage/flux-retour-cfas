![](https://avatars1.githubusercontent.com/u/63645182?s=200&v=4)

# TDB - Tableau de bord de l'apprentissage

- [TDB - Tableau de bord de l'apprentissage](#TDB---Tableau-de-bord-de-l'apprentissage)
  - [Fiche Produit](#fiche-produit)
  - [Installation](#installation)
    - [Pré-requis](#pré-requis)
    - [Clé GPG](#clé-gpg)
  - [Développement](#développement)
    - [Installation des dépendances](#installation-des-dépendances)
    - [Developpement CLI mna-TDB](#developpement-cli-mna-TDB)
    - [Variables d'environnement local](#variables-denvironnement-local)
    - [Lancement de l'application](#lancement-de-lapplication)
    - [Hydratation du projet en local](#hydratation-du-projet-en-local)
    - [Exécution des tests](#exécution-des-tests)
      - [Snapshots](#snapshots)
  - [Aller plus loin](#aller-plus-loin)

## Fiche Produit

Consultez la [Fiche Produit](???) pour plus d'informations sur le projet.

## Installation

### Pré-requis

Avant d'installer le projet, assurez-vous d'avoir les éléments suivants :

- Docker 23.03.0+
- GPG
- NodeJS 20+ (vous pouvez utiliser [n](https://github.com/tj/n#third-party-installers) pour l'installer)

- brew install yq https://github.com/mikefarah/yq
- brew install git-lfs https://git-lfs.com/
- brew install 1password-cli https://developer.1password.com/docs/cli/get-started/

### Clé GPG

Pour décrypter les variables d'environnement, vous avez besoin d'une clé GPG. Si vous n'en avez pas, vous pouvez en créer une en suivant la documentation GitHub [ici](https://docs.github.com/fr/authentication/managing-commit-signature-verification/generating-a-new-gpg-key).

Voici les étapes pour créer votre clé GPG :

1. Lors de la création de la clé, choisissez les options suivantes :

   - `Please select what kind of key you want` > `ECC (sign and encrypt)`
   - `Please select which elliptic curve you want` > `Curve 25519`
   - `Please specify how long the key should be valid` > `0`
   - `Real Name`: `<Prenom> <Nom>`
   - `Email Address`: `email@mail.gouv.fr`

2. Pour utiliser votre clé au sein du projet, publiez-la en exécutant la commande suivante :

   ```bash
   gpg --list-secret-keys --keyid-format=long
   ```

   L'identifiant de votre clé correspond à la valeur `sec ed25519/<identifiant>`.

3. Pour utiliser votre clé au sein de la mission apprentissage, vous devez la publier en exécutant la commande suivante :

   ```bash
   gpg --send-key <identifiant>
   ```

4. Pour une meilleure sécurité, il est recommandé de sauvegarder les clés publique et privée nouvellement créées. Vous pouvez les exporter en exécutant les commandes suivantes :

   ```bash
   gpg --export <identifiant> > public_key.gpg
   gpg --export-secret-keys <identifiant> > private_key.gpg
   ```

   Ces deux fichiers peuvent être sauvegardés, par exemple, sur une clé USB.

5. Communiquez votre clé à votre équipe afin d'être autorisé à décrypter le vault.

**Une fois autorisé, vous aurez accès aux fichiers suivants :**

- `.infra/vault/.vault-password.gpg`

## Développement

### Installation des dépendances

Avant de lancer l'application, assurez-vous d'installer toutes les dépendances nécessaires en exécutant la commande suivante :

```bash
yarn
yarn setup
```

Cette commande mettra à jour les dépendances du projet.

Le script vous demandera plusieurs fois la phrase secrète de votre clé GPG pour décrypter les variables d'environnement du vault.

### Developpement CLI mna-TDB

Les principales opérations sont regroupée dans un CLI `.bin/mna-tdb`, il est possible de liste l'ensemble des commandes disponible via `.bin/mna-tdb help`.

Il est également possible d'installer gloTDBlement l'exécutable via la commande `.bin/mna-tdb bin:setup` upuis `compinit -C` ne fois installé il est possible d'utiliser la CLI via `mna-tdb help` directement (n'oubliez pas d'ouvrir une nouvelle session de votre terminal).

### Variables d'environnement local

Les variables d'environnement local du server sont stocké dans le vault (peut contenir des secrets). Si vous souhaitez overwwrite certaines variables ou changer le port de l'api par exemple, il est possible de créer un fichier `server/.env.local` et `ui/.env.local`

### Lancement de l'application

Pour démarrer l'application en mode local, exécutez la commande suivante :

```bash
yarn dev
```

Cette commande démarre les containers définis dans le fichier `docker-compose.yml`.

Une fois l'application démarrée, vous pourrez y accéder via l'URL [http://localhost](http://localhost)

### Hydratation du projet en local

Pour créer des jeux de test facilement il suffit de lancer les commandes suivante :

```bash
yarn seed
```

### Exécution des tests

Pour exécuter les tests localement, utilisez la commande suivante :

```bash
yarn test
```

Cette commande exécutera tous les tests du projet et vous affichera les résultats.

**Assurez-vous:**

1. D'avoir installé toutes les dépendances via la commande `yarn install` avant de lancer les tests

2. D'avoir lancé l'application car les tests utilisent la base de donnée.

#### Snapshots

Pour mettre à jour les snapshots, utilisez la commande suivante dans `/shared`

```bash
yarn test --update
```

## Aller plus loin

- [Développement](./docs/developping.md)
- [Infrastructure](./docs/developping.md)
- [Sécurité](./docs/securite.md)
