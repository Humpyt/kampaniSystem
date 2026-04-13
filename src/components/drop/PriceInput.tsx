import React from 'react';
import { TextField, InputAdornment } from '@mui/material';

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  disabled = false,
  fullWidth = true,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Numeric only, no decimals
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    onChange(numericValue);
  };

  return (
    <TextField
      type="number"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      fullWidth={fullWidth}
      size="small"
      placeholder="0"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <span className="text-gray-500 font-medium">UGX</span>
          </InputAdornment>
        ),
      }}
      inputProps={{
        min: 0,
        step: 1,
      }}
      sx={{
        '& input': {
          fontWeight: 500,
        },
      }}
    />
  );
};

export default PriceInput;
