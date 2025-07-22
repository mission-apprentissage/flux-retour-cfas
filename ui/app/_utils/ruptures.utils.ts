import format from "date-fns/format/index";
import { fr } from "date-fns/locale";

import { MonthItem } from "../../common/types/ruptures";

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

export function groupMonthsOlderThanSixMonths(items: MonthItem[]): MonthItem[] {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const recent: MonthItem[] = [];
  const older: MonthItem[] = [];

  items.forEach((m) => {
    const thisMonth = new Date(m.month);
    if (thisMonth >= cutoff) {
      recent.push(m);
    } else {
      older.push(m);
    }
  });

  const combinedOlderData = older.flatMap((m) => m.data);
  const combinedOlderTreated = older.reduce((sum, m) => sum + (m.treated_count || 0), 0);

  const result = sortDataByMonthDescending(recent);
  if (combinedOlderData.length > 0) {
    result.push({
      month: "plus-de-6-mois",
      treated_count: combinedOlderTreated,
      data: combinedOlderData,
    });
  }

  return result;
}
