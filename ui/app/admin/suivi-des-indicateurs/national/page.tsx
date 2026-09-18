import { Suspense } from "react";

import { NationalView } from "@/app/_components/statistiques/views/NationalView";

export default function NationalPage() {
  return (
    <Suspense>
      <NationalView isAdmin />
    </Suspense>
  );
}
