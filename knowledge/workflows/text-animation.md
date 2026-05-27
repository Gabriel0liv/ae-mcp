# Workflow: Text & Typography Animation (Flickers & Kinetic Style)

## Quando Usar
* Em aberturas de MMV, apresentações de créditos, inserções de letras de música (Lyrics edits) ou títulos estilizados.
* Para dar dinamismo e impacto visual a textos no ritmo das batidas (beat sync).
* Estética cyberpunk, grunge ou minimalista dark/action comum em AMVs.

## Formas Possíveis
1. **Nativa**: Uso de **Text Animators** (seletores de faixa, seletor de caracteres, expressões de texto) e efeitos nativos como **Calculations**, **Shift Channels** e **Glow**.
2. **Plugins/Presets**: Presets de texto do **Sapphire** (`S_GlitchText`), ou presets de distorção e text animators instalados localmente.
3. **Scripts/Expressões**: Expressões na opacidade ou posição do texto, como tremores de caracteres ou sincronização de caractere por caractere baseados em marcadores ou código de tempo.

## Método Nativo
Para criar um título com surgimento estilizado e cintilante (flicker):
1. Crie uma camada de Texto (`Ctrl+Alt+Shift+T`).
2. Abra o menu da camada de texto no painel da timeline, clique em **Animate** (ao lado de Text) e selecione **Opacity**.
3. No seletor criado (`Animator 1`), configure `Opacity` para `0%`.
4. Abra o `Range Selector 1` e clique em *Advanced*:
   * Altere `Shape` para **Ramp Up**.
   * Altere `Ease High` para `100%` e `Ease Low` para `100%`.
5. Anime a propriedade **Offset** de `-100%` a `100%` para fazer os caracteres surgirem da esquerda para a direita.
6. **Efeito Flicker (Strobe)**:
   * Clique em *Add* ao lado do Animator 1, escolha *Selector > Wiggly*.
   * No `Wiggly Selector 1`, configure:
     * `Wiggles/Second`: `20` a `30`.
     * `Correlation`: `0%` (caracteres cintilam individualmente).
     * `Min Amount` de Opacidade: `0%`, `Max Amount`: `100%`.
   * Isso criará um efeito orgânico de letras piscando ao entrarem em cena.

## Método com Plugins/Presets
* **Sapphire S_GlitchText**:
  * Aplique diretamente a uma camada de texto ou de mídias sólidas.
  * Ajuste o parâmetro `Frequency` para regular o ritmo das distorções de cor digitais nas letras.
* **Mister Horse Text Animation Presets**:
  * Importe presets de entrada/saída tipo ffx direto para caracteres, linhas ou palavras para aceleração drástica de workflow.

## Método com Scripts/Expressões
Para fazer a opacidade geral do texto piscar como lâmpada quebrada de forma procedural (expressão em `Opacity` do layer):
```javascript
minVal = 20; // Opacidade mínima
maxVal = 100; // Opacidade máxima
freq = 24; // Frequência de oscilação
seedRandom(index, true);
val = random(minVal, maxVal);
if (random(0, 100) > 80) { // 20% de chance de piscar para preto
  0;
} else {
  Math.sin(time * freq) * (maxVal - minVal)/2 + (maxVal + minVal)/2;
}
```

## Problemas Comuns
* **Textos Desalinhados**: Ao animar a escala dos caracteres, as letras mudam de tamanho desalinhando as palavras. *Solução*: Verifique a propriedade **Grouping Alignment** do Animator de texto. Por padrão, está configurada em 0%, 0%. Altere se necessário para alinhar a âncora na base ou no topo dos caracteres individuais.
* **Flicker Irritante ou Muito Lento**: O piscar das letras não acompanha a taxa de quadros ou fica artificial demais. *Solução*: Force a expressão de flicker a rodar no framerate da composição usando a função `posterizeTime(24)` na primeira linha do código da expressão.

## Checklist de Diagnóstico
- [ ] A âncora de ancoragem de caracteres está alinhada para evitar movimentos de escala indesejados?
- [ ] O **Wiggly Selector** está aplicando opacidade de forma independente aos caracteres e não ao bloco inteiro?
- [ ] O **Motion Blur** de texto está ativado para suavizar o deslocamento das letras rápidas?

## Sugestões para MMV
* Adicione um efeito de aberração cromática rápido nas letras no frame exato da batida.
* Combine o texto animado com efeitos de transição rápidos (como fumaça ou poeira de partícula em camadas intermediárias) para uma fusão orgânica dos títulos no anime edit.

## Limitações
* Editores de texto complexos dentro de seletores nativos do After Effects podem ter um comportamento de processamento instável se a fonte do caractere tiver glifos pesados ou texturas 3D incorporadas.
