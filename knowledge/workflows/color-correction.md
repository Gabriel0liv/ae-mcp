# Workflow: Color Correction & Color Grading (Dark/Action Anime Style)

## Quando Usar
* Em edições de MMV/AMV focadas em ação, lutas violentas e cenas escuras (estilo *dark/moody*).
* Para homogeneizar diferentes clipes de anime que possuem paletas de cores originais discrepantes.
* Para intensificar a atmosfera de suspense, agressividade ou mistério.

## Formas Possíveis
1. **Nativa**: Uso de curvas de tom (**Curves**), matiz/saturação (**Hue/Saturation**), **Levels**, e **Lumetri Color**.
2. **Plugins/Presets**: **Magic Bullet Looks** (MBL), **Sapphire S_Grad** ou **S_Tint**, e LUTs personalizadas (`.cube`).
3. **Scripts/Expressões**: Vinculação de intensidade de coloração a marcadores ou amplitude de áudio para efeitos de flash de cor reativos.

## Método Nativo
1. Crie um **Adjustment Layer** no topo da composição e chame-o de `CC_Base`.
2. Aplique o efeito **Curves**:
   * No canal RGB, crie uma curva em "S" suave para aumentar o contraste (escurecer sombras e clarear realces).
   * No canal Azul, eleve um pouco a curva nas sombras (para dar um tom azulado/frio) e abaixe levemente nos realces (para aquecer as luzes altas com amarelo/laranja).
   * No canal Verde, abaixe ligeiramente os tons médios para puxar para tons mais magentas e roxos.
3. Aplique o efeito **Lumetri Color** para ajustes finos:
   * Na seção *Basic Correction*, diminua a exposição geral (`Exposure: -0.2` a `-0.5`) se o anime for muito claro.
   * Aumente os pretos (`Blacks: -10`) e diminua as sombras (`Shadows: -5`).
   * Na seção *Creative*, aumente a nitidez (`Sharpen: 10` a `20`) para definir melhor as linhas do desenho (traço do anime).
   * Ajuste o vibrance para manter tons de pele, mas reduza a saturação geral se quiser um visual mais soturno.

## Método com Plugins/Presets
* **Magic Bullet Looks (MBL)**:
  1. Aplique o `Looks` em um Adjustment Layer.
  2. Dentro da interface do Looks, adicione ferramentas na ordem correta:
     * **Subject (Entrada)**: *Colorista* para balanço inicial de exposição.
     * **Matte (Filtros)**: *Diffusion* ou *Anamorphic Flare* suave para simular espalhamento de luz em cenas de ação.
     * **Camera (Lente)**: *Vignette* para focar o olhar no centro do clipe e escurecer as bordas, e *Chromatic Aberration* (Aberração Cromática) nas bordas.
     * **Post (Saída)**: *S-Curve* para contraste agressivo de ação.
* **Sapphire CC (S_Tint / S_Grad / S_FilmEffect)**:
  1. Use `S_Tint` para colorizar rapidamente cenas de ação (tons de azul escuro ou roxo/magenta).
  2. Ajuste a cor de sombra (`Tint Color`) para azul escuro/ciano e a cor de luz alta (`White Point`) para uma cor quente complementar.

## Método com Scripts/Expressões
Se quiser que o gradiente ou a exposição reaja à batida da música (beat sync):
1. Converta o áudio em keyframes (`Keyframe Assistant > Convert Audio to Keyframes`).
2. Adicione o efeito **Levels** a um Adjustment Layer.
3. Alt+clique no cronômetro da propriedade **Input White** (ou no slider de exposição do Lumetri) e vincule ao slider `Both Channels` do layer de áudio gerado com um limitador:
```javascript
audio = thisComp.layer("Audio Amplitude").effect("Both Channels")("Slider");
minAudio = 10;
maxAudio = 30;
maxExposicao = 1.5; // Exposição máxima no pico
linear(audio, minAudio, maxAudio, 0, maxExposicao);
```

## Problemas Comuns
* **Banding (Degradê "Tachado")**: Tons escuros de animes compactados em 8-bits sofrem com artefatos de compressão visual ao serem muito contrastados ou colorizados. *Solução*: Altere as configurações de profundidade da composição de `8-bpc` para `16-bpc` ou `32-bpc` (Alt+clique no indicador `8bpc` na parte inferior do painel Project). Adicione um leve ruído nativo (**Noise** a `1%` ou `2%`) para quebrar o banding.
* **Linhas de Contorno Estouradas**: O aumento de contraste ou nitidez em excesso deixa as bordas pretas do anime pixeladas ou serrilhadas. *Solução*: Reduza o ganho de contraste nas mídias originais e use máscaras suaves de nitidez.

## Checklist de Diagnóstico
- [ ] A profundidade de cor da composição está definida para pelo menos `16-bpc`?
- [ ] Os pretos estão "esmagados" a ponto de perder detalhes cruciais das mídias originais?
- [ ] O ajuste de nitidez (sharpen) gerou ruído excessivo ou serrilhados nas linhas dos desenhos?

## Sugestões para MMV
* Para estilo *dark/action*, mantenha uma tonalidade geral dessaturada azulada/acinzentada, mas aplique um contraste de cor forte (ex: olhos vermelhos brilhando ou magia roxa com saturação alta).

## Limitações
* CC pesadas aplicadas de forma global podem esconder inconsistências de luminosidade entre clipes, mas também podem apagar detalhes expressivos do personagem nas sombras.
