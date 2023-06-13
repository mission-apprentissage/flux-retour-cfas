# Déploiement & Infrastructure de Partage Simplifié

- [Prérequis](#prérequis)
  - [SSH](#ssh)
  - [GPG](#gpg)
  - [Organisation des dossiers](#organisation-des-dossiers)
- [Etape 1 : Configuration initiale](#configuration-initiale)
- [Etape 2 : Lancement du playbook Ansible](#lancement-du-playbook-ansible)
- [Etape 3 : Configuration OVH](#configuration-ovh)
- [Utilitaires](#utilitaires)
  - [Mise à jour et déploiement de l'application](#mise-à-jour-et-déploiement)
  - [Requêtage de la base MongoDb](#Requetes-sur-la-base-mongodb)
  - [Sauvegarde & restauration](#sauvegarde-&-restauration)
    - [Sauvegarde & restauration de la base Mongodb](#sauvegarde-&-restauration-de-la-base-mongodb)
    - [Sauvegarde complète cryptée](#sauvegarde-complète-cryptée)
    - [Sauvegarde complète non cryptée](#sauvegarde-complète-non-cryptée)
    - [Restauration de dump complet crypté](#restauration-de-dump-complet-crypté)
    - [Sauvegarde & Restauration de Metabase](#sauvegarde-&-restauration-de-metabase)
  - [Suppression d'un utilisateur de la VM](#supprimer-un-utilisateur-de-la-vm)
  - [Fermeture du service](#fermeture-du-service)
  - [Mode maintenance](#mode-maintenance)

## Prérequis

- Ansible 2.7+
- VPS Ubuntu chez OVHCloud
- Vagrant 2.2+ (optionnel)
- VirtualBox 5+ (optionnel)

Ce repository permets de créer et déployer l'ensemble de l'infrastructure de la plateforme partage simplifié.

Le repository infra est privé car il est contient l'ensemble des données sensibles nécessaires à la mise en place de
l'application. Ce projet utilise Ansible 2.7+ pour configurer et déployer l'application.

### SSH

Pour utiliser le projet infra, vous devez avoir une clé SSH, si ce n'est pas le cas, vous pouvez suivre le tutorial
suivant : https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### GPG

Pour utiliser le projet infra, vous devez avoir une clé GPG, si ce n'est pas le cas, vous pouvez en créer une via la
commande :

```bash
 bash scripts/create-gpg-key.sh <prénom> <nom> <email>
```

Une fois terminé, le script va vous indiquer l'identifiant de votre clé GPG. Afin qu'elle puisse être utilisée au sein
de la mission apprentissage, vous devez publier votre clé :

```bash
gpg --send-key <identifiant>
```

Il est conseillé de publier votre clé sur le serveur suivant : (elles pourront être récupérées par le reste de l'équipe via une commandé spécifique)

```bash
gpg --keyserver keyserver.ubuntu.com --send-keys <GPG_KEY>
```

Il est vivement conseillé de réaliser un backup des clés publique et privée qui viennent d'être créés.

```bash
gpg --export <identifiant> > public_key.gpg
gpg --export-secret-keys <identifiant> > private_key.gpg
```

Ces deux fichiers peuvent, par exemple, être stockés sur une clé USB.

### Organisation des dossiers

Ce repository est organisé de la manière suivante :

```
    |-- ansible
        |-- roles
            |-- deploy
                |-- ... (fichiers de déploiement)
            |-- setup
                |-- ... (fichiers de setup)
        |-- test
        |-- deploy.yml
        |-- env.ini
        |-- setup.yml
    |-- scripts
        |-- ovh
        |-- vault
        |-- ... (scripts divers)
        |-- setup-vm.sh
        |-- deploy-app.sh

```

Le dossier `ansible` va contenir l'ensemble des données nécessaire au Playbook.

Pour en savoir plus sur le fonctionnement d'Ansible : https://www.ansible.com/resources/get-started

Le dossier `scripts` va contenir un ensemble de commandes Bash permettant de réaliser des actions sur l'infrastructure du projet :

- `/scripts/setup-vm.sh` permet de configurer la machine pour la convertir en environnement (apt-get, users, app)
- `/scripts/deploy-app.sh` permet uniquement de mettre à jour et déployer la partie applicative
- `/scripts/clean.sh` permet de supprimer les ressources non nécessaires - à savoir l'user défaut ubuntu
- `/scripts/remove-user.sh` permet de supprimer user présent dans les users de la VM
- `/scripts/ovh` contient un ensemble de scripts propre à l'hébergeur OVH
- `/scripts/vault` contient un ensemble de scripts propre à la gestion du vault

## Configuration initiale

### 1. Paramétrage de l'email Devops pour génération du certificat SSL

Afin de générer un certificat SSL il est nécessaire de préciser une adresse email dans le fichier : `/ansible/roles/setup/files/app/tools/ssl/certbot/app/entrypoint.sh`

- Ici il s'agit de `misson.apprentissage.devops@gmail.com` (il y a bien une coquille dans le nom c'est normal)

### 2. Ajout de votre Clé SSH

Afin de pouvoir accéder à la VM sous votre nom d'utilisateur il est nécessaire de modifier le fichier de déploiement du playbook Ansible suivant :
`/ansible/roles/deploy/tasks/main.yml` :

```yml
- include: create-sudoers.yml
  with_items:
    - { username: "<nom_utilisateur>", authorized_key: "ssh-rsa <clé_ssh_personnelle>" }
```

A vous de saisir votre nom d'utilisateur et votre clé SSH.

Si vous souhaitez ajouter des utilisateurs vous pouvez étendre la liste.

### 3. Création des environnements (VPS) sous OVHCloud

L'application `partage-simplifie` est déployée sur OVH sur des VPS dédiés.

#### 3.1 Création des VPS

Se référer à la documentation OVHCloud pour créer 1 VPS par environnement souhaité (recette / production).
Une fois les VPS créés vous recevrez par email l'IP et le login/mdp du compte root par défaut (ubuntu)

#### 3.2 Ajout au known_hosts & Connexion en SSH

Pour vérifier la bonne configuration par OVH de votre VPS et ajouter les ips à votre fichier known_hosts il est nécessaire s'y connecter en ssh il faut passer par l'user root (ubuntu) créé par défaut et l'ip de la machine créé.

La commande de connexion en SSH est la suivante :

```sh
sudo ssh ubuntu@<ip_de_la_vm>
```

Si vous arrivez à vous connecter en SSH avec l'user root (ubuntu) sur la VM alors tout est en ordre pour les étapes suivantes.

#### 3.4 Changement du nom de la VM -- Optionnel

Il est recommandé de changer le nom de vos VMs pour plus de visibilité.

```sh
hostnamectl set-hostname <nouveau_nom>
```

Il vous sera demandé de choisir une authentification, puis vous pourrez vérifier le changement de nom via :

```sh
hostnamectl
```

### 4. Mapping DNS & IP

Avant de lancer le playbook, si vous avez configuré un DNS spécifique par environnement il est nécessaire de créer des entrées avec les IPs des VMs que vous venez de créer.

Exemple avec `partage-simplifie.apprentissage.beta.gouv.fr` et l'IP `12.34.56.78` sur la plateforme AlwaysData :

- Ajouter une entrée de type A au domaine apprentissage.beta.gouv.fr
- Spécifier le nom d'hote : `partage-simplifie`
- Ajouter l'IP en valeur : `12.34.56.78`
- Laisser le TTL à 300

### 5. Configuration des environnements Ansible (IP & branches git)

Le fichier `/ansible/env.ini` permets de gérer le déploiement de l'application sur les différents environnements.

Il est donc nécessaire après création des VMs dans OVH de remplir ce fichier avec les bonnes informations des serveurs et de préciser les branches de déploiement liées à chaque environnement.

### 6. Création d'un channel Slack dédié pour l'alerting

Si vous souhaitez configurer l'alerting via un channel dédié dans Slack, il est nécessaire de créer un WebHook dans votre espace Slack, cf. https://slack.com/intl/fr-fr/help/articles/115005265063-Webhooks-entrants-pour-Slack

Une fois l'application créé dans Slack et un WebHook créé, il est nécessaire de copier le lien de ce WebHook dans la variable PARTAGE_SIMPLIFIE_SLACK_WEBHOOK_URL (dans tous les fichiers docker-compose de chaque environnements).

### 7. Vault Ansible

Il est vivement recommander de stocker toutes les variables d'environnement sensibles (ex: token) dans un vault Ansible.
Le fichier `ansible/roles/setup/vars/main/vault.yml` contient déjà les données jugées sensibles.

#### Création du vault

Dans un premier temps, vous devez générer le mot de passe du vault. Ce mot de passe sera chiffré via GPG et pourra
uniquement être obtenu par les personnes listées dans le fichier `ansible/roles/setup/vars/main/habilitations.yml`

Pour ce faire, lancez la commande suivante :

```bash
  bash scripts/vault/generate-vault-password.sh
```

Cette commande va créer le fichier `ansible/.vault-password.gpg`, vous devez le commiter.

En cas d'erreur du type `gpg: keyserver receive failed: No data` essayez d'importer localement des clés GPG de chaque utilisateur via :

```bash
  gpg --keyserver keyserver.ubuntu.com --recv-keys <GPG_KEY_1> <GPG_KEY_2> ...
```

Le mot de passe contenu dans ce fichier va permettre de chiffrer le fichier `vault.yml`. Pour se
faire, il faut lancer la commande suivante :

```bash
  bash scripts/vault/encrypt-vault.sh
```

Le script va utiliser votre clé GPG et probablement vous demander votre passphrase. Il va ensuite chiffrer le
fichier `ansible/roles/setup/vars/main/vault.yml`.

```yaml
$ANSIBLE_VAULT;1.2;AES256
35666561666439633062623165373337393866316362653032656134366565376434383739646163
....
```

Vous devez commiter le fichier chiffré.

#### Edition du vault

Si vous voulez éditer le vault, le plus simple est d'utiliser un plugin pour votre IDE

- vscode : [https://marketplace.visualstudio.com/items?itemName=dhoeric.ansible-vault]()
- intellij idea : [https://plugins.jetbrains.com/plugin/14278-ansible-vault-editor]()

Quand vous allez ouvrir le fichier, un mot de passe vous sera demandé. Pour l'obtenir, executez la commande suivante

```bash
  bash scripts/vault/get-vault-password-client.sh
```

Vous pouvez également éditer directement le fichier en ligne de commande sans afficher en clair le mot de passe :

```bash
   EDITOR=vim bash scripts/vault/edit-vault.sh
   ou
   EDITOR="code -w" bash scripts/vault/edit-vault.sh
```

#### Variables du vault

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

### 8. Habilitations

#### Ajout d'un utilisateur

Il est possible d'ajouter ou de supprimer des habilitations en éditant le
fichier `ansible/roles/setup/vars/main/habilitations.yml`. Tous les utilisateurs présents dans ce fichier pourront se
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
  bash scripts/vault/renew-vault.sh
  bash scripts/setup.sh <nom_environnement> --user <nom_utilisateur>
```

#### Suppression d'un utilisateur

Pour supprimer une personne des habilitations, il faut :

- enlever les informations renseignées à son sujet dans le fichier `ansible/roles/setup/vars/main/habilitations.yml`
- ajouter le username de la personne dans le fichier `ansible/roles/clean/tasks/main.yml`

Une fois ces fichiers mis à jour, vous devez renouveler le vault et lancer la commande de nettoyage :

```bash
  bash scripts/vault/renew-vault.sh
  bash scripts/clean.sh <nom_environnement> --user <nom_utilisateur>
```

## Lancement du playbook Ansible

### 1. Vérification des environnements

Les différents environnements sont gérés dans le fichier `ansible/env.ini`.

Le playbook Ansible fonctionne en récupérant ce fichier `ansible/env.ini` en argument pour créer et configurer les ressources pour chaque environnement.

Veuillez vérifier avant de lancer le playbook que ce fichier contient tous les environnements souhaités. Il faut donc ajouter le nouvel environnement dans ce fichier en renseignant les informations suivantes :

```
[<nom de l'environnemnt>]
<IP>
[<nom de l'environnemnt>:vars]
dns_name=<nom de l'application>.apprentissage.beta.gouv.fr
host_name=<nom de la machine (ex: mna-catalogue-production)>
update_sshd_config=true
git_revision=master
env_type=production

```

Pour information, vous pouvez obtenir l'adresse ip du vps en consultant les emails de
service : https://www.ovh.com/manager/dedicated/#/useraccount/emails

### 2. Execution du playbook Ansible

Il faut ensuite lancer le playbook Ansible **en étant sudo** avec l'utilisateur par défaut (ubuntu):

```
bash setup-vm.sh <nom_environnement> --user ubuntu --ask-pass
```

Lors de la première execution on vous demandera le mot de passe de l'utilisateur ubuntu.
Puis on vous redemandera le BECOME PASSWORD[defaults to SSH password] qui est le même password.

Attention si vous voulez lancer le playbook avec un utilisateur autre que celui par défaut, utilisez --ask-become-pass

```
ssh-keyscan <ip> >> ~/.ssh/known_hosts
bash setup-vm.sh <nom_environnement> --user <nom_utilisateur> --ask-become-pass
```

Ensuite le script vous demandera : `BECOME password:`, il s'agit du mot de passe sudo de votre utilisateur.
En enfin le script vous demandera votre passphrase SSH.

**Il est possible d'ajouter le mode verbose à Ansible en ajoutant à la fin de votre commande le tag `-vvv`**
Ex :

```
bash setup-vm.sh <nom_environnement> --user <nom_utilisateur> --ask-become-pass -vvv
```

Une fois le playbook terminé et lancé avec succès vous devriez voir un message vous indiquant que tout s'est déroulé avec succès.

### 3. Changement du mot de passe utilisateur

Une fois le playbook terminé, **il est nécessaire pour chaque utilisateur défini dans le playbook de changer son mot de passe**.

On vous demandera votre mot de passe actuel pour en définir un nouveau, par défaut le mot de passe de chaque utilisateur est `mission-apprentissage`.

### 4. Nettoyage des ressources

Une fois le playbook terminé, il est recommandé de supprimer l'utilisateur défaut Ubuntu via le script `/scripts/clean.sh` en spécifiant l'environnement souhaité.

Ce script va lancer un playbook de nettoyage des ressources. Attention à bien lancer ce script avec un user différent du user ubuntu qui lui sera supprimé !

```sh
bash clean.sh <nom_environnement> --user <nom_utilisateur> --ask-become-pass
```

### Accès à l'application

**L'application est disponible via l'url publique définie dans la variable d'environnement `PARTAGE_SIMPLIFIE_URL` ou le DNS spécifié dans le fichier env.ini (qui doivent être identiques).**

### (_Optionnel_) - Tester les playbook Ansible

Il est possible de tester le playbook Ansible en utilisant Vagrant et VirtualBox.
Une fois ces deux outils installés, il faut lancer la commande :

```sh
cd ansible/test
bash run-playbook-tests.sh
```

Ce script va créer une machine virtuelle dans VirtualBox et exécuter le playbook sur cette VM.
Il est ensuite possible de se connecter à la machine via la commande :

```sh
vagrant ssh
```

## Configuration OVH

Cette étape est nécessaire pour configurer les éléments propres à l'hébergement OVH pour l'application.
L'ensemble des scripts nécessaires à cette étape sont présents dans le répertoire `/scripts/ovh`

### 1. Ping API OVH

Pour vérifier que l'API d'OVH est joignable il faut executer :

```
bash ping-ovh-api.sh
```

### 2. Ajouter un disque de sauvegarde externe

Il est possible d'ajouter un disque externe permettant de sauvegarder l'ensemble des données de l'application. Pour se
faire, il faut la commande suivante

```sh
bash scripts/ovh/create-backup-partition.sh <nom de l'environnement>
```

Lors de l'exécution de ce script, vous serez redirigé vers une page web vous demandant de vous authentifier afin de
générer un jeton d'api. Vous devez donc avoir un compte OVH ayant le droit de gérer les instances de la Mission
apprentissage. Une fois authentifié, le script utilisera automatiquement ce jeton.

Quand le script est terminé, vous pouvez aller sur l'interface
OVH [https://www.ovh.com/manager/dedicated/#/nasha/zpool-128310/partitions](https://www.ovh.com/manager/dedicated/#/nasha/zpool-128310/partitions)
afin de vérifier que la partition est bien créée.

- Dans le fichier `ansible/env.ini`, vous devez ensuite ajouter la nom de la partition pour l'environnement :

```
backup_partition_name=<nom de la partition>
```

- Relancer le `setup-vm.sh` afin d'appliquer les modifications sur le serveur.

Il est aussi possible de créer le disque de sauvegarde depuis l'interface d'OVH

### 3. Création du firewall

Pour créer et configurer le firewall par défaut OVH sur un environnement il faut executer :

```
bash create-firewall.sh <environnement>
```

## Utilitaires

### Mise à jour et déploiement

Il est possible de mettre à jour et déployer uniquement la partie applicative de l'application en lançant le script

```
bash deploy.sh <nom_environnement> --user <nom_utilisateur> --ask-become-pass
```

Attention si vous utilisez l'utilisateur défaut d'OVH : Ubuntu il faudra remplacer --ask-become-pass par --ask-pass

```
bash deploy.sh <nom_environnement> --user <nom_utilisateur> --ask-pass
```

Si vous avez supprimé l'utilisateur _ubuntu_ il faudra donc spécifier un utilisateur ayant les droits de sudo pour lancer le playbook.

### Requetes sur la base MongoDb

Il est possible de requêter la base de données MongoDb directement depuis la VM en utilisant le script `/ansible/roles/setup/files/app/tools/mongodb/connect-to-mongodb.sh`

```
cd /opt/app/tools/mongodb
bash connect-to-mongodb.sh
```

Une fois le script executé on passe en mode mongoShell et il est possible d'écrire des requêtes sur la base de données par exemple :

```mongoShell
db.collection.find({});
```

### Sauvegarde & restauration

#### Sauvegarde & restauration de la base MongoDb

Il est possible de sauvegarder et restaurer la base de données MongoDb directement depuis la VM en utilisant les scripts présents dans

- `/ansible/roles/setup/files/app/tools/mongodb/backup/` pour la sauvegarde
- `/ansible/roles/setup/files/app/tools/mongodb/restore/` pour la restauration des données

#### Sauvegarde complète cryptée

Il est possible de créer un dump de sauvegarde crypté à la date du jour via :

```
bash backup-mongodb.sh
```

Les backups sont automatiquement sauvegardés en local dans le dossier `/opt/app/backups/mongodb` et dans le NAS qui est monté sur le dossier `/mnt/backups/mongodb`.
Une fonction de purge automatique des sauvegardes de plus de 7 jours **en local** est executée.
Le cryptage du dump est executé via age, et la clé de cryptage est propre à la VM.

#### Sauvegarde complète non cryptée

Il est possible de créer un dump de sauvegarde complète à la date du jour via :

```
bash /legacy/backup-legacy-mongodb-move-to-folder.sh <cheminDump>
```

Ce script va créer un dump contenant l'intégralité de la base et déplacer le dump vers le chemin précisé (ex : /home/moi)
**Une fois la sauvegarde faite il est possible de récupérer le dump via SCP par exemple pour l'exploiter en local ou autre...**

#### Restauration de dump complet crypté

Il est possible de restaurer un dump de sauvegarde crypté via :

```
bash restore-mongodb.sh <nomDuDump>
```

Ce script va décrypter le dump dont le nom a été fourni et restaurer l'intégralité des données.

#### Sauvegarde & restauration de Metabase

Il est possible de sauvegarder / restaurer le contenu du volume METABASE via :

- `/ansible/roles/setup/files/app/tools/metabase/backup-metabase.sh` pour la sauvegarde
- `/ansible/roles/setup/files/app/tools/metabase/restore-metabase.sh` pour la restauration

### Supprimer un utilisateur de la vm

Il est possible de supprimer un utilisateur sur la VM en jouant le script `remove-user.sh` via :

```
bash remove-user.sh <environnement> -e "username=<userToRemove>" --user <user> --ask-become-pass
```

### Fermeture du service

Il est possible de clôturer l'accès au service (fermeture des ports 80 & 443) en executant :

```
bash close-service.sh <environnement>

```

### Mode maintenance

Il est possible d'activer ou de désactiver un mode maintenance de l'application.

Ce mode affichera une page statique (présente dans le conteneur **partage_simplifie_reverse_proxy** dans `/etc/nginx/html/maintenance.html`) à tous les utilisateurs exceptés les développeurs dont l'IP est présente dans la liste des IPs autorisées (dans `/etc/nginx/conf.d/ips/maintenance_ips.conf`)

Pour l'activation :

```
bash /maintenance/maintenance-on.sh

```

Pour la désactivation :

```
bash /maintenance/maintenance-off.sh

```
