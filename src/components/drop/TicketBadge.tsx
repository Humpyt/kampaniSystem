import React from 'react';
import { Ticket } from 'lucide-react';
import { Chip } from '@mui/material';

interface TicketBadgeProps {
  ticketNumber: string;
}

const TicketBadge: React.FC<TicketBadgeProps> = ({ ticketNumber }) => {
  return (
    <Chip
      icon={<Ticket className="w-4 h-4" />}
      label={`Ticket: ${ticketNumber}`}
      sx={{
        bgcolor: 'rgba(34, 197, 94, 0.15)',
        border: '1px solid rgba(34, 197, 94, 0.4)',
        color: '#22C55E',
        fontWeight: 600,
        '& .MuiChip-icon': {
          color: '#22C55E',
        },
      }}
    />
  );
};

export default TicketBadge;
