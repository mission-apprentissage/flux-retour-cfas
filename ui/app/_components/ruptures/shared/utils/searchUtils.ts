export function matchesSearchTerm(nom: string | undefined, prenom: string | undefined, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;

  const searchWords = searchTerm
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const nomLower = nom?.toLowerCase() || "";
  const prenomLower = prenom?.toLowerCase() || "";
  const nomComplet = `${prenomLower} ${nomLower}`;

  if (searchWords.length === 1) {
    const word = searchWords[0].toLowerCase();
    return nomLower.includes(word) || prenomLower.includes(word) || nomComplet.includes(word);
  }

  return searchWords.every((word) => nomComplet.includes(word.toLowerCase()));
}
