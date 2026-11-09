import { lireFichierEffectifs } from "./lectureFichierEffectifs";

self.onmessage = (event: MessageEvent<{ contenu: ArrayBuffer; nomFichier: string; maximumLignes: number }>) => {
  const { contenu, nomFichier, maximumLignes } = event.data;
  self.postMessage(lireFichierEffectifs(contenu, nomFichier, { maximumLignes }));
};
