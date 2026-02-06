import { GetStaticProps, InferGetStaticPropsType } from "next";
import { NotionAPI } from "notion-client";
import { ExtendedRecordMap } from "notion-types";
import { NotionRenderer } from "react-notion-x";

import SimplePage from "@/components/Page/SimplePage";

import "react-notion-x/src/styles.css";

export const getStaticProps = (async () => {
  const notion = new NotionAPI();
  const recordMap = await notion.getPage(
    "Kit-d-ploiement-Tableau-de-bord-DREETS-DDETS-c8ee3df5776d4e9b8ab6799a1a8f30b7"
  );
  return { props: { data: recordMap }, revalidate: 60 * 30 };
}) satisfies GetStaticProps<{
  data: ExtendedRecordMap;
}>;

export default function KitDeploiementTbaOP({ data }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <SimplePage title="Kit de déploiement : Opérateurs Publics">
      <NotionRenderer disableHeader={true} recordMap={data} fullPage={true} darkMode={false} />
    </SimplePage>
  );
}
