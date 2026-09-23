import { Suspense } from "react";

import { NationalView } from "@/app/_components/statistiques/views/NationalView";
import { getSession } from "@/app/_utils/session.utils";

import { isAdminUser } from "../access";

export default async function NationalMLPage() {
  const user = await getSession();

  return (
    <Suspense>
      <NationalView isAdmin={isAdminUser(user)} />
    </Suspense>
  );
}
