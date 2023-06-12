# Stack de développement du tableau de bord de l'apprentissage

> Documentation et outils pour installer un environnement de développement rapidement.

La stack de développement se compose des services suivants :

- les services TDB : UI, Server
- [traefik](https://github.com/traefik/traefik) : reverse proxy qui s'occupe aussi de la gestion du TLS
- [mailpit](https://github.com/axllent/mailpit) : serveur SMTP et interface web pour consulter les emails en développement
- [mongodb](https://github.com/mongodb/mongo) : base de données utilisée pour les données du TDB
- [clamav](https://github.com/Cisco-Talos/clamav) : antivirus permettant de scanner les fichiers téléversés sur le TDB

## Installation

### Prérequis

Les prérequis suivants sont nécessaires à l'installation de l'environnement de développement :

- Installer Node 18 et pnpm 8 (`npm install -g pnpm@8`)
- Installer Docker avec le plugin compose (inclus dans Docker Desktop, pas besoin de docker-compose)
- Installer Git
- Installer [mkcert](https://github.com/FiloSottile/mkcert) pour utiliser du HTTPS en développement.
  <details>
    <summary>Étapes sous linux</summary>

  > ```sh
  > sudo wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 -O/usr/local/bin/mkcert
  > sudo chmod +x /usr/local/bin/mkcert
  > ```

  </details>
   <details>
    <summary>Étapes sous Windows / macOS</summary>

  > Voir https://github.com/FiloSottile/mkcert/releases/tag/v1.4.4

  </details>

### Initialisation

- Cloner ce projet puis rentrer dans le dossier du projet.

```sh
git clone git@github.com:mission-apprentissage/flux-retour-cfas.git tableau-de-bord
cd tableau-de-bord
```

- Si ce n'est pas déjà fait, installer l'autorité racine de _mkcert_ puis redémarrer votre navigateur.

```sh
# cette commande va générer une autorité racine dans ~/.local/share/mkcert/rootCA.pem
mkcert -install
```

- Générer le certificat pour le DNS de développement.

```sh
mkcert -cert-file traefik/certs/tdb.local.crt -key-file traefik/certs/tdb.local.key tdb.local
```

- Éditer le fichier `/etc/hosts` (Windows : `C:\windows\system32\drivers\etc\hosts`) pour y configurer les DNS de développement.

```
127.0.0.1 tdb.local
```

- Démarrer les conteneurs Docker

```sh
docker compose up -d
```

- Installer les dépendances des projets

```sh
pnpm i
```

- Initialiser la BDD

```sh
cd server
cp .env.local .env
pnpm -F server run migration:up
pnpm -F server run cli indexes:create
pnpm -F server run cli init:dev
```

### Lancement

Lancer l'UI et le serveur :

```sh
pnpm start
```

### Lint

```sh
pnpm lint
```

### Tests

```sh
pnpm test
```
