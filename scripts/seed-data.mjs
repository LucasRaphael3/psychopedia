// Demo content for local development only. Every account uses DEMO_PASSWORD.
export const DEMO_PASSWORD = "psychopedia123";

export const authors = [
  { name: "Ana Ribeiro", username: "ana_ribeiro", email: "ana@demo.psychopedia.dev", bio: "Psicóloga clínica, escreve sobre ansiedade e regulação emocional." },
  { name: "Bruno Takahashi", username: "bruno_t", email: "bruno@demo.psychopedia.dev", bio: "Pesquisador em neurociência cognitiva e sono." },
  { name: "Carla Mendes", username: "carlamendes", email: "carla@demo.psychopedia.dev", bio: "Terapeuta de casal e família. Interessada em teoria do apego." },
];

export const articles = [
  {
    author: "ana_ribeiro",
    category: "ansiedade",
    title: "Por que a respiração lenta acalma o corpo ansioso",
    summary: "Expirar devagar ativa o sistema parassimpático. Entenda o mecanismo e como praticar no dia a dia.",
    content: `Quando estamos ansiosos, o corpo entra em modo de alerta: o coração acelera, a respiração fica curta e os músculos se contraem. Essa resposta é útil diante de perigos reais, mas cansa quando dispara sem motivo claro.

## O papel da expiração

Expirações mais longas que as inspirações estimulam o nervo vago, que ajuda a desacelerar o ritmo cardíaco. Por isso técnicas como inspirar em quatro tempos e soltar o ar em seis costumam trazer alívio em poucos minutos.

## Como praticar

Escolha um momento neutro do dia, e não só as horas de crise, para treinar. Sente-se confortavelmente, apoie uma mão na barriga e observe o ar entrando e saindo. Cinco minutos diários criam familiaridade, e a técnica fica mais acessível quando a ansiedade aparecer.

Respirar não resolve as causas da ansiedade, mas é uma ferramenta simples para atravessar os picos com mais clareza.`,
  },
  {
    author: "bruno_t",
    category: "neurociencia",
    title: "O que acontece no cérebro enquanto você dorme",
    summary: "Durante o sono o cérebro consolida memórias e faz uma espécie de limpeza. Veja o que a pesquisa sabe até agora.",
    content: `Dormir não é desligar. Ao longo da noite o cérebro alterna entre fases de sono leve, profundo e REM, cada uma com funções diferentes.

## Memória

No sono profundo, regiões ligadas à memória reativam padrões vividos durante o dia. Esse "replay" parece ajudar a transferir informações para armazenamento de longo prazo.

## Limpeza

Estudos em animais sugerem que o fluxo de líquido entre as células cerebrais aumenta durante o sono, ajudando a remover resíduos metabólicos. Ainda há debate sobre como isso funciona em humanos, mas a hipótese reforça a importância de noites regulares.

## Emoções

O sono REM está associado ao processamento emocional. Pessoas privadas de sono tendem a reagir com mais intensidade a estímulos negativos.

Proteger o sono é, portanto, uma forma de cuidar da memória e do humor.`,
  },
  {
    author: "carlamendes",
    category: "relacionamentos",
    title: "Estilos de apego: como a infância influencia o amor adulto",
    summary: "Seguro, ansioso, evitativo: conhecer seu padrão de apego ajuda a entender reações nos relacionamentos.",
    content: `A teoria do apego propõe que as primeiras relações de cuidado moldam expectativas sobre proximidade e confiança. Na vida adulta, esses padrões aparecem principalmente nos relacionamentos amorosos.

## Os padrões mais descritos

Pessoas com apego seguro costumam se sentir confortáveis com intimidade e autonomia. No apego ansioso há medo de abandono e busca intensa por confirmação. No apego evitativo, a proximidade pode gerar desconforto e vontade de se afastar.

## Não é destino

Estilos de apego não são rótulos fixos. Relações estáveis, autoconhecimento e psicoterapia podem favorecer o que pesquisadores chamam de "segurança conquistada".

Perceber o próprio padrão é um primeiro passo para conversar com o parceiro sobre necessidades, em vez de agir apenas no automático.`,
  },
  {
    author: "ana_ribeiro",
    category: "trabalho",
    title: "Burnout não é preguiça: sinais de esgotamento profissional",
    summary: "Exaustão, cinismo e sensação de ineficácia formam o tripé do burnout. Saiba reconhecer cedo.",
    content: `O burnout é descrito como resultado de estresse crônico no trabalho que não foi gerenciado com sucesso. Ele costuma se instalar aos poucos, o que dificulta perceber quando começou.

## Três dimensões

A primeira é a exaustão: cansaço que não passa com fim de semana. A segunda é o distanciamento, muitas vezes na forma de cinismo em relação às tarefas e às pessoas. A terceira é a sensação de que nada do que se faz tem efeito.

## O que ajuda

Pausas reais, limites claros de horário e conversas francas sobre carga de trabalho são medidas importantes, mas nem sempre dependem só do indivíduo. Organizações têm papel central na prevenção.

Se os sintomas persistirem ou afetarem o sono e o humor, procurar um profissional de saúde é fundamental.`,
  },
  {
    author: "bruno_t",
    category: "personalidade",
    title: "Os cinco grandes traços de personalidade, explicados",
    summary: "Abertura, conscienciosidade, extroversão, amabilidade e neuroticismo: o modelo mais usado na pesquisa.",
    content: `O modelo dos Cinco Grandes Fatores descreve a personalidade em cinco dimensões contínuas. Em vez de tipos fechados, cada pessoa ocupa um ponto em cada espectro.

## As dimensões

Abertura à experiência envolve curiosidade e interesse por ideias novas. Conscienciosidade reúne organização e persistência. Extroversão diz respeito à busca de estímulo social. Amabilidade envolve cooperação e empatia. Neuroticismo indica a tendência a experimentar emoções negativas.

## Traços mudam?

Os traços são relativamente estáveis, mas não imutáveis. Em média, as pessoas tendem a ficar mais conscienciosas e emocionalmente estáveis com a idade.

Conhecer o próprio perfil pode ajudar a escolher ambientes e estratégias que combinem com seu jeito de ser.`,
  },
  {
    author: "carlamendes",
    category: "familia",
    title: "Como conversar com crianças sobre emoções difíceis",
    summary: "Nomear sentimentos, validar e oferecer segurança: um guia prático para pais e cuidadores.",
    content: `Crianças sentem raiva, medo e tristeza com a mesma intensidade que adultos, mas ainda estão aprendendo a reconhecer e expressar essas emoções.

## Nomear

Dizer em voz alta o que parece estar acontecendo ("você ficou frustrado porque a torre caiu") ajuda a criança a construir vocabulário emocional.

## Validar antes de corrigir

Validar não significa aprovar qualquer comportamento. É possível acolher o sentimento e, ao mesmo tempo, estabelecer limites: "tudo bem ficar com raiva, mas não vou deixar você bater".

## Ser modelo

Crianças aprendem observando. Quando um adulto reconhece os próprios erros e mostra como se acalma, oferece um exemplo concreto de regulação emocional.`,
  },
  {
    author: "ana_ribeiro",
    category: "depressao",
    title: "Tristeza ou depressão? Entenda a diferença",
    summary: "Toda depressão envolve tristeza, mas nem toda tristeza é depressão. Veja os sinais que pedem atenção.",
    content: `A tristeza é uma emoção natural diante de perdas e frustrações. Ela costuma ter causa identificável e diminui com o tempo e com apoio.

## Quando pode ser mais que tristeza

A depressão envolve um conjunto de sintomas que persistem por semanas: perda de interesse em atividades antes prazerosas, alterações de sono e apetite, cansaço, dificuldade de concentração e sentimentos de culpa ou inutilidade.

## Buscar ajuda

Depressão é uma condição de saúde tratável. Psicoterapia e, em alguns casos, medicação têm eficácia comprovada. Se você ou alguém próximo tiver pensamentos de se machucar, procure ajuda imediatamente: no Brasil, o CVV atende pelo 188, 24 horas por dia.`,
  },
  {
    author: "bruno_t",
    category: "crescimento-pessoal",
    title: "A ciência dos hábitos: por que a repetição vence a motivação",
    summary: "Hábitos se formam pela associação entre contexto e ação. Motivação ajuda a começar, mas não sustenta.",
    content: `Grande parte do que fazemos diariamente acontece no automático. Hábitos economizam energia mental ao associar um contexto a uma ação.

## Contexto, ação, recompensa

Um hábito costuma começar com uma deixa (um horário, um lugar, uma emoção), seguida da ação e de alguma recompensa. Com repetições, a ligação entre deixa e ação se fortalece.

## Dicas baseadas em evidências

Comece pequeno: duas flexões por dia são mais sustentáveis que uma hora de academia. Ancore o novo hábito em algo que você já faz, como ler uma página após o café. E reduza o atrito: deixe o livro na mesa, não na estante.

Estudos sugerem que a automatização leva semanas a meses e varia muito entre pessoas. Paciência faz parte do processo.`,
  },
  {
    author: "carlamendes",
    category: "relacionamentos",
    title: "Brigas de casal: o que diferencia conflitos saudáveis",
    summary: "Discordar é inevitável. O que importa é como o casal briga e como se reconecta depois.",
    content: `Casais estáveis também brigam. A diferença está menos na frequência dos conflitos e mais na forma como eles acontecem.

## Padrões que desgastam

Críticas ao caráter do outro, desprezo, postura defensiva e o silêncio prolongado tendem a corroer a relação ao longo do tempo.

## O que ajuda

Falar sobre a própria necessidade em vez de acusar ("eu me sinto sozinho quando...") reduz a defensividade. Fazer pausas quando a discussão esquenta evita palavras que machucam. E tentativas de reparo, como um toque, uma piada ou um pedido de desculpas, são sinais de cuidado.

Conflitos bem conduzidos podem até aproximar o casal, porque revelam necessidades que precisavam ser ditas.`,
  },
];
