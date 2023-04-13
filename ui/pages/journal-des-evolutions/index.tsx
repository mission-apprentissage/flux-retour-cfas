import React, { useEffect, useState } from "react";
import Head from "next/head";
import { Badge, Box, Divider, Flex, Heading, HStack, Link, Text } from "@chakra-ui/react";
import { format, formatISO } from "date-fns";
import fr from "date-fns/locale/fr";

import Page from "@/components/Page/Page";
import Sommaire from "@/components/Sommaire/Sommaire";
import { getUniquesMonthAndYearFromDatesList } from "@/common/utils/dateUtils";
import { capitalize } from "@/common/utils/stringUtils";
import JournalDesEvolutionsTagFilter from "@/modules/journal-des-evolutions/JournalDesEvolutionsTagFilter";
import {
  JOURNAL_DES_EVOLUTIONS_DATA,
  JOURNAL_DES_EVOLUTIONS_TAGS,
} from "@/modules/journal-des-evolutions/JournalEvolutionsData";
import Section from "@/components/Section/Section";

const JournalDesEvolutions = () => {
  const title = "Journal des évolutions";
  const [tags, setTags] = useState<string[]>([]);
  const [dataList, setDataList] = useState(JOURNAL_DES_EVOLUTIONS_DATA);

  useEffect(() => {
    if (tags.length > 0) {
      setDataList(JOURNAL_DES_EVOLUTIONS_DATA.filter((item) => Object.values(tags).includes(item.type)));
    } else {
      setDataList(JOURNAL_DES_EVOLUTIONS_DATA);
    }
  }, [tags]);

  const groupEvolutionsByDate: any = Object.values(
    dataList.reduce((acc, cur) => {
      const date = cur.date;
      return {
        ...acc,
        [date]:
          acc[date] === undefined ? { date, evolutions: [cur] } : { date, evolutions: [...acc[date].evolutions, cur] },
      };
    }, {})
  );

  return (
    <Page>
      <Head>
        <title>{title}</title>
      </Head>
      <Section>
        <Heading as="h1" mb="2w">
          Journal des évolutions
        </Heading>
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
          alignItems="start"
          spacing={["0", "0", "0", "6w"]}
          flexDirection={["column-reverse", "column-reverse", "column-reverse", "row"]}
        >
          <Box flex="1">
            {groupEvolutionsByDate.map((item, index) => {
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
                  <Link padding="1w" href={`#${dateFormatLink}`} _hover={{ textDecoration: "none", bg: "grey.200" }}>
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
