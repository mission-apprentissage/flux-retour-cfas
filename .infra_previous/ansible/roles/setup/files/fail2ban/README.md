# Fail2Ban

Ce module permet la mise en place d'une politique de fail2ban sur le serveur déployé.

_Plus d'informations ici : https://doc.ubuntu-fr.org/fail2ban_

## Configuration

Définie dans le dossier `jail.d` dans les fichiers :

- `nginx.local`
- `sshd.local`

## Filtres

On ajoute 2 moyens de détections dans le dossier `filter.d` dans les fichiers :

- `nginx-conn-limit.conf`
- `nginx-req-limit.conf`
