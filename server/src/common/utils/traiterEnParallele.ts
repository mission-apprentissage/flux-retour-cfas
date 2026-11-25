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
  const enCours = new Set<Promise<void>>();

  try {
    for await (const element of source) {
      const tache: Promise<void> = Promise.resolve()
        .then(() => traiter(element))
        .then(
          () => undefined,
          (erreur) => surErreur(erreur, element)
        )
        .finally(() => enCours.delete(tache));
      enCours.add(tache);

      if (enCours.size >= concurrence) {
        await Promise.race(enCours);
      }
    }
  } finally {
    await Promise.all(enCours);
  }
}
