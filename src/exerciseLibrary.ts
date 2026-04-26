export interface LibraryExercise {
  name: string;
  muscle: string;
  type: 'Livre' | 'Máquina' | 'Cardio';
  instructions?: string;
  purpose?: string;
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // PEITO (CHEST)
  { 
    name: 'Supino Reto (Barra)', 
    muscle: 'Peito', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar o meio e o volume geral do peito (peitoral maior), recrutando também a parte da frente do ombro e o tríceps.',
    instructions: 'Deite-se no banco, segure a barra com as mãos um pouco mais largas que os ombros. Desça a barra suavemente até quase encostar no peito e empurre-a de volta para cima com força.'
  },
  { 
    name: 'Supino Reto (Halteres)', 
    muscle: 'Peito', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar a porção central do peito de forma equilibrada, alongando mais as fibras musculares e corrigindo diferenças de força entre os dois lados.',
    instructions: 'Deitado no banco, segure um halter em cada mão com os braços esticados. Desça os halteres lateralmente ao peito de forma controlada e empurre-os para cima, aproximando-os no topo.'
  },
  { 
    name: 'Peck Deck (Voador)', 
    muscle: 'Peito', 
    type: 'Máquina',
    purpose: 'O foco desse exercício é trabalhar especificamente o "miolo" do peito (parte central e interna), isolando a musculatura sem usar o tríceps para ajudar.',
    instructions: 'Sentado na máquina, apoie os antebraços ou mãos nas hastes. Feche os braços à frente do corpo contraindo o peito no máximo, e retorne devagar sentindo o músculo "esticar".'
  },
  { 
    name: 'Supino Inclinado (Barra)', 
    muscle: 'Peito', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar a parte de cima (superior ou clavicular) do peito, ajudando a preencher a área mais próxima ao pescoço, usando também a frente do ombro.'
  },
  { 
    name: 'Supino Inclinado (Halteres)', 
    muscle: 'Peito', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar a parte superior do peito com maior amplitude, permitindo que a musculatura estique mais no fundo do movimento.',
    instructions: 'Com o banco inclinado a 45 graus, segure os halteres acima do peito. Desça-os controladamente até sentir o peito alongar e empurre para cima, fechando levemente no topo.'
  },
  { 
    name: 'Supino Declinado (Barra)', 
    muscle: 'Peito', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar a parte de baixo do peito (inferior ou abdominal), sendo ótimo para desenhar a linha inferior do peitoral.'
  },
  { 
    name: 'Crucifixo Reto (Halteres)', 
    muscle: 'Peito', 
    type: 'Livre',
    purpose: 'O foco desse exercício é alargar e trabalhar a porção média do peito, através de um movimento focado puramente em "abraçar", isolando o peitoral.'
  },
  { 
    name: 'Crucifixo Inclinado (Halteres)', 
    muscle: 'Peito', 
    type: 'Livre',
    purpose: 'O foco desse exercício é isolar, alargar e construir volume puramente na parte alta (superior) do peito.'
  },
  { 
    name: 'Crossover (Polia Alta)', 
    muscle: 'Peito', 
    type: 'Máquina',
    purpose: 'O foco desse exercício é "esmagar" e definir a parte inferior e o miolo central do peitoral.'
  },
  { 
    name: 'Crossover (Polia Baixa)', 
    muscle: 'Peito', 
    type: 'Máquina',
    purpose: 'O foco desse exercício é trabalhar o crescimento isolado da parte superior do peito, cortando de baixo para cima.'
  },
  { name: 'Supino Máquina Vertical', muscle: 'Peito', type: 'Máquina' },
  { name: 'Flexão de Braços', muscle: 'Peito', type: 'Livre', purpose: 'O foco desse exercício é trabalhar todo o peitoral com o peso do corpo, ativando firmemente o tríceps e os ombros.' },
  { name: 'Dips (Paralelas - Foco Peito)', muscle: 'Peito', type: 'Livre', purpose: 'O foco desse exercício é trabalhar intensamente a linha inferior do peito e o tríceps, usando a gravidade a seu favor.' },
  { name: 'Pullover (Halter)', muscle: 'Peito', type: 'Livre' },
  { name: 'Press Machine Inclinado', muscle: 'Peito', type: 'Máquina' },
  { name: 'Supino Máquina Articulado', muscle: 'Peito', type: 'Máquina' },
  { name: 'Crucifixo Máquina (Fly)', muscle: 'Peito', type: 'Máquina' },
  { name: 'Press Machine Declinado', muscle: 'Peito', type: 'Máquina' },
  { name: 'Flexão com Peso (Anilha)', muscle: 'Peito', type: 'Livre' },
  { name: 'Flexão Diamante', muscle: 'Peito', type: 'Livre', purpose: 'O foco desse exercício é trabalhar violentamente o tríceps e o miolo (parte interna) do peito.' },
  { name: 'Squeeze Press (Halteres)', muscle: 'Peito', type: 'Livre' },
  { name: 'Crucifixo no Banco Declinado', muscle: 'Peito', type: 'Livre' },
  { name: 'Fly na Polia Média', muscle: 'Peito', type: 'Máquina' },
  { name: 'Flexão de Braços (Pegada Larga)', muscle: 'Peito', type: 'Livre', purpose: 'O foco desse exercício é trabalhar a expansão máxima da largura do peito, diminuindo a ajuda do tríceps.' },
  { name: 'Supino na Smith Machine', muscle: 'Peito', type: 'Máquina' },
  { name: 'Flexão Inclinada', muscle: 'Peito', type: 'Livre', purpose: 'O foco desse exercício é trabalhar a parte inferior do peito (por ter o corpo mais em pé).' },
  { name: 'Flexão Declinada', muscle: 'Peito', type: 'Livre', purpose: 'O foco desse exercício é trabalhar a parte superior do peito e o ombro frontal (por causa dos pés elevados).' },
  { name: 'Flexão de Braços (Joelhos no chão)', muscle: 'Peito', type: 'Livre' },
  { name: 'Supino com Pegada Fechada', muscle: 'Peito', type: 'Livre', purpose: 'O foco desse exercício é focar massivamente no ganho de força do tríceps e no miolo do peito.' },
  { name: 'Supino Unilateral con Halter', muscle: 'Peito', type: 'Livre' },

  // COSTAS (BACK)
  { 
    name: 'Levantamento Terra', 
    muscle: 'Costas', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar toda a parte de trás do corpo (costas, glúteos e parte de trás da coxa) construindo força bruta e estabilidade forte na lombar.',
    instructions: 'Com os pés na largura do quadril, agache e segure a barra. Mantenha as costas retas e suba esticando o corpo até ficar em pé, mantendo a barra próxima às pernas.'
  },
  { 
    name: 'Barra Fixa (Pronada)', 
    muscle: 'Costas', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar a largura e a expansão das costas ("asas" / latíssimo do dorso), construindo o aspecto em formato de V do tronco, e também exigindo bastante do bíceps.'
  },
  { 
    name: 'Barra Fixa (Supinada)', 
    muscle: 'Costas', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar profundamente o volume das costas, recrutando poderosamente o bíceps por causa da pegada invertida.'
  },
  { 
    name: 'Puxada Aberta (Pulldown)', 
    muscle: 'Costas', 
    type: 'Máquina',
    purpose: 'O foco desse exercício é trabalhar a expansão lateral das costas (as asas), servindo como uma ótima alternativa para quem ainda não domina a Barra Fixa.',
    instructions: 'Sentado na máquina, segure a barra com as mãos bem afastadas. Puxe a barra em direção à parte superior do peito, jogando os cotovelos para baixo e para trás.'
  },
  { name: 'Puxada Triângulo', muscle: 'Costas', type: 'Máquina' },
  { name: 'Remada Curvada (Barra)', muscle: 'Costas', type: 'Livre' },
  { name: 'Remada Unilateral (Serrote)', muscle: 'Costas', type: 'Livre' },
  { name: 'Remada Cavalinho', muscle: 'Costas', type: 'Máquina' },
  { name: 'Remada Baixa (Triângulo)', muscle: 'Costas', type: 'Máquina' },
  { name: 'Remada Máquina Unilateral', muscle: 'Costas', type: 'Máquina' },
  { name: 'Puxada Braços Estendidos (Pullover)', muscle: 'Costas', type: 'Máquina' },
  { name: 'Face Pull', muscle: 'Costas', type: 'Máquina' },
  { name: 'Hiperextensão Lombar', muscle: 'Costas', type: 'Livre' },
  { name: 'Puxada Romana', muscle: 'Costas', type: 'Máquina' },
  { name: 'Remada Smith', muscle: 'Costas', type: 'Máquina' },
  { name: 'Pulldown com Corda', muscle: 'Costas', type: 'Máquina' },
  { name: 'Remada no Banco Inclinado', muscle: 'Costas', type: 'Livre' },
  { name: 'Puxada Unilateral na Polia', muscle: 'Costas', type: 'Máquina' },
  { name: 'Crucifixo Inverso na Polia', muscle: 'Costas', type: 'Máquina' },
  { name: 'Muscle Up', muscle: 'Costas', type: 'Livre' },
  { name: 'Front Lever (Progressão)', muscle: 'Costas', type: 'Livre' },
  { name: 'Superman (Lombar)', muscle: 'Costas', type: 'Livre' },
  { name: 'Remada Yates', muscle: 'Costas', type: 'Livre' },
  { name: 'T-Bar Row (Remada T)', muscle: 'Costas', type: 'Máquina' },
  { name: 'Remada com Elástico', muscle: 'Costas', type: 'Livre' },
  { name: 'Puxada Horizontal (TRX)', muscle: 'Costas', type: 'Livre' },
  { name: 'Puxada com Pegada Supinada', muscle: 'Costas', type: 'Máquina' },

  // OMBROS (SHOULDERS)
  { name: 'Desenvolvimento Militar (Barra)', muscle: 'Ombros', type: 'Livre' },
  { 
    name: 'Desenvolvimento Halteres', 
    muscle: 'Ombros', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar a frente e a lateral dos ombros (deltoide anterior e lateral), sendo o construtor principal para criar aquele ombro "cebola" largo e forte, recrutando tríceps e peitoral superior para ajudar.',
    instructions: 'Sentado ou em pé, segure os halteres na altura das orelhas. Empurre-os para cima até esticar quase totalmente os braços e desça devagar até a posição inicial.'
  },
  { name: 'Desenvolvimento Arnold', muscle: 'Ombros', type: 'Livre', purpose: 'O foco desse exercício é trabalhar a frente e lateral do ombro (deltoide anterior e lateral), aumentando muito o tempo sob tensão devido à rotação profunda.' },
  { 
    name: 'Elevação Lateral (Halteres)', 
    muscle: 'Ombros', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar intensamente a lateral do ombro (deltoide medial), sendo o principal responsável por alargar a estrutura superior do corpo.',
    instructions: 'Em pé, segure os halteres ao lado do corpo. Eleve os braços lateralmente até a altura dos ombros, flexionando levemente os cotovelos. Desça controlando o peso.'
  },
  { 
    name: 'Elevação Frontal (Halteres/Barra)', 
    muscle: 'Ombros', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar de forma muito isolada a parte da frente do ombro (deltoide anterior), exigindo o mínimo do resto do corpo.'
  },
  { name: 'Crucifixo Inverso (Halteres)', muscle: 'Ombros', type: 'Livre', purpose: 'O foco desse exercício é trabalhar a parte de trás do ombro (deltoide posterior) e os romboides, o que melhora instantaneamente a postura dos ombros caídos.' },
  { name: 'Elevação Lateral (Polia)', muscle: 'Ombros', type: 'Máquina' },
  { name: 'Elevação Frontal (Barra)', muscle: 'Ombros', type: 'Livre' },
  { name: 'Elevação Frontal (Halteres)', muscle: 'Ombros', type: 'Livre' },
  { name: 'Crucifixo Inverso (Peck Deck)', muscle: 'Ombros', type: 'Máquina' },
  { name: 'Desenvolvimento Máquina', muscle: 'Ombros', type: 'Máquina' },
  { name: 'Elevação Lateral Inclinada', muscle: 'Ombros', type: 'Livre' },
  { name: 'Remada Alta na Polia', muscle: 'Ombros', type: 'Máquina' },
  { name: 'Crucifixo Inverso no Banco', muscle: 'Ombros', type: 'Livre' },
  { name: 'Face Pull com Corda', muscle: 'Ombros', type: 'Máquina' },
  { name: 'Clean and Press', muscle: 'Ombros', type: 'Livre' },
  { name: 'Handstand Pushup', muscle: 'Ombros', type: 'Livre' },
  { name: 'Elevação Lateral no Banco 45°', muscle: 'Ombros', type: 'Livre' },
  { name: 'Desenvolvimento Unilateral', muscle: 'Ombros', type: 'Livre' },
  { name: 'Elevação Frontal com Anilha', muscle: 'Ombros', type: 'Livre' },

  // TRAPÉZIO (TRAPS)
  { name: 'Encolhimento (Halteres)', muscle: 'Trapézio', type: 'Livre' },
  { name: 'Encolhimento (Barra)', muscle: 'Trapézio', type: 'Livre' },
  { name: 'Encolhimento no Smith', muscle: 'Trapézio', type: 'Máquina' },
  { name: 'Encolhimento por Trás (Barra)', muscle: 'Trapézio', type: 'Livre' },
  { name: 'Remada Alta Aberta', muscle: 'Trapézio', type: 'Livre' },
  { name: 'Encolhimento com Anilhas', muscle: 'Trapézio', type: 'Livre' },

  // BÍCEPS (BICEPS)
  { 
    name: 'Rosca Direta (Barra W)', 
    muscle: 'Bíceps', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar toda a parte da frente do braço (bíceps braquial e braquial), sendo o clássico construtor de volume e força máxima no braço.',
    instructions: 'Segure a barra com as mãos na largura dos ombros. Flexione os braços levando a barra em direção ao peito sem mover os cotovelos de lugar, depois desça devagar.'
  },
  { name: 'Rosca Direta (Barra Reta)', muscle: 'Bíceps', type: 'Livre' },
  { name: 'Rosca Alternada (Halteres)', muscle: 'Bíceps', type: 'Livre' },
  { name: 'Rosca Martelo (Halteres)', muscle: 'Bíceps', type: 'Livre', purpose: 'O foco desse exercício é "engrossar" o antebraço e alargar o braço lateralmente, trabalhando os músculos braquial e braquiorradial.' },
  { name: 'Rosca Concentrada', muscle: 'Bíceps', type: 'Livre' },
  { name: 'Rosca Scott (Barra ou Máquina)', muscle: 'Bíceps', type: 'Máquina', purpose: 'O foco desse exercício é travar o cotovelo para maximizar o isolamento e construir aquele "pico" alto no bíceps.' },
  { name: 'Rosca na Polia Baixa', muscle: 'Bíceps', type: 'Máquina' },
  { name: 'Rosca 21', muscle: 'Bíceps', type: 'Livre' },
  { name: 'Rosca Aranha (Spider Curl)', muscle: 'Bíceps', type: 'Livre', purpose: 'O foco desse exercício é eliminar o impulso ("roubo") do corpo por completo, garantindo 100% de esforço isolado na hipertrofia do bíceps.' },
  { name: 'Rosca Zottman', muscle: 'Bíceps', type: 'Livre' },
  { name: 'Rosca no Cabo com Corda', muscle: 'Bíceps', type: 'Máquina' },
  { name: 'Rosca Direta no Banco 45', muscle: 'Bíceps', type: 'Livre', purpose: 'O foco desse exercício é trabalhar o alongamento profundo do bíceps (cabeça longa), forçando as fibras musculares num ângulo muito mais difícil.' },
  { name: 'Rosca Concentrada no Cabo', muscle: 'Bíceps', type: 'Máquina' },
  { name: 'Rosca 21 (Cabo)', muscle: 'Bíceps', type: 'Máquina' },

  // TRÍCEPS (TRICEPS)
  { 
    name: 'Tríceps Pulley (Corda)', 
    muscle: 'Tríceps', 
    type: 'Máquina',
    purpose: 'O foco desse exercício é desenhar a "ferradura" (parte lateral) do tríceps, usando a corda para permitir a torção máxima no final do movimento.',
    instructions: 'Na polia alta, segure a corda com as mãos juntas. Empurre para baixo até esticar totalmente os braços, separando as mãos no final do movimento para contração máxima.'
  },
  { name: 'Tríceps Pulley (Barra V)', muscle: 'Tríceps', type: 'Máquina' },
  { name: 'Tríceps Testa (Barra W)', muscle: 'Tríceps', type: 'Livre', purpose: 'O foco desse exercício é construir massa bruta na parte de trás do braço, trabalhando fortemente as 3 cabeças do tríceps.' },
  { name: 'Tríceps Coice (Halter ou Polia)', muscle: 'Tríceps', type: 'Livre' },
  { name: 'Tríceps Francês (Halter)', muscle: 'Tríceps', type: 'Livre', purpose: 'O foco desse exercício é alongar a porção mais longa do tríceps, usando o braço acima da cabeça para ativar fibras difíceis de atingir.' },
  { name: 'Mergulho no Banco (Dips)', muscle: 'Tríceps', type: 'Livre' },
  { name: 'Extensão de Tríceps (Máquina)', muscle: 'Tríceps', type: 'Máquina' },
  { name: 'Tríceps Coice na Polia', muscle: 'Tríceps', type: 'Máquina' },
  { name: 'Tríceps Banco (Dips)', muscle: 'Tríceps', type: 'Livre' },
  { name: 'Tríceps Unilateral (Polia)', muscle: 'Tríceps', type: 'Máquina' },
  { name: 'Tríceps Pulley Inverso', muscle: 'Tríceps', type: 'Máquina' },
  { name: 'Tríceps Testa com Halteres', muscle: 'Tríceps', type: 'Livre' },
  { name: 'Tríceps Corda Unilateral', muscle: 'Tríceps', type: 'Máquina' },

  // ANTEBRAÇO (FOREARMS)
  { name: 'Rosca Inversa (Barra)', muscle: 'Antebraço', type: 'Livre' },
  { name: 'Rosca Inversa (Polia)', muscle: 'Antebraço', type: 'Máquina' },
  { name: 'Rosca Pajé (Wrist Roller)', muscle: 'Antebraço', type: 'Livre' },
  { name: 'Flexão de Punho (Barra)', muscle: 'Antebraço', type: 'Livre' },
  { name: 'Extensão de Punho (Barra)', muscle: 'Antebraço', type: 'Livre' },
  { name: 'Rosca Martelo Inversa', muscle: 'Antebraço', type: 'Livre' },
  { name: 'Segurar Anilhas (Pinch Grip)', muscle: 'Antebraço', type: 'Livre' },
  { name: 'Flexão de Punho Suportada', muscle: 'Antebraço', type: 'Livre' },

  // QUADRÍCEPS (QUADS)
  { 
    name: 'Agachamento Livre (Barra)', 
    muscle: 'Quadríceps', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar todas as partes da coxa (quadríceps e posteriores) junto com o glúteo e a lombar, sendo o exercício base mais pesado para a estrutura inferior do corpo.',
    instructions: 'Com a barra nos ombros, desça o quadril como se fosse sentar em uma cadeira invisível. Mantenha os calcanhares no chão e as costas retas, depois suba com força.'
  },
  { name: 'Leg Press 45°', muscle: 'Quadríceps', type: 'Máquina', purpose: 'O foco desse exercício é trabalhar a coxa inteira (todos os 4 ventres do quadríceps) permitindo aplicar extrema quantidade de peso sem sobrecarregar a lombar.' },
  { name: 'Leg Press Horizontal', muscle: 'Quadríceps', type: 'Máquina' },
  { name: 'Cadeira Extensora', muscle: 'Quadríceps', type: 'Máquina', purpose: 'O foco desse exercício é isolar 100% o quadríceps, sendo a melhor máquina para esculpir o formato de "gota" da coxa perto do joelho.' },
  { name: 'Hack Squat', muscle: 'Quadríceps', type: 'Máquina' },
  { 
    name: 'Afundo (Halteres)', 
    muscle: 'Quadríceps', 
    type: 'Livre',
    purpose: 'O foco desse exercício é corrigir diferenças de força entre as pernas (sendo unilateral) e recrutar poderosamente o glúteo junto com o quadríceps.',
    instructions: 'Com um halter em cada mão, dê um passo largo à frente. Desça o joelho de trás em direção ao chão até que ambas as pernas formem um ângulo de 90 graus, depois suba.'
  },
  { name: 'Avanço (Passada)', muscle: 'Quadríceps', type: 'Livre' },
  { name: 'Agachamento Sumô', muscle: 'Quadríceps', type: 'Livre' },
  { name: 'Agachamento Búlgaro', muscle: 'Quadríceps', type: 'Livre' },
  { name: 'Goblet Squat (Halter)', muscle: 'Quadríceps', type: 'Livre' },
  { name: 'Agachamento Frontal', muscle: 'Quadríceps', type: 'Livre' },
  { name: 'Agachamento Smith', muscle: 'Quadríceps', type: 'Máquina' },
  { name: 'Afundo no Smith', muscle: 'Quadríceps', type: 'Máquina' },
  { name: 'Sissy Squat', muscle: 'Quadríceps', type: 'Livre' },
  { name: 'Agachamento Isométrico (Parede)', muscle: 'Quadríceps', type: 'Livre' },
  { name: 'Cadeira Extensora (Unilateral)', muscle: 'Quadríceps', type: 'Máquina' },
  { name: 'Agachamento com Peso do Corpo', muscle: 'Quadríceps', type: 'Livre' },
  { name: 'Pistol Squat', muscle: 'Quadríceps', type: 'Livre' },
  { name: 'Agachamento Zercher', muscle: 'Quadríceps', type: 'Livre' },

  // POSTERIORES (HAMSTRINGS)
  { name: 'Mesa Flexora', muscle: 'Posteriores', type: 'Máquina', purpose: 'O foco desse exercício é isolar totalmente a parte de trás da coxa (isquiotibiais), esmagando a panturrilha junto na contração final.' },
  { name: 'Cadeira Flexora', muscle: 'Posteriores', type: 'Máquina' },
  { 
    name: 'Stiff (Barra ou Halter)', 
    muscle: 'Posteriores', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar o alongamento extremo da parte de trás da coxa e do glúteo, gerando estímulo pela máxima amplitude em uma posição esticada.',
    instructions: 'Com as pernas quase retas, desça o peso rente às pernas, empurrando o quadril para trás. Sinta o "puxar" atrás da coxa e volte contraindo os glúteos.'
  },
  { name: 'Mesa Flexora (Unilateral)', muscle: 'Posteriores', type: 'Máquina' },
  { name: 'Bom Dia (Good Morning)', muscle: 'Posteriores', type: 'Livre' },

  // GLÚTEOS (GLUTES)
  { name: 'Elevação de Pélvis (Hip Thrust)', muscle: 'Glúteos', type: 'Livre', purpose: 'O foco desse exercício é construir volume e força bruta no bumbum (glúteo máximo), focado no encurtamento do músculo sem muita ajuda das pernas.' },
  { name: 'Glúteo na Polia (Cice)', muscle: 'Glúteos', type: 'Máquina' },
  { name: 'Abdução de Quadril (Polia)', muscle: 'Glúteos', type: 'Máquina' },
  { name: 'Elevação Pélvica na Máquina', muscle: 'Glúteos', type: 'Máquina' },
  { name: 'Frog Pump', muscle: 'Glúteos', type: 'Livre' },
  { name: 'Extensão de Quadril 45°', muscle: 'Glúteos', type: 'Livre' },
  { name: 'Cadeira Abdutora', muscle: 'Glúteos', type: 'Máquina', purpose: 'O foco desse exercício é trabalhar a lateral do bumbum (glúteo médio e mínimo), ajudando a estabilizar a estrutura do quadril e preencher o aspecto redondo da musculatura.' },
  { name: 'Glúteo Quatro Apoios', muscle: 'Glúteos', type: 'Livre' },

  // PANTURRILHAS (CALVES)
  { name: 'Panturrilha em Pé (Máquina)', muscle: 'Panturrilhas', type: 'Máquina', purpose: 'O foco desse exercício é trabalhar em cheio o gastrocnêmio (aquelas duas "bolotas" da panturrilha) pois os joelhos estão totalmente esticados.' },
  { name: 'Panturrilha Sentado (Sóleio)', muscle: 'Panturrilhas', type: 'Máquina', purpose: 'O foco desse exercício é trabalhar o sóleo (um músculo profundo da panturrilha), já que o joelho dobrado desativa o resto da musculatura, forçando a largura do tornozelo a crescer.' },
  { name: 'Panturrilha no Leg Press', muscle: 'Panturrilhas', type: 'Máquina' },
  { name: 'Panturrilha Unilateral', muscle: 'Panturrilhas', type: 'Livre' },
  { name: 'Panturrilha no Smith (Sentado)', muscle: 'Panturrilhas', type: 'Máquina' },

  // ABDÔMEN (CORE)
  { 
    name: 'Abdominal Supra (Solo)', 
    muscle: 'Abdômen', 
    type: 'Livre',
    purpose: 'O foco desse exercício é trabalhar a parte superior ("tampa") do abdômen, enrolando ativamente o tronco para marcar os gomos de cima.',
    instructions: 'Deitado de costas, com os pés no chão, tire o tronco do chão apenas o suficiente para contrair o abdômen. Imagine que está tentando levar as costelas em direção ao umbigo.'
  },
  { name: 'Abdominal infra (Elevação Pernas)', muscle: 'Abdômen', type: 'Livre', purpose: 'O foco desse exercício é recrutar a parte debaixo do abdômen e a frente da virilha (flexores de quadril), muito útil para criar aquela "linha V".' },
  { name: 'Plancha Abdominal', muscle: 'Abdômen', type: 'Livre', purpose: 'O foco desse exercício é endurecer os músculos mais profundos da cintura (como se fossem uma cinta invisível), melhorando absurdamente a estabilidade e proteção da sua lombar.' },
  { name: 'Abdominal Bicicleta', muscle: 'Abdômen', type: 'Livre' },
  { name: 'Abdominal Roda (Wheel)', muscle: 'Abdômen', type: 'Livre' },
  { name: 'Abdominal Máquina', muscle: 'Abdômen', type: 'Máquina' },
  { name: 'Prancha Lateral', muscle: 'Abdômen', type: 'Livre' },
  { name: 'Russian Twist (Giro Russo)', muscle: 'Abdômen', type: 'Livre' },
  { name: 'Mountain Climbers', muscle: 'Abdômen', type: 'Livre' },
  { name: 'Abdominal na Polia (Reza)', muscle: 'Abdômen', type: 'Máquina' },
  { name: 'Abdominal Oblíquo (Polia)', muscle: 'Abdômen', type: 'Máquina' },
  { name: 'Elevação de Pernas Pendurado', muscle: 'Abdômen', type: 'Livre' },
  { name: 'Prancha Dinâmica', muscle: 'Abdômen', type: 'Livre' },
  { name: 'Woodchopper (Lenhador)', muscle: 'Abdômen', type: 'Máquina' },
  { name: 'Abdominal Infra no Banco', muscle: 'Abdômen', type: 'Livre' },
  { name: 'Dead Bug (Core)', muscle: 'Abdômen', type: 'Livre' },
  { name: 'Bird Dog (Core)', muscle: 'Abdômen', type: 'Livre' },
  { name: 'L-Sit', muscle: 'Abdômen', type: 'Livre' },
  { name: 'Dragon Flag', muscle: 'Abdômen', type: 'Livre' },

  // CARDIO
  { name: 'Esteira (Caminhada/Corrida)', muscle: 'Cardio', type: 'Cardio' },
  { name: 'Bicicleta Ergométrica', muscle: 'Cardio', type: 'Cardio' },
  { name: 'Elíptico (Transport)', muscle: 'Cardio', type: 'Cardio' },
  { name: 'Escada Rolante (Stairmaster)', muscle: 'Cardio', type: 'Cardio' },
  { name: 'Remo Seco (Rowing)', muscle: 'Cardio', type: 'Cardio' },
  { name: 'Pular Corda', muscle: 'Cardio', type: 'Cardio' },
  { name: 'Natação', muscle: 'Cardio', type: 'Cardio' },
  { name: 'Burpees', muscle: 'Cardio', type: 'Cardio' },
  { name: 'Polichinelos', muscle: 'Cardio', type: 'Cardio' },
  { name: 'Sprint HIIT', muscle: 'Cardio', type: 'Cardio' },
  { name: 'Air Bike (Assault Bike)', muscle: 'Cardio', type: 'Cardio' },
  { name: 'SkiErg', muscle: 'Cardio', type: 'Cardio' },
  { name: 'Boxe (Saco de Pancada)', muscle: 'Cardio', type: 'Cardio' },
  { name: 'Battle Ropes', muscle: 'Cardio', type: 'Cardio' },

  // MOBILIDADE / ALONGAMENTO
  { name: 'Alongamento de Peitorais', muscle: 'Mobilidade', type: 'Livre' },
  { name: 'Mobilidade de Quadril (90/90)', muscle: 'Mobilidade', type: 'Livre' },
  { name: 'Cobra Stretch (Lombar)', muscle: 'Mobilidade', type: 'Livre' },
  { name: 'Cat-Cow (Coluna)', muscle: 'Mobilidade', type: 'Livre' },
  { name: 'Child Posture (Criança)', muscle: 'Mobilidade', type: 'Livre' },
  { name: 'Alongamento de Isquiotibiais', muscle: 'Mobilidade', type: 'Livre' },

  // FUNCIONAL / OUTROS
  { name: 'Kettlebell Swing', muscle: 'Funcional', type: 'Livre' },
  { name: 'Farmer Walk', muscle: 'Funcional', type: 'Livre' },
  { name: 'Wall Ball', muscle: 'Funcional', type: 'Livre' },
  { name: 'Box Jump (Salto na Caixa)', muscle: 'Funcional', type: 'Livre' }
];
