import React from 'react';
import { motion } from 'motion/react';

interface SnakeEyeProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export const SnakeEye: React.FC<SnakeEyeProps> = ({ size = 24, className = "", strokeWidth = 2 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Sombra de Pálpebra / Brow (Twitch animation) */}
    <motion.path 
      d="M4 10C7 7.5 17 7.5 20 10" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      opacity="0.8"
      animate={{ d: ["M4 10C7 7.5 17 7.5 20 10", "M4 9.5C7 7 17 7 20 9.5", "M4 10C7 7.5 17 7.5 20 10"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* Contorno Externo (Víbora) */}
    <path 
      d="M3 13C3 13 6 7 12 7C18 7 21 13 21 13C21 13 18 19 12 19C6 19 3 13 3 13Z" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    {/* Iris & Pupil Assembly (Movement animation) */}
    <motion.g
      animate={{ x: [-0.5, 0.5, -0.2, 0.3, 0], y: [-0.2, 0.2, 0.1, -0.1, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Íris Orgânica */}
      <ellipse 
        cx="12" 
        cy="13" 
        rx="5.5" 
        ry="4.5" 
        fill="currentColor" 
        fillOpacity="0.15" 
      />
      
      {/* Textura da Íris (Fibras Radiais) */}
      <g opacity="0.4">
        <path d="M12 9V10" stroke="currentColor" strokeWidth="0.5" />
        <path d="M12 16V17" stroke="currentColor" strokeWidth="0.5" />
        <path d="M9 13H8" stroke="currentColor" strokeWidth="0.5" />
        <path d="M16 13H15" stroke="currentColor" strokeWidth="0.5" />
        <path d="M10 10.5L9 9.5" stroke="currentColor" strokeWidth="0.5" />
        <path d="M15 15.5L14 14.5" stroke="currentColor" strokeWidth="0.5" />
        <path d="M15 10.5L14 11.5" stroke="currentColor" strokeWidth="0.5" />
        <path d="M10 15.5L9 14.5" stroke="currentColor" strokeWidth="0.5" />
      </g>

      {/* Pupila de Fenda (Viper Slit) - Dilation animation */}
      <motion.path 
        d="M12 8.5C12.3 11 12.3 15 12 17.5C11.7 15 11.7 11 12 8.5Z" 
        fill="currentColor" 
        animate={{ scaleX: [1, 1.4, 0.8, 1], opacity: [1, 0.9, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "12px", originY: "13px" }}
      />
      
      {/* Reflexos de Luz (Specularity) */}
      <ellipse cx="14.5" cy="11.5" rx="0.8" ry="1.2" fill="white" fillOpacity="0.5" transform="rotate(15, 14.5, 11.5)" />
      <circle cx="13.5" cy="12.5" r="0.4" fill="white" fillOpacity="0.3" />
    </motion.g>
    
    {/* Detalhe de Escama Inferior */}
    <path 
      d="M7 17.5C10 18.5 14 18.5 17 17.5" 
      stroke="currentColor" 
      strokeWidth="0.5" 
      strokeLinecap="round" 
      opacity="0.5"
    />
  </svg>
);
