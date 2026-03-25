import React from 'react';

export interface GridButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  color: 'amber' | 'emerald' | 'sky' | 'violet';
  size?: 'normal' | 'large';
}

interface GridMenuProps {
  buttons: GridButton[];
  onButtonClick: (button: GridButton) => void;
}

const buttonColors = {
  amber: {
    bg: 'from-amber-300 to-amber-400',
    text: 'text-slate-900',
    shadow: 'rgba(245, 158, 11, 0.4)'
  },
  emerald: {
    bg: 'from-emerald-300 to-emerald-400',
    text: 'text-slate-900',
    shadow: 'rgba(16, 185, 129, 0.4)'
  },
  sky: {
    bg: 'from-sky-300 to-sky-400',
    text: 'text-slate-900',
    shadow: 'rgba(14, 165, 233, 0.4)'
  },
  violet: {
    bg: 'from-violet-300 to-violet-400',
    text: 'text-slate-900',
    shadow: 'rgba(139, 92, 246, 0.4)'
  }
};

function Grid3DButton({ button, size = 'normal', onClick }: { button: GridButton; size?: string; onClick?: () => void }) {
  const colors = buttonColors[button.color];

  return (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${colors.bg}
        ${colors.text}
        font-bold rounded-xl
        transition-all duration-200
        hover:scale-[1.02] active:scale-[0.98]
        focus:outline-none focus:ring-4 focus:ring-white/50
        ${size === 'large' ? 'p-6 text-lg' : 'p-4 text-sm'}
      `}
      style={{
        boxShadow: `
          inset 2px 2px 4px rgba(255, 255, 255, 0.4),
          inset -2px -2px 4px rgba(0, 0, 0, 0.2),
          4px 4px 8px rgba(0, 0, 0, 0.4)
        `
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `
          inset 2px 2px 4px rgba(255, 255, 255, 0.4),
          inset -2px -2px 4px rgba(0, 0, 0, 0.2),
          6px 6px 12px rgba(0, 0, 0, 0.5)
        `;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `
          inset 2px 2px 4px rgba(255, 255, 255, 0.4),
          inset -2px -2px 4px rgba(0, 0, 0, 0.2),
          4px 4px 8px rgba(0, 0, 0, 0.4)
        `;
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.boxShadow = `
          inset 2px 2px 4px rgba(0, 0, 0, 0.2),
          inset -2px -2px 4px rgba(255, 255, 255, 0.4),
          2px 2px 4px rgba(0, 0, 0, 0.4)
        `;
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.boxShadow = `
          inset 2px 2px 4px rgba(255, 255, 255, 0.4),
          inset -2px -2px 4px rgba(0, 0, 0, 0.2),
          6px 6px 12px rgba(0, 0, 0, 0.5)
        `;
      }}
    >
      {/* Icon with translucent background */}
      <div className="flex flex-col items-center gap-2">
        <div className="p-2.5 rounded-full bg-white/30 backdrop-blur-sm shadow-inner">
          {React.cloneElement(button.icon as React.ReactElement, {
            className: size === 'large' ? 'w-8 h-8' : 'w-6 h-6'
          })}
        </div>
        <span className="font-black tracking-tight leading-tight text-center">{button.label}</span>
      </div>
    </button>
  );
}

export default function GridMenu({ buttons, onButtonClick }: GridMenuProps) {
  return (
    <div className="
      grid gap-3
      grid-cols-2
      sm:grid-cols-3
      md:grid-cols-4
      lg:grid-cols-5
      xl:grid-cols-6
      auto-rows-min
    ">
      {buttons.map((button) => (
        <div
          key={button.id}
          className={
            button.size === 'large'
              ? 'sm:col-span-2 col-span-1'
              : 'col-span-auto'
          }
        >
          <Grid3DButton
            button={button}
            size={button.size}
            onClick={() => onButtonClick(button)}
          />
        </div>
      ))}
    </div>
  );
}
