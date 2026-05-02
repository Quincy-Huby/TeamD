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
        <path d="M2.5 13C2.5 13 6 6 12 6C18 6 21.5 13 21.5 13C21.5 13 18 20 12 20C6 20 2.5 13 2.5 13Z" fill="white" />
      </mask>
    </defs>

    {/* Fundo do Olho (Esclera/Deep Iris) */}
    <ellipse 
      cx="12" 
      cy="13" 
      rx="8" 
      ry="7" 
      fill="currentColor" 
      fillOpacity="0.03"
    />

    {/* Íris Orgânica com Movimento e Pulsação - Suavizada */}
    <motion.g
      mask="url(#eye-mask)"
      animate={{ 
        x: [-0.3, 0.3, -0.1, 0.2, 0], 
        y: [-0.1, 0.1, 0.05, -0.05, 0] 
      }}
      transition={{ 
        duration: 12, 
        repeat: Infinity, 
        ease: "easeInOut"
      }}
    >
      {/* Base da Íris com Gradiente Simulado */}
      <ellipse 
        cx="12" 
        cy="13" 
        rx="6.5" 
        ry="5.5" 
        fill="currentColor" 
        fillOpacity="0.22" 
      />
      
      {/* Camada de Profundidade da Íris */}
      <ellipse 
        cx="12" 
        cy="13" 
        rx="4.5" 
        ry="3.5" 
        fill="black" 
        fillOpacity="0.1" 
      />
      
      {/* Textura de Fibras Radiais (Viper Texture) */}
      <g opacity="0.4">
        {[...Array(16)].map((_, i) => (
          <motion.line
            key={i}
            x1="12"
            y1="13"
            x2={12 + Math.cos(i * (Math.PI / 8)) * 6}
            y2={13 + Math.sin(i * (Math.PI / 8)) * 5}
            stroke="currentColor"
            strokeWidth="0.3"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4 + i * 0.1, repeat: Infinity }}
          />
        ))}
      </g>

      {/* Pupila de Fenda Vertical (Viper Slit) - Dilação Orgânica */}
      <motion.path 
        d="M12 8C12.3 11 12.3 15 12 18C11.7 15 11.7 11 12 8Z" 
        fill="currentColor" 
        animate={{ 
          scaleX: [1, 1.3, 0.8, 1.1, 1],
          opacity: [1, 0.85, 1, 0.9, 1]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        style={{ originX: "12px", originY: "13px" }}
      />
      
      {/* Reflexos de Luz (Specularity) - Mais realistas */}
      <circle cx="14.5" cy="11.2" r="0.9" fill="white" fillOpacity="0.5" />
      <circle cx="13.2" cy="12.2" r="0.4" fill="white" fillOpacity="0.25" />
    </motion.g>

    {/* Contorno Principal */}
    <path 
      d="M2.5 13C2.5 13 6 6 12 6C18 6 21.5 13 21.5 13C21.5 13 18 20 12 20C6 20 2.5 13 2.5 13Z" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    {/* Animação de Piscar (Blink) - Pálpebra Superior */}
    <motion.path
      d="M2.5 13C2.5 13 6 6 12 6C18 6 21.5 13 21.5 13"
      stroke="currentColor"
      strokeWidth={strokeWidth + 0.5}
      fill="none"
      animate={{ 
        d: [
          "M2.5 13C2.5 13 6 6 12 6C18 6 21.5 13 21.5 13", // Aberto
          "M2.5 13C2.5 13 6 6 12 6C18 6 21.5 13 21.5 13", // Aberto
          "M2.5 13C2.5 13 6 13 12 13C18 13 21.5 13 21.5 13", // Fechado
          "M2.5 13C2.5 13 6 6 12 6C18 6 21.5 13 21.5 13"  // Aberto
        ]
      }}
      transition={{ 
        duration: 0.25, 
        repeat: Infinity, 
        repeatDelay: 4, 
        ease: "easeInOut",
        times: [0, 0.1, 0.15, 0.25]
      }}
    />

    {/* Sombra de Brow (Efeito Agressivo) */}
    <path 
      d="M4 8.5C7 6 17 6 20 8.5" 
      stroke="black" 
      strokeWidth="1.5" 
      opacity="0.15" 
      strokeLinecap="round"
    />
  </svg>
);
