import { Badge, Box, Divider, Flex, Heading, HStack, Link, Text } from "@chakra-ui/react";
import { format, formatISO } from "date-fns";
import fr from "date-fns/locale/fr";
import React, { useEffect, useState } from "react";

import { BreadcrumbNav, Page, Section } from "../../common/components";
import Sommaire from "../../common/components/Sommaire/Sommaire";
import { NAVIGATION_PAGES } from "../../common/constants/navigationPages";
import { getUniquesMonthAndYearFromDatesList } from "../../common/utils/dateUtils";
import { capitalize } from "../../common/utils/stringUtils";
import JournalDesEvolutionsTagFilter from "./JournalDesEvolutionsTagFilter";
import { JOURNAL_DES_EVOLUTIONS_DATA, JOURNAL_DES_EVOLUTIONS_TAGS } from "./JournalEvolutionsData";

const JournalDesEvolutions = () => {
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
      <Section withShadow paddingTop="3w">
        <BreadcrumbNav links={[NAVIGATION_PAGES.Accueil, NAVIGATION_PAGES.JournalDesEvolutions]} />
      </Section>
      <Section marginTop="5w">
        <Heading as="h1">{NAVIGATION_PAGES.JournalDesEvolutions.title}</Heading>
        <HStack spacing="2w" paddingY="1w">
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
      <Section marginBottom="10w">
        <HStack spacing="12w">
          <Box flex="1">
            {dataList.map((item) => {
              const date = format(new Date(item.date), "dd MMMM yyyy", { locale: fr });
              return (
                <Box paddingY="3w" key={date}>
                  <Heading as="h2" color="grey.600" fontSize="beta" id={item.date}>
                    Le {date}
                  </Heading>
                  <Text color="grey.800" fontWeight="bold" fontSize="gamma">
                    {item.title}
                  </Text>
                  <Divider color="grey.850" orientation="horizontal" marginTop="2w" />
                  <Text color="grey.700" marginTop="1w">
                    {item.explication}
                  </Text>
                  <Badge variant="grey" fontSize="omega" marginTop="1w">
                    {capitalize(item.type)}
                  </Badge>
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
