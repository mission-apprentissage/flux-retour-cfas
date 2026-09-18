import { Suspense } from "react";

import { NationalView } from "@/app/_components/statistiques/views/NationalView";

export default function NationalMLPage() {
  return (
    <Suspense>
      <NationalView isAdmin={false} />
    </Suspense>
  );
}
