const SIGNATURE = [
  '██   █  █  █ ███ ███ █',
  '█ █ █ █ ██ █  █  █   █',
  '█ █ ███ █ ██  █  ██  █',
  '█ █ █ █ █  █  █  █   █',
  '██  █ █ █  █ ███ ███ ███',
  '',
  'psst: the lounge has a bell. try ring()',
].join('\n');

const SIGNATURE_PT = SIGNATURE.replace('psst: the lounge has a bell. try ring()', 'psst: o lounge tem um sino. tente ring()');

const EN = {
  'run.header': 'maître run --task "present daniel"',
  'run.skip': 'skip',
  'run.done': 'run complete',
  'run.reduced': 'Reduced motion is on, so the run stays finished.',
  'run.planner': ['read profile → 4 sections', 'plan: hero, work, experience'],
  'run.builder': ['render experience/aegro', 'render projects/maitre', 'tests: green'],
  'run.reviewer': ['checking claims against the CV', 'no invented facts ✓', 'approved by a human ✓'],

  'cmd.help': [
    'help           this list',
    'whoami         who is this',
    'ls             list files',
    'cat about.txt  a short intro',
    'contact        ways to reach me',
    'cv             print the résumé',
    'lang pt|en     switch language',
    'replay         run the opening again',
    'clear          clear the screen',
    'hint           a nudge, if you are stuck',
  ],
  'cmd.whoami': 'Daniel Rodrigues, full-stack software engineer in Porto Alegre, Brazil. Builds multi-agent orchestration and AI harness at Aegro.',
  'cmd.ls': 'about.txt  experience/  projects/  secrets.env',
  'cmd.about': 'Full-stack software engineer building multi-agent orchestration and AI harness at Aegro. Agents plan, implement, test and review; a human approves. Based in Porto Alegre, Brazil.',
  'cmd.contact': [
    'email     dani.araujo2002@gmail.com',
    'linkedin  linkedin.com/in/danielrdgg',
    'github    github.com/danielrdg',
  ],
  'cmd.cv': 'Opening the print dialog. Save as PDF from there.',
  'cmd.lang': 'Language set to English.',
  'cmd.replay': 'Replaying the run.',
  'cmd.notfound': 'command not found: {input}. Try "help".',

  'egg.approval': '⛔ reviewer: irreversible action, needs human approval.',
  'egg.sudo': 'permission granted. Hiring is a human decision, so here are the contact options.',
  'egg.secrets': [
    'API_KEY=██████████████',
    'DB_PASSWORD=████████',
    'NOTE=██████ ██ ████ ██████',
    'Nice try. The agents do not get to read these either.',
  ].join('\n'),
  'egg.nitpick': [
    'nit: this page has no dark mode toggle. It is dark. Always. Closing as wontfix.',
    'nit: "multi-agent" has a hyphen here and a space in my head. Pick one.',
    'nit: the footer light switch is hidden. Discoverability: 2/10. Hidden on purpose: 10/10.',
    'nit: the run finishes in 3 seconds. A real pipeline would still be on the lint step.',
    'nit: nine easter eggs, zero unit tests for the fun ones. Oh wait, there are tests.',
    'nit: too many pixels in the avatar. Approved anyway.',
  ],
  'egg.konami': 'swarm mode: 24 agents, zero standups.',
  'egg.janitor': 'the janitor agent is sweeping the status bar.',
  'egg.night': 'night shift: the long-shift agent is on duty.',
  'egg.bell': 'ding. The one agent that needs you has arrived.',
  'egg.lounge': 'lights off. Welcome to the lounge. The résumé is now the house menu.',
  'egg.found': 'easter eggs found: {n}/{total}',

  'hint.lounge': 'The office has a light switch. Somewhere near the bottom of the page.',
  'hint.approval': 'Ask the reviewer to do something it should never do without a human.',
  'hint.sudo': 'Try asking for what you actually want, with the right privileges.',
  'hint.secrets': 'ls shows a file that looks like it should not be there. Read it.',
  'hint.nitpick': 'The reviewer chip has opinions. Poke it a few times.',
  'hint.konami': 'A classic cheat code from 1986. You know the one.',
  'hint.janitor': 'Do nothing for a minute. Seriously, just wait.',
  'hint.night': 'Come back after 22:00 or before 06:00, local time.',
  'hint.bell': 'Open the devtools console. Someone left a note.',
  'hint.all': 'All nine found. The lounge is yours.',

  'console.signature': SIGNATURE,
};

