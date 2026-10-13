/* ============================================================================
   CONCEITOS DE ARTE — movimentos, técnicas, materiais e gêneros.
   Usados como INSTRUÇÃO (cartões antes dos capítulos e dicas na resposta) e
   depois como perguntas. Base: ebiografia, Toda Matéria, InfoEscola.
   ============================================================================ */
const CONCEITOS = [
  /* ---------- movimentos e épocas ---------- */
  { id:"renascimento", grupo:"Movimento", icone:"🏛️", nome:"Renascimento", quando:"séculos XIV a XVI · Itália",
    def:"Retorno aos valores da Antiguidade clássica, com o ser humano no centro (humanismo)",
    resumo:"Movimento nascido na Itália que retomou os ideais da Antiguidade greco-romana. Valorizou o ser humano (humanismo), a razão e a observação da natureza. Na pintura, buscou representar o mundo com realismo, proporção e equilíbrio.",
    marcas:["Perspectiva linear para criar profundidade","Proporção e anatomia estudadas","Composições equilibradas e harmoniosas","Temas religiosos e mitológicos com figuras muito naturais"],
    artistas:"Leonardo da Vinci, Michelangelo, Rafael, Botticelli",
    dica:"O Renascimento valorizou o ser humano, a razão e o realismo, com perspectiva e proporção.",
    q:"Qual é a ideia central do Renascimento?", c:"Valorizar o ser humano e retomar os ideais da Antiguidade clássica", e:["Mostrar apenas cenas de batalha","Pintar só com cores puras e sem formas definidas","Abandonar a observação da natureza"] },
  { id:"maneirismo", grupo:"Movimento", icone:"🌀", nome:"Maneirismo", quando:"século XVI · transição Renascimento–Barroco",
    def:"Figuras alongadas e composições complexas, em reação ao equilíbrio renascentista",
    resumo:"Estilo do século XVI que nasce do Renascimento, mas rompe com o seu equilíbrio. Os artistas buscam a elegância artificial, a tensão e a complexidade.",
    marcas:["Figuras alongadas e poses retorcidas","Composições complexas e menos equilibradas","Cores intensas e efeitos inesperados"],
    artistas:"Pontormo, Parmigianino, El Greco",
    dica:"O Maneirismo exagera o Renascimento: corpos alongados e composições tensas.",
    q:"Que característica marca o Maneirismo?", c:"Figuras alongadas e composições tensas e complexas", e:["Pinceladas rápidas e pintura ao ar livre","Formas geométricas vistas de vários ângulos","Cenas simples do cotidiano sem idealização"] },
  { id:"barroco", grupo:"Movimento", icone:"🕯️", nome:"Barroco", quando:"século XVII · Europa e Américas",
    def:"Forte contraste de luz e sombra, movimento, emoção e dramaticidade",
    resumo:"Estilo do século XVII marcado pela emoção, pelo drama e pelo movimento. Usa contrastes fortes de luz e sombra e composições dinâmicas. No Brasil colonial deu origem ao Barroco mineiro, de Aleijadinho.",
    marcas:["Contraste intenso entre luz e sombra","Movimento, emoção e teatralidade","Composições em diagonais e curvas","Detalhes ricos e ornamentados"],
    artistas:"Caravaggio, Rembrandt, Vermeer, Rubens, Velázquez; no Brasil, Aleijadinho",
    dica:"O Barroco busca o drama: luz e sombra em contraste forte, emoção e movimento.",
    q:"O que caracteriza a pintura barroca?", c:"Contraste forte de luz e sombra, emoção e movimento", e:["Pontos de cor pura lado a lado","Linhas retas, calma e retorno à Grécia antiga","Cores chapadas sem profundidade"] },
  { id:"idadeouro", grupo:"Movimento", icone:"🌷", nome:"Idade de Ouro Holandesa", quando:"século XVII · Países Baixos",
    def:"Época de prosperidade holandesa em que a burguesia comprava retratos, paisagens e cenas do dia a dia",
    resumo:"No século XVII os Países Baixos ficaram ricos com o comércio. A arte deixou de depender só da Igreja e dos reis: comerciantes e burgueses passaram a comprar quadros para as suas casas, o que impulsionou retratos, paisagens, naturezas-mortas e cenas domésticas.",
    marcas:["Clientes burgueses e não só a Igreja","Retratos de grupo, paisagens e naturezas-mortas","Cenas do cotidiano em ambientes domésticos","Domínio da luz e dos detalhes"],
    artistas:"Rembrandt, Vermeer, Frans Hals",
    dica:"Na Holanda do século XVII a burguesia rica sustentou a arte, e por isso surgiram tantas cenas do cotidiano e retratos.",
    q:"Por que a pintura holandesa do século XVII teve tantas cenas do cotidiano e retratos?", c:"Uma burguesia rica comprava quadros para suas casas", e:["Porque a Igreja proibiu os temas religiosos em toda a Europa","Porque não havia tintas disponíveis para cenas históricas","Porque os pintores trabalhavam só para a corte francesa"] },
  { id:"neoclassicismo", grupo:"Movimento", icone:"🏺", nome:"Neoclassicismo", quando:"final do século XVIII ao início do XIX",
    def:"Retorno à Antiguidade clássica, com razão, ordem e linhas claras",
    resumo:"Surge no ambiente do Iluminismo e valoriza a razão, a ordem e a clareza. Inspira-se na arte da Grécia e de Roma e privilegia o desenho preciso, as formas nítidas e temas históricos ou heroicos.",
    marcas:["Desenho nítido e contornos definidos","Composições equilibradas e sóbrias","Temas históricos, mitológicos e heroicos"],
    artistas:"Jacques-Louis David, Ingres",
    dica:"O Neoclassicismo prefere a razão e a ordem: linhas claras inspiradas em Grécia e Roma.",
    q:"Em que se inspira o Neoclassicismo?", c:"Na arte da Grécia e de Roma antigas, com razão e ordem", e:["Na emoção intensa e na natureza selvagem","Nos sonhos e no inconsciente","Na vida de operários e camponeses"] },
  { id:"romantismo", grupo:"Movimento", icone:"🌊", nome:"Romantismo", quando:"final do século XVIII a meados do XIX",
    def:"Valoriza emoção, imaginação, natureza grandiosa e liberdade individual",
    resumo:"Reação à frieza racional do Neoclassicismo e do Iluminismo. Os românticos valorizam o sentimento, a imaginação, a liberdade do artista, o passado e a natureza grandiosa, às vezes assustadora (o sublime).",
    marcas:["Emoção acima da razão","Paisagens dramáticas e natureza sublime","Cores vivas e pinceladas expressivas","Liberdade individual, nostalgia e heroísmo"],
    artistas:"Caspar David Friedrich, Delacroix, Turner, Goya",
    dica:"O Romantismo coloca a emoção e a natureza grandiosa acima da razão.",
    q:"O que o Romantismo valoriza acima de tudo?", c:"Emoção, imaginação e a natureza grandiosa", e:["Razão, ordem e simetria","Fidelidade científica ao cotidiano","Formas geométricas e abstração"] },
  { id:"realismo", grupo:"Movimento", icone:"⚒️", nome:"Realismo", quando:"meados do século XIX · França",
    def:"Mostra o cotidiano e as pessoas comuns como são, sem idealizar",
    resumo:"Surge na França em meados do século XIX, em reação ao idealismo romântico. Retrata a realidade como ela é: o trabalho, os camponeses, os operários e as cenas do cotidiano, sem embelezar.",
    marcas:["Cenas do cotidiano e do trabalho","Pessoas comuns como protagonistas","Sem idealização nem exagero emocional","Observação direta da vida"],
    artistas:"Gustave Courbet, Jean-François Millet",
    dica:"O Realismo mostra a vida como ela é, sem embelezar: camponeses, operários, cotidiano.",
    q:"Qual é a proposta do Realismo?", c:"Retratar a vida real e as pessoas comuns sem idealizar", e:["Pintar sonhos e imagens do inconsciente","Reproduzir a luz de um instante com manchas de cor","Voltar às cenas mitológicas gregas"] },
  { id:"barbizon", grupo:"Movimento", icone:"🌲", nome:"Pré-impressionismo (Escola de Barbizon)", quando:"cerca de 1830–1870 · França",
    def:"Paisagistas que pintaram a natureza diretamente da floresta de Fontainebleau",
    resumo:"Grupo de paisagistas franceses que se instalou perto da floresta de Fontainebleau, na vila de Barbizon. Em vez de pintar paisagens de ateliê, saíam para observar a natureza. Prepararam o caminho para o Impressionismo.",
    marcas:["Paisagens observadas ao vivo","Luz e atmosfera naturais","Camponeses e vida no campo"],
    artistas:"Corot, Rousseau, Millet, Daubigny",
    dica:"Antes do Impressionismo, a Escola de Barbizon já levava os pintores para fora do ateliê.",
    q:"O que fazia a Escola de Barbizon, precursora do Impressionismo?", c:"Pintava a natureza observada perto da floresta de Fontainebleau", e:["Pintava só cenas bíblicas em ateliê","Criava formas geométricas abstratas","Pintava sonhos e fantasias"] },
  { id:"impressionismo", grupo:"Movimento", icone:"🌅", nome:"Impressionismo", quando:"a partir de 1874 · França",
    def:"Pinta a impressão da luz num instante, com pinceladas soltas e ao ar livre",
    resumo:"O nome vem de «Impressão, nascer do sol», de Monet, mostrada em 1874 numa exposição independente; a crítica usou o termo de forma pejorativa e o grupo o adotou. Os impressionistas pintam a luz e a cor de um instante, em pinceladas rápidas e soltas, muitas vezes ao ar livre.",
    marcas:["Pintura ao ar livre (en plein air)","Pinceladas curtas, rápidas e visíveis","Cores puras, sem muito preto","Foco na luz e na atmosfera do momento","Cenas da vida moderna e paisagens"],
    artistas:"Monet, Renoir, Degas, Pissarro, Sisley",
    dica:"O Impressionismo pinta a luz de um instante: pinceladas soltas, cores vivas, muita vez ao ar livre.",
    q:"De onde vem o nome «Impressionismo»?", c:"Da obra «Impressão, nascer do sol», de Monet", e:["De um manifesto escrito por Renoir","Do título de um museu em Paris","De uma técnica de gravura"] },
  { id:"posimpressionismo", grupo:"Movimento", icone:"🌻", nome:"Pós-impressionismo", quando:"cerca de 1886 a 1905 · França",
    def:"Parte do Impressionismo, mas busca mais expressão, estrutura e simbolismo",
    resumo:"Reúne artistas que partiram do Impressionismo, mas foram além dele. Cada um seguiu um caminho próprio: expressão emocional, estrutura das formas ou simbolismo da cor. Prepararam a arte moderna.",
    marcas:["Cor usada para expressar sentimentos","Formas mais estruturadas ou simplificadas","Pinceladas marcantes e pessoais","Não é um grupo unido, e sim vários estilos pessoais"],
    artistas:"Van Gogh, Cézanne, Gauguin, Seurat",
    dica:"Os pós-impressionistas partem da luz impressionista, mas usam a cor para expressar emoção e estrutura.",
    q:"O que diferencia o Pós-impressionismo do Impressionismo?", c:"Usa a cor e a forma para expressar emoção e estrutura, não só a luz de um instante", e:["Volta ao desenho neoclássico de contornos nítidos","Pinta somente em preto e branco","Abandona totalmente a cor"] },
  { id:"modernismo", grupo:"Movimento", icone:"🌴", nome:"Modernismo brasileiro", quando:"década de 1920 · Brasil",
    def:"Renovação da arte brasileira, que busca uma linguagem própria e temas do Brasil",
    resumo:"Movimento de renovação que, nos anos 1920, procurou romper com a arte acadêmica e criar uma expressão brasileira, unindo as vanguardas europeias a temas, cores e gentes do país. Em São Paulo reuniu artistas como Tarsila do Amaral, Anita Malfatti e Oswald de Andrade.",
    marcas:["Temas e cores do Brasil","Influência das vanguardas europeias, como o Cubismo","Ruptura com a arte acadêmica"],
    artistas:"Tarsila do Amaral, Anita Malfatti",
    dica:"O Modernismo brasileiro uniu as vanguardas europeias a temas e cores do Brasil.",
    q:"O que buscava o Modernismo brasileiro dos anos 1920?", c:"Uma expressão própria, com temas do Brasil e ideias das vanguardas", e:["Copiar a pintura acadêmica europeia","Pintar só paisagens italianas","Voltar à arte colonial barroca"] },
  { id:"simbolismo", grupo:"Movimento", icone:"🔮", nome:"Simbolismo e Art Nouveau", quando:"final do século XIX",
    def:"Arte de sonhos, símbolos e ornamentos curvos, inspirados na natureza",
    resumo:"O Simbolismo expressa ideias, sonhos e emoções por meio de símbolos. A Art Nouveau (Jugendstil, na Alemanha e Áustria) aplica linhas curvas e ornamentais inspiradas na natureza em pintura, arquitetura e objetos.",
    marcas:["Símbolos, sonhos e mistério","Linhas curvas e decoração em arabescos","Inspiração em plantas e formas orgânicas"],
    artistas:"Gustav Klimt, Alphonse Mucha",
    dica:"Simbolismo e Art Nouveau trocam o realismo por símbolos, sonhos e linhas ornamentais.",
    q:"O que marca a Art Nouveau?", c:"Linhas curvas e ornamentais inspiradas na natureza", e:["Contraste dramático entre luz e sombra","Cenas de operários e do campo","Colagens de formas geométricas"] },
  { id:"cubismo", grupo:"Movimento", icone:"🔷", nome:"Cubismo", quando:"início do século XX · Paris",
    def:"Decompõe os objetos em formas geométricas vistas de vários ângulos ao mesmo tempo",
    resumo:"Criado por Pablo Picasso e Georges Braque, o Cubismo rejeita a perspectiva tradicional. Os objetos são divididos em formas geométricas e mostrados de vários pontos de vista ao mesmo tempo na mesma tela.",
    marcas:["Formas geométricas e fragmentação","Vários pontos de vista numa só imagem","Cores sóbrias na fase inicial"],
    artistas:"Picasso, Braque",
    dica:"O Cubismo mostra o objeto de vários ângulos ao mesmo tempo, em formas geométricas.",
    q:"Quem criou o Cubismo?", c:"Pablo Picasso e Georges Braque", e:["Claude Monet e Auguste Renoir","Leonardo da Vinci e Michelangelo","Salvador Dalí e René Magritte"] },
  { id:"surrealismo", grupo:"Movimento", icone:"🫥", nome:"Surrealismo", quando:"a partir de 1924 · Europa",
    def:"Explora sonhos, o inconsciente e o imaginário, com imagens inesperadas",
    resumo:"Movimento lançado em 1924, no manifesto de André Breton. Inspirado nas ideias sobre o inconsciente, mostra sonhos, o absurdo e o inesperado, juntando elementos que normalmente não combinam.",
    marcas:["Sonhos e inconsciente","Imagens ilógicas e inesperadas","Objetos realistas em situações impossíveis"],
    artistas:"Salvador Dalí, René Magritte",
    dica:"O Surrealismo pinta o mundo dos sonhos e do inconsciente com imagens ilógicas.",
    q:"O que o Surrealismo explora?", c:"Sonhos, o inconsciente e o imaginário", e:["A luz natural ao ar livre","A vida dos camponeses","A razão e a ordem da Antiguidade"] },

  /* ---------- técnicas ---------- */
  { id:"sfumato", grupo:"Técnica", icone:"🌫️", nome:"Sfumato", quando:"Renascimento · Leonardo da Vinci",
    def:"Passagem suave entre luz e sombra, sem contornos duros, como fumaça",
    resumo:"Do italiano «fumaça»: camadas muito finas e transparentes de tinta suavizam as transições entre luz e sombra, apagando os contornos duros. Leonardo da Vinci a usou de forma célebre na Mona Lisa, no sorriso e nos olhos.",
    marcas:["Contornos esfumaçados, sem linhas duras","Transições suaves de luz e sombra","Efeito de atmosfera e mistério"],
    artistas:"Leonardo da Vinci",
    dica:"Sfumato é o esfumaçado de Leonardo: contornos que se dissolvem suavemente, como na Mona Lisa.",
    q:"O que é o sfumato, técnica de Leonardo da Vinci?", c:"Transição suave entre luz e sombra, sem contornos duros", e:["Aplicar tinta em pontos pequenos de cor pura","Pintar sobre reboco ainda úmido","Usar tinta bem espessa para criar relevo"] },
  { id:"claroescuro", grupo:"Técnica", icone:"🌓", nome:"Claro-escuro (chiaroscuro)", quando:"Renascimento e Barroco",
    def:"Forte contraste entre luz e sombra para criar volume e drama",
    resumo:"Uso de contrastes intensos entre áreas iluminadas e escuras. Dá volume às figuras, guia o olhar para o ponto principal e cria um clima dramático. No Barroco, Caravaggio e Rembrandt são mestres dessa técnica.",
    marcas:["Fundo escuro e luz focada","Volume e profundidade","Clima de drama e emoção"],
    artistas:"Caravaggio, Rembrandt, Vermeer (luz suave)",
    dica:"Claro-escuro é o contraste forte entre luz e sombra: dá volume e drama às figuras.",
    q:"Para que serve o claro-escuro?", c:"Dar volume e drama com contraste entre luz e sombra", e:["Esconder as pinceladas por completo","Pintar em cores puras sem sombra","Criar relevo com camadas grossas de tinta"] },
  { id:"perspectiva", grupo:"Técnica", icone:"📐", nome:"Perspectiva linear", quando:"Renascimento · séc. XV",
    def:"Cria a ilusão de profundidade com linhas que convergem para pontos de fuga",
    resumo:"Método matemático desenvolvido no Renascimento para representar o espaço tridimensional numa superfície plana. As linhas paralelas parecem convergir para um ou mais pontos de fuga, e os objetos diminuem com a distância.",
    marcas:["Ponto de fuga","Objetos menores ao longe","Espaço organizado e profundo"],
    artistas:"Leonardo da Vinci, Rafael, Masaccio",
    dica:"A perspectiva linear usa pontos de fuga para criar profundidade numa superfície plana.",
    q:"O que cria a ilusão de profundidade na perspectiva linear?", c:"Linhas que convergem para um ponto de fuga", e:["Contornos apagados com esfumaçado","Pinceladas grossas e visíveis","Pontos de cor pura"] },
  { id:"impasto", grupo:"Técnica", icone:"🖌️", nome:"Impasto", quando:"usada por Van Gogh e outros",
    def:"Tinta aplicada em camadas grossas, deixando relevo e pinceladas visíveis",
    resumo:"Tinta espessa aplicada com pincel ou espátula, que forma relevo e deixa as pinceladas à mostra. Dá textura e energia à superfície. Van Gogh a usou intensamente em obras como A Noite Estrelada e Os Girassóis.",
    marcas:["Relevo de tinta","Pinceladas marcadas","Textura que capta a luz"],
    artistas:"Van Gogh",
    dica:"Impasto é a tinta grossa que cria relevo: marca registrada das pinceladas de Van Gogh.",
    q:"Que técnica deixa a tinta em relevo, com pinceladas bem visíveis?", c:"Impasto", e:["Sfumato","Afresco","Aquarela"] },
  { id:"pontilhismo", grupo:"Técnica", icone:"⚫", nome:"Pontilhismo", quando:"final do século XIX · Seurat",
    def:"Pequenos pontos de cor pura que se misturam no olho de quem vê",
    resumo:"Técnica desenvolvida por Georges Seurat e Paul Signac. A imagem é construída com pequenos pontos de cores puras, que se misturam na visão do espectador. Van Gogh experimentou o pontilhado em Paris.",
    marcas:["Pontos de cor pura","Mistura óptica no olhar","Efeito vibrante de luz"],
    artistas:"Seurat, Signac",
    dica:"No pontilhismo, pequenos pontos de cor pura se misturam no olho, não na paleta.",
    q:"Como funciona o pontilhismo?", c:"Pontos de cor pura que se misturam na visão do espectador", e:["Tinta espessa aplicada com espátula","Contornos esfumaçados em camadas finas","Pintura sobre reboco úmido"] },
  { id:"arlivre", grupo:"Técnica", icone:"🌳", nome:"Pintura ao ar livre (en plein air)", quando:"Barbizon e Impressionismo",
    def:"Pintar diante da paisagem, fora do ateliê, para captar a luz do momento",
    resumo:"Pintar diretamente diante do tema, na natureza, em vez de no ateliê. Foi possível graças aos tubos de tinta portáteis. Permite captar a luz e as cores de um momento. Monet foi iniciado nela por Eugène Boudin.",
    marcas:["Pintura rápida diante do motivo","Luz natural e cores vivas","Tubos de tinta portáteis"],
    artistas:"Monet, Boudin, Pissarro",
    dica:"Pintar ao ar livre permitiu aos impressionistas captar a luz exata de cada momento.",
    q:"Por que os impressionistas pintavam ao ar livre?", c:"Para captar a luz e as cores do momento diante da paisagem", e:["Porque os ateliês eram proibidos por lei","Para pintar sem usar tinta","Para copiar quadros antigos"] },
  { id:"serie", grupo:"Técnica", icone:"🔁", nome:"Pintura em série", quando:"Monet · final do século XIX",
    def:"Pintar o mesmo tema em horas, estações e luzes diferentes",
    resumo:"Em vez de uma única tela, o artista pinta o mesmo motivo várias vezes para registrar como a luz e a atmosfera mudam. Monet fez isso com Os Álamos, a Catedral de Rouen e as Ninféias.",
    marcas:["Mesmo tema, luzes diferentes","Estudo da passagem do tempo","Cores e atmosfera que mudam"],
    artistas:"Monet",
    dica:"Em série, Monet repete o tema para mostrar como a luz muda ao longo do dia e do ano.",
    q:"Qual era o objetivo das séries de Monet?", c:"Mostrar como a luz muda o mesmo tema ao longo do tempo", e:["Vender mais cópias do mesmo quadro","Treinar alunos de ateliê","Copiar fotografias antigas"] },
  { id:"oleo", grupo:"Material", icone:"🎨", nome:"Pintura a óleo", quando:"difundida pelos flamengos a partir do séc. XV",
    def:"Pigmento misturado a óleo (como o de linhaça), de secagem lenta",
    resumo:"Tinta feita de pigmentos misturados a óleo, comumente o de linhaça. Seca devagar, o que permite misturar cores, corrigir e criar camadas translúcidas (veladuras). Tornou-se a técnica favorita da pintura europeia.",
    marcas:["Secagem lenta","Cores ricas e brilho","Camadas e veladuras"],
    artistas:"Leonardo, Rembrandt, Vermeer, Van Gogh, Monet",
    dica:"A tinta a óleo seca devagar: permite corrigir, misturar e criar camadas de luz.",
    q:"Qual é a principal vantagem da tinta a óleo?", c:"Seca devagar e permite misturar, corrigir e fazer camadas", e:["Seca imediatamente","Só funciona sobre parede úmida","Não permite misturar cores"] },
  { id:"tempera", grupo:"Material", icone:"🥚", nome:"Têmpera", quando:"antes da popularização do óleo",
    def:"Pigmento misturado a gema de ovo, de secagem rápida e acabamento fosco",
    resumo:"Tinta feita de pigmentos com um aglutinante como a gema de ovo. Seca rápido e tem acabamento fosco e luminoso. Foi muito usada na Idade Média e no início do Renascimento, antes do óleo.",
    marcas:["Secagem rápida","Acabamento fosco","Pinceladas finas e precisas"],
    artistas:"Botticelli",
    dica:"A têmpera usa gema de ovo como aglutinante: seca rápido e fica fosca.",
    q:"Qual material é aglutinante típico da têmpera?", c:"Gema de ovo", e:["Óleo de linhaça","Cera de abelha","Carvão"] },
  { id:"desenho", grupo:"Material", icone:"✏️", nome:"Desenho e estudos", quando:"todas as épocas",
    def:"Traços em papel com ponta de prata, sanguínea, giz, carvão ou pena e tinta",
    resumo:"O desenho serve para estudar, planejar e criar. Materiais comuns: ponta de prata, sanguínea (giz avermelhado), giz preto, carvão e pena com tinta. Muitos mestres, como Leonardo, fizeram estudos de anatomia, plantas e máquinas.",
    marcas:["Estudos preparatórios para pinturas","Sanguínea: tom avermelhado","Pena e tinta: traço firme e preciso"],
    artistas:"Leonardo da Vinci, Rembrandt, Van Gogh",
    dica:"Sanguínea, carvão, giz e pena e tinta são materiais de desenho usados em estudos.",
    q:"Que material de desenho tem tom avermelhado?", c:"Sanguínea", e:["Carvão","Ponta de prata","Tinta nanquim"] },

  /* ---------- gêneros e influências ---------- */
  { id:"retrato", grupo:"Gênero", icone:"🧑‍🎨", nome:"Retrato", quando:"todas as épocas",
    def:"Representa uma pessoa real, mostrando seus traços e sua personalidade",
    resumo:"Gênero que retrata uma pessoa específica. Mostra a aparência e, nos melhores casos, o caráter e o estado de espírito. Pode ser individual ou de grupo.",
    marcas:["Foco no rosto e na expressão","Pose e roupas que revelam status","Pode ser individual ou coletivo"],
    artistas:"Leonardo da Vinci, Rembrandt, Frans Hals",
    dica:"Retrato é o gênero que mostra uma pessoa real, seus traços e sua personalidade.",
    q:"Qual gênero representa uma pessoa real, com seus traços e personalidade?", c:"Retrato", e:["Natureza-morta","Paisagem","Pintura histórica"] },
  { id:"autorretrato", grupo:"Gênero", icone:"🪞", nome:"Autorretrato", quando:"todas as épocas",
    def:"O artista retrata a si mesmo, muitas vezes para refletir sobre sua vida",
    resumo:"Quando o artista é o seu próprio modelo. Rembrandt pintou dezenas de autorretratos ao longo da vida, como um diário visual do envelhecimento; Van Gogh também pintou muitos, por não ter dinheiro para pagar modelos.",
    marcas:["Olhar direto e introspectivo","Diário visual da vida do artista"],
    artistas:"Rembrandt, Van Gogh",
    dica:"Autorretrato é quando o artista é o próprio modelo, e pode ser um diário visual da vida.",
    q:"Como se chama a obra em que o artista retrata a si mesmo?", c:"Autorretrato", e:["Retrato de grupo","Natureza-morta","Pintura de gênero"] },
  { id:"paisagem", grupo:"Gênero", icone:"🏞️", nome:"Paisagem", quando:"todas as épocas",
    def:"Representa a natureza, o campo, a cidade ou o mar como tema principal",
    resumo:"Gênero que toma a natureza ou o espaço como tema principal: campos, mares, cidades, céus. Ganhou grande importância no Romantismo, na Escola de Barbizon e no Impressionismo.",
    marcas:["Céu, terra e água como protagonistas","Luz e atmosfera","Escala pequena das figuras humanas"],
    artistas:"Turner, Friedrich, Corot, Monet",
    dica:"Paisagem é o gênero cujo tema principal é a natureza ou o espaço.",
    q:"Qual gênero tem a natureza ou o espaço como tema principal?", c:"Paisagem", e:["Retrato","Autorretrato","Pintura de gênero"] },
  { id:"naturezamorta", grupo:"Gênero", icone:"🍎", nome:"Natureza-morta", quando:"auge no séc. XVII",
    def:"Representa objetos inanimados, como frutas, flores, vasos e utensílios",
    resumo:"Gênero que mostra objetos inanimados: flores, frutas, vasos, instrumentos. Foi muito apreciada na Holanda do século XVII e costuma carregar simbolismos sobre a passagem do tempo.",
    marcas:["Objetos do dia a dia organizados","Estudo de luz, textura e cores","Simbolismo sobre a vida e a morte"],
    artistas:"Van Gogh (Os Girassóis), Cézanne",
    dica:"Natureza-morta é o gênero de flores, frutas e objetos: estudo de forma, luz e cor.",
    q:"Como se chama o gênero que mostra flores, frutas e objetos inanimados?", c:"Natureza-morta", e:["Paisagem","Retrato","Pintura histórica"] },
  { id:"pinturagenero", grupo:"Gênero", icone:"🏠", nome:"Pintura de gênero", quando:"auge no séc. XVII holandês",
    def:"Cenas do cotidiano, como pessoas em casa, no trabalho ou no lazer",
    resumo:"Representa cenas do dia a dia: pessoas lendo, cozinhando, tocando música, conversando. Vermeer é um dos grandes mestres do gênero, com interiores silenciosos e luminosos.",
    marcas:["Interiores e cenas domésticas","Personagens anônimos","Luz suave, detalhes e silêncio"],
    artistas:"Vermeer, Pieter de Hooch, Jan Steen",
    dica:"Pintura de gênero é a cena do cotidiano, como as de Vermeer em interiores iluminados.",
    q:"Que gênero mostra cenas do dia a dia, como as de Vermeer?", c:"Pintura de gênero", e:["Pintura histórica","Paisagem","Autorretrato"] },
  { id:"japonismo", grupo:"Influência", icone:"🗾", nome:"Japonismo e estampas ukiyo-e", quando:"segunda metade do século XIX",
    def:"Influência das gravuras japonesas sobre os artistas europeus",
    resumo:"Quando o Japão se abriu ao Ocidente, as gravuras japonesas em xilogravura (ukiyo-e) chegaram à Europa e fascinaram os artistas. Inspiraram cores chapadas, enquadramentos inusitados e contornos marcados em pintores como Monet e Van Gogh. A página de Monet cita as gravuras de Hokusai.",
    marcas:["Cores planas e contornos fortes","Enquadramentos assimétricos","Temas de natureza e cotidiano"],
    artistas:"Monet, Van Gogh, Hokusai (japonês)",
    dica:"As gravuras japonesas (ukiyo-e) inspiraram Monet e Van Gogh com cores planas e enquadramentos novos.",
    q:"De onde vinha a inspiração japonesa dos pintores europeus do século XIX?", c:"Das gravuras ukiyo-e, como as de Hokusai", e:["Dos afrescos de Pompeia","Das tapeçarias flamengas","Dos vitrais góticos"] },
];

