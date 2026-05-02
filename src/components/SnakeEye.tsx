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
    {/* Definições para Mascaramento e Filtros */}
    <defs>
      <mask id="eye-mask">
        <path d="M2 13C2 13 6 5.5 12 5.5C18 5.5 22 13 22 13C22 13 18 20.5 12 20.5C6 20.5 2 13 2 13Z" fill="white" />
      </mask>
      <radialGradient id="iris-grad" cx="12" cy="13" r="7" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
      </radialGradient>
    </defs>

    {/* Fundo do Olho (Sclera) */}
    <ellipse 
      cx="12" 
      cy="13" 
      rx="8" 
      ry="7" 
      fill="black" 
      fillOpacity="0.1"
    />

    {/* Íris Orgânica com Movimento e Pulsação - Suavizada */}
    <motion.g
      mask="url(#eye-mask)"
      animate={{ 
        x: [-0.4, 0.4, -0.2, 0.3, 0], 
        y: [-0.2, 0.2, 0.1, -0.1, 0] 
      }}
      transition={{ 
        duration: 12, 
        repeat: Infinity, 
        ease: "easeInOut"
      }}
    >
      {/* Base da Íris com Gradiente */}
      <ellipse 
        cx="12" 
        cy="13" 
        rx="6.5" 
        ry="5.5" 
        fill="url(#iris-grad)" 
      />
      
      {/* Camada de Profundidade da Íris */}
      <ellipse 
        cx="12" 
        cy="13" 
        rx="5" 
        ry="4" 
        fill="currentColor" 
        fillOpacity="0.1" 
      />
      
      {/* Textura de Fibras Radiais (Viper Texture) */}
      <g opacity="0.5">
        {[...Array(20)].map((_, i) => (
          <motion.line
            key={i}
            x1="12"
            y1="13"
            x2={12 + Math.cos(i * (Math.PI / 10)) * 6.5}
            y2={13 + Math.sin(i * (Math.PI / 10)) * 5.5}
            stroke="currentColor"
            strokeWidth="0.3"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 4 + i * 0.1, repeat: Infinity }}
          />
        ))}
      </g>

      {/* Pupila de Fenda Vertical (Viper Slit) - Dilação Orgânica */}
      <motion.path 
        d="M12 7.5C12.4 11 12.4 15 12 18.5C11.6 15 11.6 11 12 7.5Z" 
        fill="currentColor" 
        animate={{ 
          scaleX: [1, 1.4, 0.7, 1.2, 1],
          opacity: [1, 0.9, 1, 0.85, 1]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        style={{ originX: "12px", originY: "13px" }}
      />
      
      {/* Reflexos de Luz (Specularity) - Mais realistas */}
      <circle cx="14.8" cy="11.5" r="0.8" fill="white" fillOpacity="0.6" />
      <circle cx="13.5" cy="12.5" r="0.3" fill="white" fillOpacity="0.3" />
    </motion.g>

    {/* Contorno Principal (Víbora - Mais angular nas laterais) */}
    <path 
      d="M2 13C2 13 6 5.5 12 5.5C18 5.5 22 13 22 13C22 13 18 20.5 12 20.5C6 20.5 2 13 2 13Z" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    {/* Animação de Piscar (Blink) - Pálpebra Superior */}
    <motion.path
      d="M2 13C2 13 6 5.5 12 5.5C18 5.5 22 13 22 13"
      stroke="currentColor"
      strokeWidth={strokeWidth + 0.5}
      fill="currentColor"
      fillOpacity="0"
      animate={{ 
        d: [
          "M2 13C2 13 6 5.5 12 5.5C18 5.5 22 13 22 13", // Aberto
          "M2 13C2 13 6 5.5 12 5.5C18 5.5 22 13 22 13", // Aberto
          "M2 13C2 13 6 13 12 13C18 13 22 13 22 13",     // Fechado
          "M2 13C2 13 6 5.5 12 5.5C18 5.5 22 13 22 13"  // Aberto
        ],
        fillOpacity: [0, 0, 1, 0]
      }}
      transition={{ 
        duration: 0.2, 
        repeat: Infinity, 
        repeatDelay: 5, 
        ease: "easeInOut",
        times: [0, 0.8, 0.9, 1]
      }}
    />

    {/* Sombra de Brow (Agressividade) */}
    <path 
      d="M4 8C7 5.5 17 5.5 20 8" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      opacity="0.4" 
      strokeLinecap="round"
    />
  </svg>
);
