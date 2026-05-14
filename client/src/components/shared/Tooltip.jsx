import { Z_INDEX } from '../../constants/zIndex';
import { CINEMATIC } from '../../constants/cinematicAtmosphere';

export const Tooltip = ({ text, children, position = 'top', className = '' }) => {
  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const arrowClasses = {
    top: 'top-full border-t-glass border-l-transparent border-r-transparent border-b-transparent',
    bottom:
      'bottom-full border-b-glass border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full border-l-glass border-t-transparent border-b-transparent border-r-transparent',
    right:
      'right-full border-r-glass border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div className={`group relative inline-flex ${className}`}>
      {children}
      <div
        className={`
          absolute ${positionClasses[position]}
          left-1/2 transform -translate-x-1/2
          px-3 py-1 text-text-secondary text-sm
          whitespace-nowrap opacity-0 group-hover:opacity-100
          transition-opacity pointer-events-none
          ${CINEMATIC.PRESETS.TOOLTIP}
        `}
        style={{ zIndex: Z_INDEX.TOOLTIP }}
      >
        {text}
      </div>
    </div>
  );
};
