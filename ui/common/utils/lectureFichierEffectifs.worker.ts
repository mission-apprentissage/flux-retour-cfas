import { lireFichierEffectifs } from "./lectureFichierEffectifs";

self.postMessage({ type: "demarre" });

self.onmessage = (event: MessageEvent<{ contenu: ArrayBuffer; nomFichier: string; maximumLignes: number }>) => {
  const { contenu, nomFichier, maximumLignes } = event.data;
  self.postMessage({ type: "resultat", resultat: lireFichierEffectifs(contenu, nomFichier, { maximumLignes }) });
};
