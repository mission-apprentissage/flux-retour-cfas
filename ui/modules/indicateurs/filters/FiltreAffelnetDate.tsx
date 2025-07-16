import fr from "date-fns/locale/fr";
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
function FiltreAffelnetDate(props: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <DatePicker
        selected={props.value}
        onChange={(selectedDate) => {
          props.onChange(selectedDate);
        }}
        showYearPicker
        dateFormat="yyyy"
        locale="fr"
        minDate={new Date("2024-01-01")}
        maxDate={new Date()}
        onCalendarClose={() => setIsOpen(false)}
        onCalendarOpen={() => setIsOpen(true)}
        customInput={props.button({ setIsOpen, isOpen, buttonLabel: formatDate(props.value, "dd MMMM yyyy") })}
      />
    </div>
  );
}

export default FiltreAffelnetDate;