/* conceitos que cada capítulo de cada mestre ensina antes das perguntas */
const CAP_CONCEITOS = {
  "vangogh:nuenen":["realismo"],
  "vangogh:artista":["desenho","autorretrato"],
  "vangogh:paris":["impressionismo","japonismo","pontilhismo"],
  "vangogh:arles":["posimpressionismo","impasto","naturezamorta"],
  "vangogh:saintremy":["posimpressionismo"],
  "vangogh:auvers":["posimpressionismo","autorretrato"],
  "leonardo:vinci":["renascimento"],
  "leonardo:milao":["perspectiva","desenho"],
  "leonardo:ciencia":["desenho"],
  "leonardo:gioconda":["sfumato","retrato","oleo"],
  "leonardo:franca":["oleo"],
  "aleijadinho:vila-rica":["barroco"],
  "aleijadinho:congonhas":["barroco"],
  "dali:figueres":["cubismo","naturezamorta"],
  "dali:surrealismo":["surrealismo"],
  "dali:misticismo":["surrealismo"],
  "turner:londres":["desenho"],
  "turner:academia":["paisagem"],
  "turner:maturidade":["romantismo","paisagem"],
  "turner:veneza":["romantismo","paisagem"],
  "turner:legado":["romantismo","impressionismo"],
  "monet:havre":["arlivre"],
  "monet:londres":["paisagem","barbizon"],
  "monet:impressao":["impressionismo","arlivre"],
  "monet:giverny":["serie","japonismo"],
  "monet:ninfeias":["serie","impressionismo"],
  "rembrandt:leiden":["barroco"],
  "rembrandt:amsterda":["idadeouro","retrato"],
  "rembrandt:ronda":["claroescuro"],
  "rembrandt:ultimos":["autorretrato"],
  "tarsila:paris":["modernismo","cubismo","autorretrato"],
  "tarsila:antropofagia":["modernismo"],
  "tarsila:social":["modernismo"],
  "vermeer:delft":["idadeouro","pinturagenero"],
  "vermeer:luz":["barroco","oleo","claroescuro"],
};

