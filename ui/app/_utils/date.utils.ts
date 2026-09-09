export function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-FR");
}

export function getAge(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const dob = new Date(dateString);
  let age = now.getFullYear() - dob.getFullYear();
  const hasBirthdayPassed =
    now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasBirthdayPassed) {
    age -= 1;
  }
  return age;
}

export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  const today = new Date();
  const diffMs = today.setHours(0, 0, 0, 0) - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  return `il y a ${diffDays} jours`;
}

export function formatAnnee(annee: number): string {
  return annee === 1 ? "1ère année" : `${annee}ème année`;
}
