import { GetStaticProps, InferGetStaticPropsType } from "next";
import { NotionAPI } from "notion-client";
import { ExtendedRecordMap } from "notion-types";
import { NotionRenderer } from "react-notion-x";

import { _get } from "@/common/httpClient";
import SimplePage from "@/components/Page/SimplePage";

import "react-notion-x/src/styles.css";

export const getStaticProps = (async () => {
  const notion = new NotionAPI();
  const recordMap = await notion.getPage("Kit-d-ploiement-Tableau-de-bord-R-seaux-cb16eaaf93f840ebb5d7bbcf68925774");
  return { props: { data: recordMap }, revalidate: 60 * 30 };
}) satisfies GetStaticProps<{
  data: ExtendedRecordMap;
}>;

export default function KitDeploiementTbaOP({ data }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <SimplePage title="Kit de déploiement : Réseaux">
      <NotionRenderer disableHeader={true} recordMap={data} fullPage={true} darkMode={false} />
    </SimplePage>
  );
}
