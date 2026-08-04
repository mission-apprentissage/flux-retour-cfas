import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ExtendedRecordMap } from "notion-types";

import { getNotionPage, getNotionPageTitle } from "@/app/_utils/notion.utils";
import { PAGES } from "@/app/_utils/routes.utils";

import { NotionBody } from "../../_components/NotionBody";

type DocsPageProps = { params: Promise<{ id: string }> };

async function fetchDocPage(id: string): Promise<ExtendedRecordMap | null> {
  try {
    return await getNotionPage(id);
  } catch (error) {
    console.error(`Échec du chargement de la page Notion ${id}`, error);
    return null;
  }
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { id } = await params;
  const recordMap = await fetchDocPage(id);

  return PAGES.dynamic.docsPage({ id, title: getNotionPageTitle(recordMap) ?? undefined }).getMetadata();
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { id } = await params;
  const recordMap = await fetchDocPage(id);

  if (!recordMap) {
    notFound();
  }

  return (
    <main id="docs-content">
      <NotionBody recordMap={recordMap} />
    </main>
  );
}
