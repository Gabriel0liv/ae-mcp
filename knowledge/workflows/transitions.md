# Workflow: Transitions & Cuts (Whips, Zooms & RTFX Presets)

## Quando Usar
* Para conectar diferentes tomadas ou cenas de forma contínua em edições de MMV/AMV.
* Para dar fluidez à narrativa visual, acompanhando a direção de movimento dos objetos na tela (ex: um soco para a direita seguido de um deslocamento rápido de câmera para a direita).
* Para criar impacto estilizado e surpresa no drop da música.

## Formas Possíveis
1. **Nativa**: Transições de zoom rápido (**Zoom Transitions**), chicotes de movimento (**Whip Pans** ou deslizamentos), e cortes de escala, controlados por um Null Object comum e suavizados com **Motion Tile** e curvas de Bezier atenuadas.
2. **Plugins/Presets**: Transições do pack **RTFX**, transições do **Sapphire** (`S_DissolveWhip`, `S_DissolveZoom`, `S_BlurMoCurves`), ou presets de terceiros.
3. **Scripts/Expressões**: Automatização de transições de corte ou mistura cromática controladas por marcadores na timeline do After Effects.

## Método Nativo
Para criar uma transição de **Chicote de Câmera (Whip Pan)** nativa entre dois clipes:
1. Posicione o `Clipe A` e o `Clipe B` lado a lado na timeline, com uma sobreposição de 10 quadros (frames).
2. Crie um **Null Object** no topo, ative a chave 3D (se necessário) ou mantenha 2D, e vincule ambos os clipes a ele.
3. No `Clipe A` e no `Clipe B`, aplique o efeito **Motion Tile** como primeiro efeito de cada um. Configure `Output Width` e `Output Height` para `300%` e marque `Mirror Edges` (Crucial!).
4. No Null Object, crie dois keyframes na propriedade **Position** ao longo dos 10 quadros de sobreposição:
   * Frame Inicial: `[960, 540]` (Posição padrão Full HD).
   * Frame Final: `[-960, 540]` (Desloca um frame de tela inteiro para a esquerda, trazendo o Clipe B para o centro se ele estiver parentado e posicionado originalmente ao lado).
5. Selecione os keyframes de Posição do Null, aperte `F9` (Easy Ease) e ajuste o gráfico de velocidade:
   * Puxe a alça do primeiro keyframe para a direita (influência de 90%) e a alça do segundo para a esquerda (influência de 90%). Isso criará um pico de velocidade absurdo exatamente no meio do corte, com entradas e saídas suaves.
6. Ative o **Motion Blur** na timeline global e nas camadas para gerar o rastro de desfoque.

## Método com Plugins/Presets
* **Sapphire S_BlurMoCurves**:
  * Para obter o melhor desfoque de movimento em chicotes ou zooms de transição: substitua o deslocamento do Null ou use `S_BlurMoCurves` no clipe. Ele permite animar a rotação, escala e posição integrando desfoque de movimento de sub-pixel muito superior ao renderizador nativo do AE.
* **Pack de Transições RTFX**:
  1. Escolha a transição elementar de fumaça, fogo ou impacto no painel do RTFX.
  2. Insira a transição de mídias de partículas no corte entre o Clipe A e o Clipe B.
  3. Sincronize a maior densidade visual da transição exatamente no frame de transição de áudio.

## Método com Scripts/Expressões
Se desejar automatizar a opacidade ou o corte de transição usando um marcador na timeline:
```javascript
// O layer pisca ou corta para 100% de opacidade apenas durante a duração da transição no marcador
m = marker;
if (m.numKeys > 0) {
  k = m.nearestKey(time);
  t = time - k.time;
  dur = 0.2; // duração da transição em segundos
  if (t >= -dur/2 && t <= dur/2) {
    linear(t, -dur/2, 0, 0, 100); // Surge e some rápido
  } else {
    0;
  }
} else {
  0;
}
```

## Problemas Comuns
* **"Bordas Reveladas" ou Quebra de Seamless**: O clipe de fundo é exibido cru ou a borda preta vaza no Gráfico de Curva de velocidade máxima. *Solução*: Verifique a ordem dos efeitos: o **Motion Tile** deve estar sempre acima de qualquer efeito de distorção ou transformação 3D no painel Effect Controls.
* **Desfoque de Movimento Insuficiente**: O movimento de câmera ocorre mas a transição parece seca. *Solução*: Verifique se o Motion Blur está ativo na camada de Null Object e nos layers filhos individuais, além do interruptor geral de preview da timeline.

## Checklist de Diagnóstico
- [ ] O **Motion Tile** está ativado com `Mirror Edges` marcado nos layers envolvidos?
- [ ] Os clipes de vídeo estão parentados ao Null Object que realiza a animação?
- [ ] A velocidade das curvas no Gráfico de Velocidade está concentrada no frame exato do corte?
- [ ] A chave global de **Motion Blur** da timeline está ativa (azul)?

## Sugestões para MMV
* Coordene a direção do movimento da transição com a ação da mídia: se o personagem chuta de cima para baixo, faça uma transição de chicote (Whip) de cima para baixo. Isso cria um senso de continuidade invisível de alto nível.

## Limitações
* Transições excessivas cansam o espectador e destroem a narrativa visual. Use-as estrategicamente nas batidas mais fortes e utilize cortes secos (hard cuts) nos compassos intermediários.
