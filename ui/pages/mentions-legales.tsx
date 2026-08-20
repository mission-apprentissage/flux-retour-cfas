import { GetStaticProps, InferGetStaticPropsType } from "next";
import { ExtendedRecordMap } from "notion-types";
import { NotionRenderer } from "react-notion-x";

import { _get } from "@/common/httpClient";
import { getNotionPage } from "@/common/utils/notionUtils";
import SimplePage from "@/components/Page/SimplePage";

import "react-notion-x/src/styles.css";

export const getStaticProps = (async () => {
  const recordMap = await getNotionPage("Mentions-l-gales-002a2868ea2f46cdb2d73207d12b6075");
  return { props: { data: recordMap }, revalidate: 60 * 30 };
}) satisfies GetStaticProps<{
  data: ExtendedRecordMap;
}>;

export default function MentionsLegales({ data }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <SimplePage title="Mentions légales">
      <NotionRenderer
        disableHeader={true}
        recordMap={data}
        fullPage={true}
        darkMode={false}
        previewImages={false}
        mapPageUrl={(id) => (id ? `/${id}` : "#")}
      />
    </SimplePage>
  );
}
