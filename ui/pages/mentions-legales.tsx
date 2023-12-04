import { GetStaticProps, InferGetStaticPropsType } from "next";
import { NotionAPI } from "notion-client";
import { ExtendedRecordMap } from "notion-types";
import { NotionRenderer } from "react-notion-x";

import { _get } from "@/common/httpClient";
import SimplePage from "@/components/Page/SimplePage";

import "react-notion-x/src/styles.css";

export const getStaticProps = (async () => {
  const notion = new NotionAPI();
  const recordMap = await notion.getPage("Mentions-l-gales-002a2868ea2f46cdb2d73207d12b6075");
  // const data = await _get("/api/mentions-legales");
  return { props: { data: recordMap }, revalidate: 60 * 30 };
}) satisfies GetStaticProps<{
  data: ExtendedRecordMap;
}>;

export default function MentionsLegales({ data }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <SimplePage title="Mentions légales">
      <NotionRenderer pageTitle={false} disableHeader={true} recordMap={data} fullPage={true} darkMode={false} />
    </SimplePage>
  );
}
