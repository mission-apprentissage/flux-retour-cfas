"use client";

import {
  Box,
  FormControl,
  Select,
  MenuItem,
  OutlinedInput,
  SelectChangeEvent,
  Typography,
  Checkbox,
  ListItemText,
} from "@mui/material";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelectDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
}: MultiSelectDropdownProps) {
  const handleChange = (event: SelectChangeEvent<typeof value>) => {
    const newValue = event.target.value as string[];

    if (newValue.includes("__SELECT_ALL__")) {
      handleSelectAll();
      return;
    }

    onChange(newValue);
  };

  const handleSelectAll = () => {
    onChange(value.length === options.length ? [] : options.map((opt) => opt.value));
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) return options.find((opt) => opt.value === value[0])?.label || placeholder;
    if (value.length <= 3) return value.map((v) => options.find((opt) => opt.value === v)?.label || v).join(", ");

    return `${value.length} sélectionné${value.length > 1 ? "s" : ""}`;
  };

  const isAllSelected = value.length === options.length;

  return (
    <Box>
      <Typography
        component="label"
        variant="body2"
        sx={{ display: "block", mb: 1, fontWeight: 500, color: "var(--text-label-grey)" }}
      >
        {label}
      </Typography>

      <FormControl fullWidth size="small">
        <Select
          multiple
          value={value}
          onChange={handleChange}
          input={<OutlinedInput />}
          renderValue={() => (
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: value.length === 0 ? "var(--text-disabled-grey)" : undefined,
              }}
            >
              {getDisplayText()}
            </span>
          )}
          displayEmpty
        >
          {options.length > 1 && (
            <MenuItem
              value="__SELECT_ALL__"
              dense
              sx={{
                borderBottom: "1px solid var(--border-default-grey)",
                mb: 0.5,
                "&:hover": {
                  backgroundColor: "var(--background-default-grey-hover)",
                },
                "&.Mui-focusVisible": {
                  backgroundColor: "transparent",
                },
              }}
            >
              <Checkbox
                checked={isAllSelected}
                indeterminate={value.length > 0 && !isAllSelected}
                size="small"
                sx={{ mr: 1, p: 0.25 }}
              />
              <ListItemText primary={isAllSelected ? "Tout désélectionner" : "Tout sélectionner"} sx={{ my: 0 }} />
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              dense
              sx={{
                "&.Mui-focusVisible": {
                  backgroundColor: "transparent",
                },
              }}
            >
              <Checkbox checked={value.includes(option.value)} size="small" sx={{ mr: 1, p: 0.25 }} />
              <ListItemText primary={option.label} sx={{ my: 0 }} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
