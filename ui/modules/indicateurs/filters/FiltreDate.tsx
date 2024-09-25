import { endOfMonth, isThisMonth } from "date-fns"; // eslint-disable-line import/no-duplicates
// besoin de date-fns 3 pour import esm, voir https://github.com/date-fns/date-fns/issues/2629
import fr from "date-fns/locale/fr"; // eslint-disable-line import/no-duplicates
import { Dispatch, SetStateAction, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";

import { formatDate } from "@/common/utils/dateUtils";

registerLocale("fr", fr);

interface Props {
  value: Date;
  onChange: (selectedDate: any) => void;
  button: ({
    isOpen,
    setIsOpen,
    buttonLabel,
  }: {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    buttonLabel: string;
  }) => JSX.Element;
}
function FiltreDate(props: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <DatePicker
        selected={props.value}
        onChange={(selectedDate) => {
          // by default, once a month is selected we use its last day
          const lastDayOfSelectedMonth = endOfMonth(selectedDate);
          // if user has selected current month, we choose to use the current date instead of the last day in the month to avoid using dates in the future
          const date = isThisMonth(lastDayOfSelectedMonth) ? new Date() : lastDayOfSelectedMonth;
          props.onChange(date);
        }}
        showMonthYearPicker
        showFullMonthYearPicker
        showFourColumnMonthYearPicker
        locale="fr"
        maxDate={new Date()}
        onCalendarClose={() => setIsOpen(false)}
        onCalendarOpen={() => setIsOpen(true)}
        customInput={props.button({ setIsOpen, isOpen, buttonLabel: formatDate(props.value, "dd MMMM yyyy") })}
      />
    </div>
  );
}

export default FiltreDate;
