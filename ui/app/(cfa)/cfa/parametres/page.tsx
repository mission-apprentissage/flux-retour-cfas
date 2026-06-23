import { redirect } from "next/navigation";

import { COMPTE_SETTINGS_TAB, COMPTE_TAB_PARAM } from "@/common/utils/compteSettings";

// Le paramétrage du moyen de transmission est regroupé dans le hub unifié /compte.
// Redirection côté serveur (307, sans flash) en préservant un éventuel ?erpV3=... (flux connexion-api).
export default async function ParametresRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ erpV3?: string | string[] }>;
}) {
  const params = await searchParams;
  const erpV3 = Array.isArray(params.erpV3) ? params.erpV3[0] : params.erpV3;
  const qs = new URLSearchParams({ [COMPTE_TAB_PARAM]: COMPTE_SETTINGS_TAB });
  if (erpV3) qs.set("erpV3", erpV3);
  redirect(`/compte?${qs.toString()}`);
}
