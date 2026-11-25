export async function traiterEnParallele<T>(
  source: Iterable<T> | AsyncIterable<T>,
  {
    concurrence,
    traiter,
    surErreur,
  }: {
    concurrence: number;
    traiter: (element: T) => Promise<void>;
    surErreur: (erreur: unknown, element: T) => void;
  }
): Promise<void> {
  if (!Number.isInteger(concurrence) || concurrence < 1) {
    throw new Error(`traiterEnParallele : concurrence invalide (${concurrence}), au moins 1 attendu`);
  }

  const enCours = new Set<Promise<void>>();
  let liberer: (() => void) | null = null;
  let erreurDeSurErreur: { erreur: unknown } | null = null;

  const lancer = (element: T) => {
    const tache: Promise<void> = Promise.resolve()
      .then(() => traiter(element))
      .then(
        () => undefined,
        (erreur) => {
          try {
            surErreur(erreur, element);
          } catch (erreurInterne) {
            erreurDeSurErreur ??= { erreur: erreurInterne };
          }
        }
      )
      .then(() => {
        enCours.delete(tache);
        liberer?.();
        liberer = null;
      });
    enCours.add(tache);
  };

  try {
    for await (const element of source) {
      lancer(element);
      while (enCours.size >= concurrence) {
        await new Promise<void>((resolve) => {
          liberer = resolve;
        });
      }
    }
  } finally {
    await Promise.all(enCours);
  }

  if (erreurDeSurErreur) {
    throw (erreurDeSurErreur as { erreur: unknown }).erreur;
  }
}
