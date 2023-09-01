# Securité

## Secrets

Les secrets ne **doivent** jamais etre commit en clair dans le repository. Dans le cas, où cela arriverait veuillez en informer l'équipe dans les plus brefs délais.

Les secrets sont chiffré via GPG, et stockés dans le vault. Veuillez consulter la doc [Gestion des secrets](./infrastructure/manage.md#gestion-des-secrets)

## Habilitations

Les accès SSH et la possibilité de dechiffrer le vault sont gérés dans le fichier `.infra/vault/habilitations.yml`.

Veuillez consulter la doc [Gestion des habiliatations](./infrastructure/manage.md#gestion-des-habiliatations)

## Fail2Ban

Un mécanisme de banissement d'IP est mis en place dans le dossier :

- `.infra/playbooks/roles/setup/files/fail2ban`

Pour en savoir plus sur le fail2ban et sa configuration : https://doc.ubuntu-fr.org/fail2ban.

Ce mécanisme se charge de notifier dans une channel Slack lorsqu'une IP est bannie ou débannie.

Pour mettre en place les notifications Slack il est nécessaire d'utiliser les Webhooks et de créer une chaine dédiée
dans votre espace de travail Slack.

Il vous faudra créer une application dans Slack et récupérer le lien de la Webhook, pour en savoir
plus : https://api.slack.com/messaging/webhooks.

Une fois le lien de la Webhook récupéré il faudra stocker l'information dans le vault (`SLACK_WEBHOOK_URL`).