const PT = {
  'run.header': 'maître run --task "present daniel"',
  'run.skip': 'pular',
  'run.done': 'execução concluída',
  'run.reduced': 'Movimento reduzido ativo: a execução fica concluída.',
  'run.planner': ['lendo perfil → 4 seções', 'plano: hero, trabalhos, experiência'],
  'run.builder': ['renderizando experience/aegro', 'renderizando projects/maitre', 'testes: verdes'],
  'run.reviewer': ['conferindo afirmações com o CV', 'nenhum fato inventado ✓', 'aprovado por um humano ✓'],

  'cmd.help': [
    'help           esta lista',
    'whoami         quem sou eu',
    'ls             listar arquivos',
    'cat about.txt  uma apresentação curta',
    'contact        como falar comigo',
    'cv             imprimir o currículo',
    'lang pt|en     trocar o idioma',
    'replay         rodar a abertura de novo',
    'clear          limpar a tela',
    'hint           uma dica, se você travar',
  ],
  'cmd.whoami': 'Daniel Rodrigues, engenheiro de software full stack em Porto Alegre, Brasil. Constrói orquestração multiagente e AI harness na Aegro.',
  'cmd.ls': 'about.txt  experience/  projects/  secrets.env',
  'cmd.about': 'Engenheiro de software full stack construindo orquestração multiagente e AI harness na Aegro. Agentes planejam, implementam, testam e revisam; um humano aprova. Mora em Porto Alegre, Brasil.',
  'cmd.contact': [
    'email     dani.araujo2002@gmail.com',
    'linkedin  linkedin.com/in/danielrdgg',
    'github    github.com/danielrdg',
  ],
  'cmd.cv': 'Abrindo a janela de impressão. Salve como PDF por lá.',
  'cmd.lang': 'Idioma alterado para português.',
  'cmd.replay': 'Repetindo a execução.',
  'cmd.notfound': 'comando não encontrado: {input}. Tente "help".',

  'egg.approval': '⛔ reviewer: ação irreversível, precisa de aprovação humana.',
  'egg.sudo': 'permissão concedida. Contratar é decisão de humano, então aqui estão as opções de contato.',
  'egg.secrets': [
    'API_KEY=██████████████',
    'DB_PASSWORD=████████',
    'NOTA=██████ ██ ████ ██████',
    'Boa tentativa. Nem os agentes podem ler isso.',
  ].join('\n'),
  'egg.nitpick': [
    'nit: esta página não tem botão de modo escuro. Ela é escura. Sempre. Fechando como wontfix.',
    'nit: "multiagente" aqui está junto e na minha cabeça está separado. Escolha um.',
    'nit: o interruptor do rodapé está escondido. Facilidade de achar: 2/10. Escondido de propósito: 10/10.',
    'nit: a execução termina em 3 segundos. Um pipeline de verdade ainda estaria no lint.',
    'nit: nove easter eggs, zero testes para os divertidos. Ah, espera, tem testes.',
    'nit: pixels demais no avatar. Aprovado mesmo assim.',
  ],
  'egg.konami': 'modo enxame: 24 agentes, zero dailies.',
  'egg.janitor': 'o agente zelador está varrendo a barra de status.',
  'egg.night': 'turno da noite: o agente do turno longo está de plantão.',
  'egg.bell': 'ding. O único agente que precisa de você chegou.',
  'egg.lounge': 'luzes apagadas. Bem-vindo ao lounge. O currículo agora é o cardápio da casa.',
  'egg.found': 'easter eggs encontrados: {n}/{total}',

  'hint.lounge': 'O escritório tem um interruptor de luz. Em algum lugar perto do fim da página.',
  'hint.approval': 'Peça ao reviewer algo que ele nunca deveria fazer sem um humano.',
  'hint.sudo': 'Peça o que você realmente quer, com os privilégios certos.',
  'hint.secrets': 'O ls mostra um arquivo que não deveria estar ali. Leia-o.',
  'hint.nitpick': 'O chip do reviewer tem opiniões. Cutuque algumas vezes.',
  'hint.konami': 'Um código clássico de 1986. Você conhece.',
  'hint.janitor': 'Não faça nada por um minuto. Sério, só espere.',
  'hint.night': 'Volte depois das 22h ou antes das 6h, no seu horário local.',
  'hint.bell': 'Abra o console do devtools. Alguém deixou um recado.',
  'hint.all': 'Os nove encontrados. O lounge é seu.',

  'console.signature': SIGNATURE_PT,
};

export const COPY = { en: EN, pt: PT };

export function t(lang, key, vars) {
  let v = COPY[lang] && key in COPY[lang] ? COPY[lang][key] : COPY.en[key];
  if (v === undefined) return key;
  if (!vars) return v;
  const fill = (s) => s.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
  return Array.isArray(v) ? v.map(fill) : fill(v);
}
