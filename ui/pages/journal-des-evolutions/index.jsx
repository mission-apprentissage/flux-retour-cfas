import { Badge, Box, Divider, Flex, Heading, HStack, Link, Text } from "@chakra-ui/react";
import { format, formatISO } from "date-fns";
import fr from "date-fns/locale/fr";
import Head from "next/head";
import React, { useEffect, useState } from "react";

import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { getUniquesMonthAndYearFromDatesList } from "../../common/utils/dateUtils";
import { capitalize } from "../../common/utils/stringUtils";
import { Breadcrumb } from "../../components/Breadcrumb/Breadcrumb";
import { Page } from "../../components/Page/Page";
import Section from "../../components/Section/Section";
import Sommaire from "../../components/Sommaire/Sommaire";
import { groupEvolutionsByDate } from "./groupEvolutionsByDate";
import JournalDesEvolutionsTagFilter from "./JournalDesEvolutionsTagFilter";
import { JOURNAL_DES_EVOLUTIONS_DATA, JOURNAL_DES_EVOLUTIONS_TAGS } from "./JournalEvolutionsData";

const JournalDesEvolutions = () => {
  const title = "Journal des évolutions";
  const [tags, setTags] = useState([]);
  const [dataList, setDataList] = useState(JOURNAL_DES_EVOLUTIONS_DATA);

  useEffect(() => {
    if (tags.length > 0) {
      setDataList(JOURNAL_DES_EVOLUTIONS_DATA.filter((item) => Object.values(tags).includes(item.type)));
    } else {
      setDataList(JOURNAL_DES_EVOLUTIONS_DATA);
    }
  }, [tags]);

  return (
    <Page>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Section paddingTop="3w">
        <Breadcrumb pages={[{ title: "Accueil", to: "/" }, { title: title }]} />
      </Section>
      <Section marginTop="5w">
        <Heading as="h1">{NAVIGATION_PAGES.JournalDesEvolutions.title}</Heading>
        <HStack
          spacing={["0", "0", "4w", "2w"]}
          paddingY="1w"
          flexDirection={["column", "column", "row", "row"]}
          alignItems={["normal", "normal", "center", "center"]}
        >
          {Object.keys(JOURNAL_DES_EVOLUTIONS_TAGS).map((itemKey) => (
            <JournalDesEvolutionsTagFilter
              key={itemKey}
              onHideFilteredData={() => setTags(tags.filter((item) => item !== JOURNAL_DES_EVOLUTIONS_TAGS[itemKey]))}
              onShowFilteredData={() => setTags([...tags, JOURNAL_DES_EVOLUTIONS_TAGS[itemKey]])}
            >
              {JOURNAL_DES_EVOLUTIONS_TAGS[itemKey]}
            </JournalDesEvolutionsTagFilter>
          ))}
        </HStack>
      </Section>
      <Section>
        <HStack
          spacing={["0", "0", "0", "12w"]}
          flexDirection={["column-reverse", "column-reverse", "column-reverse", "row"]}
        >
          <Box flex="1">
            {groupEvolutionsByDate(dataList).map((item, index) => {
              const date = format(new Date(item.date), "dd MMMM yyyy", { locale: fr });
              return (
                <Box paddingY="3w" key={index}>
                  <Heading as="h2" color="grey.600" fontSize="beta" id={item.date}>
                    Le {date}
                  </Heading>
                  {item.evolutions.map((evolution) => {
                    return (
                      <Box paddingY="2w" key={evolution.title}>
                        <Text color="grey.800" fontWeight="bold" fontSize="gamma">
                          {evolution.title}
                        </Text>
                        <Divider color="grey.850" orientation="horizontal" marginTop="2w" />
                        <Text color="grey.700" marginTop="1w">
                          {evolution.explication}
                        </Text>
                        <Badge variant="grey" fontSize="omega" marginTop="1w">
                          {capitalize(evolution.type)}
                        </Badge>
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
          <Sommaire>
            {getUniquesMonthAndYearFromDatesList(JOURNAL_DES_EVOLUTIONS_DATA).map((item) => {
              const newDate = format(item, "LLLL yyyy", { locale: fr });
              const dateFormatIso = formatISO(item, { representation: "date" });
              const regex = /-/gi;
              const dateFormatLink = dateFormatIso.replace(regex, "/");
              return (
                <Flex flexDirection="column" key={newDate} paddingRight="150px" fontSize="zeta">
                  <Link padding="1w" href={"#" + dateFormatLink} _hover={{ textDecoration: "none", bg: "grey.200" }}>
                    {capitalize(newDate)}
                  </Link>
                </Flex>
              );
            })}
          </Sommaire>
        </HStack>
      </Section>
    </Page>
  );
};

export default JournalDesEvolutions;
