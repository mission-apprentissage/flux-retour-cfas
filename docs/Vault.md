## VAULT

Le vault ansible `./infra/vault/vault.yml` contient les variables d'environnement du server et de l'ui. Le vault est séparé par environnements:

- `production` : environnement de production
- `recette` : environnement de recette
- `preview` : environnement de prévisualisation
- `local` : environnement de développement local

## Vault édition

Édition du vault ansible.

```bash
  yarn vault:edit
```

## Vault git diff & merge

Pour résoudre les conflits git sur le vault, il est possible de configurer git avec un mergetool custom. L'idée du custom merge tool est de décrypter le fichier pour appliquer le merge automatique de fichier.

Pour l'installer il faut exécuter les commandes suivantes

```bash
git config --local merge.merge-vault.driver ".bin/scripts/merge-vault.sh %O %A %B"
git config --local merge.merge-vault.name "ansible-vault merge driver"
git config --local diff.diff-vault.textconv "ansible-vault decrypt --vault-password-file='.bin/scripts/get-vault-password-client.sh' --output -"
git config --local diff.diff-vault.cachetextconv "false"
```

Ensuite lors du merge, vous serez invité à entrer votre passphrase (3 fois) pour décrypter les fichiers (distant, local et resultat). Il sera également affiché un le `git diff` dans le stdout.

```bash
git merge master
```
