import { GetStaticProps, InferGetStaticPropsType } from "next";
import { NotionAPI } from "notion-client";
import { ExtendedRecordMap } from "notion-types";
import { NotionRenderer } from "react-notion-x";

import { _get } from "@/common/httpClient";
import SimplePage from "@/components/Page/SimplePage";

import "react-notion-x/src/styles.css";

export const getStaticProps = (async () => {
  const notion = new NotionAPI();
  const recordMap = await notion.getPage("Politique-de-confidentialit-7b1c32f4c2214e0c9523686b18ada6fa");
  return { props: { data: recordMap }, revalidate: 60 * 30 };
}) satisfies GetStaticProps<{
  data: ExtendedRecordMap;
}>;

export default function PolitiqueDeConfidentialité({ data }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <SimplePage title="Politique de confidentialité">
      <NotionRenderer disableHeader={true} recordMap={data} fullPage={true} darkMode={false} />
    </SimplePage>
  );
}
