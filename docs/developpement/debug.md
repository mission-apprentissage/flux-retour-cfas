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
