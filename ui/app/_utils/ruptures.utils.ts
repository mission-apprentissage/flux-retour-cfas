import format from "date-fns/format/index";
import { fr } from "date-fns/locale";
import { API_EFFECTIF_LISTE, IMissionLocaleEffectifList } from "shared";

import { MonthItem } from "../../common/types/ruptures";

export const DEFAULT_ITEMS_TO_SHOW = 10;

export const formatMonthAndYear = (dateString: string): string => {
  const date = new Date(dateString);
  const raw = format(date, "MMMM yyyy", { locale: fr });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

export const sortDataByMonthDescending = (data: MonthItem[]): MonthItem[] => {
  return [...data].sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
};

export const anchorFromLabel = (label: string): string => {
  return label.replace(/\s/g, "-").toLowerCase();
};

export const getTotalEffectifs = (data: MonthItem[]): number => {
  return data.reduce((acc, item) => acc + item.data.length, 0);
};

export const get180DaysAgo = () => {
  const now = new Date();
  return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
};

export function groupMonthsOlderThan180Days(items: MonthItem[]): MonthItem[] {
  const now = new Date();
  const cutoff180Days = get180DaysAgo();

  const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const recentMonths: MonthItem[] = [];
  const monthsToCheck: MonthItem[] = [];

  items.forEach((m) => {
    const thisMonth = new Date(m.month);
    if (thisMonth >= sevenMonthsAgo) {
      recentMonths.push(m);
    } else {
      monthsToCheck.push(m);
    }
  });

  const monthsToKeepSeparate: MonthItem[] = [];
  const monthsToGroup: MonthItem[] = [];

  monthsToCheck.forEach((m) => {
    const monthDate = new Date(m.month);
    const lastDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    if (lastDayOfMonth < cutoff180Days) {
      monthsToGroup.push(m);
    } else {
      monthsToKeepSeparate.push(m);
    }
  });

  const allSeparateMonths = [...recentMonths, ...monthsToKeepSeparate];
  const result = sortDataByMonthDescending(allSeparateMonths);

  const combinedOlderData = monthsToGroup.flatMap((m) => m.data);
  const combinedOlderTreated = monthsToGroup.reduce((sum, m) => sum + (m.treated_count || 0), 0);

  result.push({
    month: "plus-de-180-j",
    treated_count: combinedOlderTreated,
    data: combinedOlderData,
  });

  return result;
}

export const getPriorityLabel = (listType: IMissionLocaleEffectifList): string => {
  return listType === API_EFFECTIF_LISTE.INJOIGNABLE ? "À RECONTACTER EN PRIORITÉ" : "À TRAITER EN PRIORITÉ";
};
