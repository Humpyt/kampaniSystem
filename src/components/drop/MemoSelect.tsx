import React from 'react';
import { Check } from 'lucide-react';
import { Chip, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Checkbox, ListItemText } from '@mui/material';

interface MemoSelectProps {
  options: string[];
  value: string[];
  onChange: (memos: string[]) => void;
  disabled: boolean;
}

const MemoSelect: React.FC<MemoSelectProps> = ({
  options,
  value,
  onChange,
  disabled,
}) => {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const selected = event.target.value as string[];
    onChange(selected);
  };

  if (disabled) {
    return (
      <FormControl disabled size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Memos</InputLabel>
        <Select multiple value={[]} label="Memos">
          {options.map((option) => (
            <MenuItem key={option} value={option} dense>
              <Checkbox size="small" disabled />
              <ListItemText primary={option} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel>Memos</InputLabel>
      <Select
        multiple
        value={value}
        label="Memos"
        onChange={handleChange}
        renderValue={(selected) => (
          <div className="flex flex-wrap gap-1">
            {(selected as string[]).map((memo) => (
              <Chip
                key={memo}
                label={memo}
                size="small"
                onDelete={() => onChange(value.filter(v => v !== memo))}
                sx={{
                  bgcolor: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#3B82F6',
                }}
              />
            ))}
          </div>
        )}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option} dense>
            <Checkbox
              size="small"
              checked={value.includes(option)}
              icon={<div className="w-4 h-4 border-2 border-gray-400 rounded" />}
              checkedIcon={<Check className="w-4 h-4 text-blue-500" />}
            />
            <ListItemText primary={option} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MemoSelect;
