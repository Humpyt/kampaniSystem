import React from 'react';
import { X } from 'lucide-react';
import { Chip, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

interface CascadeSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled: boolean;
  placeholder?: string;
}

const CascadeSelect: React.FC<CascadeSelectProps> = ({
  label,
  options,
  value,
  onChange,
  onClear,
  disabled,
  placeholder = 'Select...',
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as string);
  };

  // Locked state: has value, show as chip
  if (value && !disabled) {
    return (
      <Chip
        label={value}
        onDelete={onClear}
        deleteIcon={<X className="w-4 h-4" />}
        sx={{
          bgcolor: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          color: '#F59E0B',
          fontWeight: 500,
          '& .MuiChip-deleteIcon': {
            color: '#F59E0B',
            '&:hover': { color: '#FBBF24' },
          },
        }}
      />
    );
  }

  // Disabled state: greyed out, not interactive
  if (disabled) {
    return (
      <FormControl disabled size="small" sx={{ minWidth: 160 }}>
        <InputLabel>{label}</InputLabel>
        <Select value="" label={label}>
          <MenuItem value="">
            <em>{placeholder}</em>
          </MenuItem>
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  // Active state: no value, open dropdown
  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={handleChange}>
        <MenuItem value="">
          <em>{placeholder}</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default CascadeSelect;
