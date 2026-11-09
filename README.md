# Last Key — Arte integrada (1.1.0)

Jogo de sobrevivência para dois jogadores, no mesmo computador ou online.

## Executar

Use Node.js 22 ou superior:

```sh
npm ci
npm start
```

Abra `http://localhost:3000`. Para hospedar no Render, selecione este repositório,
branch `main`, diretório raiz vazio, build `npm ci --omit=dev`, início `npm start`
e health check `/`. O servidor aceita a variável `PORT` da hospedagem.
Mantenha uma única instância: as salas estão na memória e reinícios encerram partidas.

Os dois jogadores online abrem o mesmo endereço HTTPS. Um cria a sala e o outro
informa seu código. Não precisam estar na mesma rede.

## Controles e animações

- P1 / online: WASD, mouse para direção, clique esquerdo para tiro, botão direito
  para mira de precisão, R para recarregar e E para bancada/reanimação.
- P2 local: setas, IJKL para direção ou H/M para giro, Espaço para tiro,
  Shift direito para mira de precisão, U para recarregar, O para interação.
- Gamepad P2: analógicos, RT tiro, LT mira, X recarga, A interação.

Os sete PNGs fornecidos ficam em `public/sprites/`. São imagens estáticas:
passos alternados, balanço, recuo, movimento de recarga e rotação das armas são
animados no Canvas. Os corpos permanecem em pé; as armas acompanham a mira.
A mira reduz a velocidade, estreita o leque de projéteis extras e contrai o retículo.

## Habilidades

Cada jogador escolhe **até cinco habilidades distintas**, entre dez opções.
Cada habilidade tem **cinco níveis**: máximo de 25 upgrades por jogador.
Cada nível custa uma carga da equipe. Um slot ocupado pode continuar recebendo
níveis mesmo depois de preencher os cinco slots. A bancada mostra os efeitos,
os cinco indicadores de nível e bloqueia compras inválidas. Os slots também
aparecem no HUD. A escolha vale para a operação atual; não há troca de habilidade.

A dupla começa com quatro cargas; salas de combate comuns dão cinco ao serem
concluídas, chefes dão oito, e cada novo setor dá dez. É preciso coletar os núcleos.

## Campanha

Além das áreas originais, há dois novos setores com três ondas e recompensas:

- **Fundição de Âmbar**: pisos de metal, grelhas quentes e paleta ocre.
- **Jardim Biológico**: piso orgânico, vegetação mutante e paleta musgo.

Os pisos e paredes usam contornos escuros e cores que acompanham a arte dos
personagens. A rota procedural foi ampliada para quatro fileiras. Para despertar
o Colosso, é necessário derrotar os dois chefes anteriores e concluir os dois
novos setores. A chave continua com o portador dourado.

O boss final tem uma **cutscene de sete segundos**, com abertura das portas de
contenção, aproximação do retrato, falas e barras de cinema. O anfitrião controla
a duração e sincroniza o estado com o convidado. Movimento, ataques e dano ficam
pausados durante a cena. Ela ocorre uma vez por operação e não é pulável.
A extração exige a chave, três chefes derrotados, os dois setores concluídos e
os dois jogadores vivos na plataforma.

## Testar

```sh
npm ci
npx playwright install chromium
npm test
```

Se já houver Chromium instalado, informe `CHROMIUM_PATH=/caminho/do/chromium`.
Em Linux, o teste também procura `/usr/bin/chromium`. Os testes executam o jogo
em navegador, verificam 100 mapas, compras e limites, animações/tiro/mira,
ondas e condições de vitória e duas sessões online, incluindo a cutscene.
As capturas ficam em `test-results/` (ignoradas no Git).

`last-key.zip` é o pacote original, preservado como recebido; para a versão
atualizada, use os arquivos da raiz deste repositório.
