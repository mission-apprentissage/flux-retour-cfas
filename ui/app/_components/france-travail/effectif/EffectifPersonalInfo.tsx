import { formatDate, getAge } from "@/app/_utils/date.utils";

interface EffectifPersonalInfoProps {
  dateNaissance?: string;
  adresse?: { commune?: string; code_postal?: string };
  rqth?: boolean;
  className?: string;
  infoParaClassName?: string;
}

export function EffectifPersonalInfo({
  dateNaissance,
  adresse,
  rqth,
  infoParaClassName = "",
}: EffectifPersonalInfoProps) {
  const age = getAge(dateNaissance);
  return (
    <>
      <p className={infoParaClassName}>
        Né(e) le {formatDate(dateNaissance) || "-"}, <b>{age ? `${age} ans` : ""}</b>
      </p>
      <p className={infoParaClassName}>
        <i className={`fr-icon-home-4-line`} />
        Réside à <b>{adresse?.commune || "-"}</b>({adresse?.code_postal || "-"})
      </p>
      <p className={infoParaClassName}>RQTH : {rqth ? "oui" : "non"}</p>
    </>
  );
}