const Conceitos = {
  lista: CONCEITOS,
  porId: Object.fromEntries(CONCEITOS.map(c=>[c.id, c])),
  get(id){ return this.porId[id]; },

  /* conceitos de uma obra do acervo, pelos campos movimento e técnica */
  deObra(o){
    if(!o) return [];
    const m = (o.movimento || "").toLowerCase(), t = (o.tecnica || "").toLowerCase(), out = [];
    if(/alta renascen|alto renascimento|renascimento|renascentista/.test(m)) out.push("renascimento");
    if(/maneirismo/.test(m)) out.push("maneirismo");
    if(/barroco/.test(m)) out.push("barroco");
    if(/idade de ouro/.test(m)) out.push("idadeouro");
    if(/neoclass/.test(m)) out.push("neoclassicismo");
    if(/romantismo/.test(m)) out.push("romantismo");
    if(/realismo/.test(m)) out.push("realismo");
    if(/pós-impress/.test(m)) out.push("posimpressionismo");
    if(/impressionismo/.test(m.replace(/pós-impressionismo/g,""))) out.push("impressionismo");
    if(/simbolismo|art nouveau/.test(m)) out.push("simbolismo");
    if(/cubismo/.test(m)) out.push("cubismo");
    if(/surrealismo/.test(m)) out.push("surrealismo");
    if(/óleo/.test(t)) out.push("oleo");
    if(/têmpera/.test(t)) out.push("tempera");
    if(/sanguínea|giz|ponta de prata|carvão|pena/.test(t)) out.push("desenho");
    return out.filter(id=>this.porId[id]);
  },
  doCapitulo(mestre, cap){ return (CAP_CONCEITOS[mestre+":"+cap] || []).filter(id=>this.porId[id]); },

  /* ---------- progresso ---------- */
  visto(id){ const P = Prog.P; if(!P.conceitos) P.conceitos = {}; if(!P.conceitos[id]){ P.conceitos[id] = 1; Prog.salvar(); } },
  totalVistos(){ return Object.keys(Prog.P.conceitos || {}).length; },

  /* ---------- cartões ---------- */
  cartao(c){
    return `<div class="cn-card"><div class="cn-cab"><span>${c.icone}</span><div><b>${c.nome}</b><small>${c.grupo} · ${c.quando}</small></div></div>
      <p>${c.resumo}</p>
      <ul>${c.marcas.map(m=>`<li>${m}</li>`).join("")}</ul>
      <div class="cn-art">🎨 ${c.artistas}</div></div>`;
  },
  /* bloco "Para entender" exibido antes de um capítulo */
  bloco(ids){
    const cs = ids.map(id=>this.porId[id]).filter(Boolean);
    if(!cs.length) return "";
    cs.forEach(c=>this.visto(c.id));
    return `<div class="cn-bloco"><div class="cn-tit">📘 Para entender este capítulo</div>${cs.map(c=>`<details class="cn-det"><summary>${c.icone} ${c.nome} <small>${c.quando}</small></summary>${this.cartao(c)}</details>`).join("")}</div>`;
  },

  /* ---------- perguntas ---------- */
  perguntas(ids, nivel){
    const n = NIVEIS[nivel].opcoes - 1, out = [];
    ids.map(id=>this.porId[id]).filter(Boolean).forEach(c=>{
      const outros = this.lista.filter(x=>x.id!==c.id);
      const mesmo = outros.filter(x=>x.grupo===c.grupo), pool = mesmo.length >= n ? mesmo : outros;
      const detalhe = `<b>${c.icone} ${c.nome}</b> (${c.quando}). ${c.resumo}`;
      // 1) manual
      out.push({ tipo:"conceito", texto:c.q, certa:c.c, opcoes:embaralhar([c.c, ...embaralhar(c.e).slice(0,n)]),
        custom:true, semObra:true, longo:true, detalhe, conceito:c.id });
      // 2) "qual descrição combina com..."
      out.push({ tipo:"conceito", texto:`Qual descrição combina com «${c.nome}»?`, certa:c.def,
        opcoes:embaralhar([c.def, ...embaralhar(pool).slice(0,n).map(x=>x.def)]),
        custom:true, semObra:true, longo:true, detalhe, conceito:c.id });
    });
    return out;
  },
  /* modo prática: conceitos de todos os grupos */
  fila(nivel, qtd){
    const vistos = new Set(), pool = this.perguntas(this.lista.map(c=>c.id), nivel);
    return embaralhar(pool).filter(q=>{ const k = q.texto+"|"+q.certa; if(vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, qtd);
  },

  /* linha de instrução mostrada depois de responder (um conceito novo por vez na rodada) */
  paraResposta(q, esc, jaMostrados){
    if(q.tipo === "conceito") return null;
    let ids = [];
    if(q.conceito) ids.push(q.conceito);
    if(q.obra) ids.push(...this.deObra(q.obra));
    if(esc && esc.tipo === "mestre") ids.push(...this.doCapitulo(esc.mestre, esc.valor));
    const id = ids.find(i=>this.porId[i] && !jaMostrados.has(i));
    return id ? this.porId[id] : null;
  },
  linhaResposta(c){
    return `<div class="cn-dica"><span>📘</span><div><b>${c.nome}</b> — ${c.dica} <button class="cn-mais" data-cn="${c.id}">Saber mais</button></div></div>`;
  },
};

/* modal com o cartão de um conceito (e guia completo) */
function abrirConceito(id){
  const c = Conceitos.get(id); if(!c) return;
  Conceitos.visto(id);
  const m = document.getElementById("modal");
  m.innerHTML = `<div class="caixa">${Conceitos.cartao(c)}<div class="jg-fb-btns" style="margin-top:12px"><button class="btn ouro" id="fecha-ficha">Fechar</button></div></div>`;
  m.classList.add("aberto");
  m.onclick = e => { if(e.target===m || e.target.id==="fecha-ficha") m.classList.remove("aberto"); };
}
function abrirGuia(){
  const m = document.getElementById("modal");
  const grupos = ["Movimento","Técnica","Material","Gênero","Influência"];
  m.innerHTML = `<div class="caixa"><h3>📘 Guia de arte</h3>
    <div class="art">${Conceitos.totalVistos()}/${Conceitos.lista.length} conceitos conhecidos · movimentos, técnicas, materiais e gêneros</div>
    ${grupos.map(g=>`<div class="sep">${g}</div>${Conceitos.lista.filter(c=>c.grupo===g).map(c=>`<details class="cn-det"><summary>${c.icone} ${c.nome} <small>${c.quando}</small></summary>${Conceitos.cartao(c)}</details>`).join("")}`).join("")}
    <div class="jg-fb-btns" style="margin-top:12px"><button class="btn ouro" id="fecha-ficha">Fechar</button></div></div>`;
  m.classList.add("aberto");
  m.onclick = e => { if(e.target===m || e.target.id==="fecha-ficha") m.classList.remove("aberto"); };
  m.querySelectorAll("details").forEach(d=>d.addEventListener("toggle", ()=>{ if(d.open){ const nome = d.querySelector("summary").textContent; const c = Conceitos.lista.find(x=>nome.includes(x.nome)); if(c) Conceitos.visto(c.id); } }));
}
