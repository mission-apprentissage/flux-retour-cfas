# Gestion de l'infrastructure

- [Gestion de l'infrastructure](#gestion-de-linfrastructure)
  - [Prérequis](#prérequis)
    - [Environnement local](#environnement-local)
    - [SSH](#ssh)
    - [GPG](#gpg)
  - [Mise à jour de la configuration](#mise-à-jour-de-la-configuration)
    - [Mise à jour via Github Action](#mise-à-jour-via-github-action)
    - [Mise à jour manuelle](#mise-à-jour-manuelle)
  - [Configuration initiale](#configuration-initiale)
    - [Provision du server](#provision-du-server)
    - [Déclaration de l'environnement](#déclaration-de-lenvironnement)
  - [Release](#release)
    - [Release Reverse Proxy](#release-reverse-proxy)
    - [Release Application](#release-application)
    - [Release Manuellement](#release-manuellement)
  - [Deploiement de l'application](#deploiement-de-lapplication)
    - [Deploiement via Github Action](#deploiement-via-github-action)
    - [Déploiement Manuel](#déploiement-manuel)
  - [Gestion des habiliatations](#gestion-des-habiliatations)
    - [Ajout d'un utilisateur](#ajout-dun-utilisateur)
    - [Suppression d'un utilisateur](#suppression-dun-utilisateur)
  - [Gestion des secrets](#gestion-des-secrets)
    - [Création du vault](#création-du-vault)
    - [Edition du vault](#edition-du-vault)
    - [Variables du vault](#variables-du-vault)
    - [Résolution des conflits](#résolution-des-conflits)
  - [Operations sur le serveur](#operations-sur-le-serveur)

## Prérequis

### Environnement local

Contient l'ensemble des données sensibles nécessaires à la mise en place de
l'application.

- Ansible 2.7+: `brew install ansible`
- sshpass
  ```bash
  brew tap esolitos/ipa
  brew install esolitos/ipa/sshpass
  ```
- pwgen: `brew install pwgen`
- bash 5+: `brew install bash`

**Fichier disponible seulement aux personnes habilitées**

- .vault-password.gpg
- habilitations.yml

### SSH

Pour avoir accès aux serveurs, vous devez avoir une clé SSH, si ce n'est pas le cas, vous pouvez suivre le tutorial
suivant : https://docs.github.com/en/authentication/connecting-to-github-with-ssh

Cette clé devra etre ajoutée sur [votre profile Github](https://github.com/settings/keys) et communiquée à votre èquipe afin que vos accès au serveur soient créés.

### GPG

Veuillez suivre les instructions dans le [README principal](../../README.md#gpg)

## Mise à jour de la configuration

**Important:** Cette section décris comment mettre à jour l'infrastructure sur un environnement existant suite à des changements des playbooks Ansible. Pour la configuration initiale veuillez vous référer à la section [Configuration initiale](#configuration-initiale).

### Mise à jour via Github Action

La mise à jour dépend de l'etat local de votre environnement, il est recommandé de mettre à jour l'environnement via la Github Action `Setup` qui peut etre lancée depuis l'interface Github.

### Mise à jour manuelle

Il est possible de mettre à jour et déployer uniquement la partie applicative de l'application en lançant le script

```bash
yarn deploy <nom_environnement> --user <nom_utilisateur>
yarn deploy <nom_environnement> --extra-vars=app_version=<app_image_version> --user <nom_utilisateur>
```

Pour information si votre utilisateur local porte le même nom que l'utilisateur distant alors `--user` n'est pas
nécessaire.

## Configuration initiale

**Important:** Cette section décris comment installer l'infrastructure sur un nouvel environnement. Pour la mise à jour de celui-ci, veuillez vous référer à la section [Mise à jour de la configuration](#mise-à-jour-de-la-configuration).

### Provision du server

TODO: See infra repo

### Déclaration de l'environnement

Le fichier `/env.ini` définit les environnements de l'application. Il faut donc ajouter le nouvel environnement
dans ce fichier en renseignant les informations suivantes :

```ini
[<nom de l'environnement>]
<IP>
[<nom de l'environnement>:vars]
dns_name=bal-<nom de l'environnement>.apprentissage.beta.gouv.fr
host_name=bal-<nom de l'environnement>
env_type=recette
```

Pour information, vous pouvez obtenir l'adresse ip du vps en consultant les emails de
service : https://www.ovh.com/manager/dedicated/#/useraccount/emails

Editer le vault pour créer les env-vars liés à ce nouvel environnement (cf: [Edition du vault](#edition-du-vault))

Vous pouvez maintenant poursuivre avec le [Deploiement de l'application](#deploiement-de-lapplication).

## Release

### Release Reverse Proxy

Le reverse_proxy doit etre release mauellement pour tout changement du dossier `reverse_proxy`. Pour cela, veuillez vous référer à la section [Release Manuellement](#release-manuellement)

### Release Application

La création de release dépend de l'etat local de votre environnement, il est recommandé d'utiliser les releases créés automatiquement pour tout commit sur `main` via la Github Action `Release version`.

Si vous souhaitez effectuer une release manuelle veuillez vous référé à la section suivante.

### Release Manuellement

Pour créer une nouvelle version stable veuillez utiliser la commande suivante:

```bash
yarn release:images
```

Le script vous demandera si vous souhaitez créer et pousser les images pour "Reverse Proxy" et "App". Pour chaque image, il vous proposera automatiquement la prochaine version patch selon le versioning sémantique, mais vous pourrez également saisir une version personnalisée si vous le souhaitez.

Après avoir sélectionné les versions, le script vous demandera de confirmer vos choix. Ensuite, il vous demandera vos identifiants GitHub (nom d'utilisateur et token personnel) pour se connecter au registre Docker.

Une fois connecté, le script construira et poussera les images Docker locales sur le registre GitHub en utilisant les versions sélectionnées.

**Note :** Si vous ne souhaitez pas créer et pousser une image particulière, vous pouvez simplement répondre "n" lorsque le script vous le demande.

## Deploiement de l'application

### Deploiement via Github Action

Le déploiement dépend de l'etat local de votre environnement, il est recommandé de mettre à jour l'environnement via la Github Action `Deployment` qui peut etre lancée depuis l'interface Github.

### Déploiement Manuel

```bash
yarn deploy <nom-de-lenvironnement> --user <nom_utilisateur>
```

**Note:** La version déployée sera celle défini dans votre `.infra/env.ini` local.

## Gestion des habiliatations

### Ajout d'un utilisateur

Il est possible d'ajouter ou de supprimer des habilitations en éditant le
fichier `vault/habilitations.yml`. Tous les utilistateurs présents dans ce fichier pourront se
connecter aux environnements via leurs clés SSH. Ils pourront également accéder au vault et déchiffrer les backups des
environnements si une clé GPG est fournie.

Une habilitation doit être de la forme suivante :

```yml
- username: <nom de l'utilisateur sur l'environnement>
  name: <nom de la personne>
  gpg_key: <identifiant de la clé GPG> (optionnel)
  authorized_keys: <Liste des clés SSH> (il est possible de mettre une url github)
```

Une fois le fichier des habilitations mis à jour, vous devez renouveler le vault et relancer la configuration de
l'environnement.

```bash
  .infra/scripts/vault/renew-vault.sh
  mna-bal infra:setup <nom_environnement> --user <nom_utilisateur>
```

Ensuite il vous faudra mettre à jour les fichiers `habilitations.yml` & `.vault-password.gpg` dans 1Password.

### Suppression d'un utilisateur

Pour supprimer une personne des habilitations, il faut :

- enlever les informations renseignées à son sujet dans le fichier `vault/habilitations.yml`

Une fois ces fichiers mis à jour, vous devez renouveler le vault et lancer la commande de nettoyage :

```bash
  mna-bal infra:vault:renew
  mna-bal infra:user:remove <nom_environnement> --user <votre_nom_utilisateur> --extra-vars "username=<nom_utilisateur_a_supprimer>"
```

Ensuite il vous faudra mettre à jour les fichiers `habilitations.yml` & `.vault-password.gpg` dans 1Password.

## Gestion des secrets

Il est vivement recommander de stocker toutes les variables d'environnement sensibles (ex: token) dans un vault Ansible.
Le fichier `.infra/vault/vault.yaml` contient déjà les données jugées sensibles.

### Création du vault

Dans un premier temps, vous devez générer le mot de passe du vault. Ce mot de passe sera chiffré via GPG et pourra
uniquement être obtenu par les personnes listées dans le fichier `vault/habilitations.yml`

Pour se faire, lancez la commande suivante :

```bash
  mna-bal infra:vault:generate
```

Cette commande va créer le fichier `vault/.vault-password.gpg`, vous devez le commiter.

Le mot de passe contenu dans ce fichier va permettre de chiffrer le ficihier `vault.yml`. Pour se
faire, il faut lancer la commande suivante :

```bash
  mna-bal infra:vault:encrypt
```

Le script va utiliser votre clé GPG et probablement vous demander votre passphrase. Il va ensuite chiffrer le
fichier `vault/vault.yml`.

```yaml
$ANSIBLE_VAULT;1.2;AES256;mnaprojectname_ansible_secret
3566.....
....
```

Vous devez commiter le fichier chiffré.

### Edition du vault

Si vous voulez éditer le vault, le plus simple est d'utiliser un plugin pour votre IDE

- vscode : [https://marketplace.visualstudio.com/items?itemName=dhoeric.ansible-vault]()
- intellij idea : [https://plugins.jetbrains.com/plugin/14278-ansible-vault-editor]()

Quand vous allez ouvrir le fichier, un mot de passe vous sera demandé. Pour l'obtenir, executez la commande suivante

```bash
yarn vault:password
```

Vous pouvez également éditer directement le fichier en ligne de commande sans afficher en clair le mot de passe :

```bash
   EDITOR=vim yarn vault:edit
   ou
   EDITOR="code -w" yarn vault:edit
```

> Par défaut le script utilisera `code -w` si `$EDITOR` n'est pas défini

### Variables du vault

Toutes les variables du vault sont préfixées par `vault`

```yaml
vault:
  APP_VERSION: "1.0.0"
  APP_ENV: "recette"
```

Pour y faire référence dans un fichier il suffit d'utiliser la syntaxe `{{ vault.APP_VERSION }}`

Pour créer une variable spécifique à un environnement, le plus simple est d'ajouter une section dans le vault :

```yaml
vault:
  APP_VERSION: "1.0.0"
  production:
    APP_ENV: "production"
  recette:
    APP_ENV: "recette"
```

Pour référencer cette variable dans un fichier, il faut utiliser la syntaxe `{{ vault[env_type].APP_ENV }}`
La variable `env_type` qui est définie dans le fichier `env.ini` sera automatiquement valorisée en fonction de
l'environnement cible.

### Résolution des conflits

Pour résoudre les conflits git sur le vault, il est possible de configurer git avec un mergetool custom. L'idée du custom merge tool est de décrypter le fichier pour appliquer le merge automatique de fichier.

Pour l'installer il faut exécuter les commandes suivantes

```bash
git config --local merge.ansible-vault.driver ".bin/scripts/merge-vault.sh %O %A %B"
git config --local merge.ansible-vault.name "ansible-vault merge driver"
git config --local ansible-vault decrypt --vault-password-file='.bin/scripts/get-vault-password-client.sh' --output -"
git config --local diff.ansible-vault.cachetextconv "false"
```

Ensuite lors du merge, vous serez invité à entrer votre passphrase (3 fois) pour décrypter les fichiers (distant, local et resultat). Il sera également affiché un le `git diff` dans le stdout.

```bash
git merge main
```

## Operations sur le serveur

Il est parfois nécessaire de se connecter directement au serveur pour executer certaines operations de maintenance:

- SSH in
- Check CRONs
- Fluentd logs
- GPG
- Ban IP
- Maintenance
- BAckups
- Tail logs
- Reload containers
- Wait for deployments
- Checks service statuses
- CRONs monitoring
