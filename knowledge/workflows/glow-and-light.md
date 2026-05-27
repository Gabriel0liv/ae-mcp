# Workflow: Glow & Light Effects (Deep Glow, Saber & Highlights)

## Quando Usar
* Para dar estilo luminoso (highlights) a golpes de espada, olhos brilhando, explosões ou magias em edits de ação/MMV.
* Para suavizar mídias escuras com efeitos de vazamento de luz (*light leaks*) ou atmosfera volumétrica de iluminação.
* Estética de anime moderna e vibrante (estilo ufotable / Demon Slayer).

## Formas Possíveis
1. **Nativa**: Efeito **Glow** padrão, duplicando a camada com modos de mesclagem como **Add** ou **Screen**, e aplicando **Fast Box Blur**.
2. **Plugins/Presets**: **Deep Glow** (geração de decaimento físico exponencial de luz), **Saber** da VideoCopilot (luzes de energia e neon), e Sapphire **S_Glow** ou **S_GlowDist**.
3. **Scripts/Expressões**: Expressões na opacidade ou intensidade do brilho para fazê-lo pulsar ritmicamente de acordo com o áudio ou de forma aleatória.

## Método Nativo
Para simular um glow de alta qualidade nativamente (sem plugins de terceiro):
1. Selecione o layer e aplique o efeito **Glow** padrão do AE. Configure:
   * `Glow Threshold`: `60%` (regula quais partes da imagem brilharão; menores valores fazem brilhar mais áreas).
   * `Glow Radius`: `10` (brilho curto e denso).
   * `Glow Intensity`: `1.0`.
2. Duplique o efeito Glow no mesmo layer (selecione e pressione `Ctrl+D`). No segundo Glow, altere:
   * `Glow Radius`: `80` a `150` (brilho largo e atmosférico).
   * `Glow Intensity`: `0.5`.
3. Duplique o efeito Glow uma terceira vez. No terceiro Glow, altere:
   * `Glow Radius`: `400` a `600` (espalhamento de cor volumétrico).
   * `Glow Intensity`: `0.2`.
* *Dica Extra*: Mude o renderizador de cores da composição para `16-bit` ou `32-bit` para obter decaimentos de luz suaves sem faixas de degradê (banding).

## Método com Plugins/Presets
* **Deep Glow (Plugin pago mais popular)**:
  1. Aplique `Deep Glow` diretamente na camada.
  2. Ajuste `Radius` para regular o tamanho do decaimento físico realista da luz.
  3. Marque a opção `Enable Chromatic Aberration` para simular dispersão de prisma de lente real nas bordas luminosas (comum em edições anime dark/action).
  4. Use a propriedade `Input Threshold` para evitar que a luz se espalhe nas mídias pretas do fundo.
* **VideoCopilot Saber (Gratuito e poderoso)**:
  1. Crie um sólido preto acima da sua mídia e aplique o `Saber`.
  2. Em *Customize Core*, mude `Core Type` para **Layer Masks** ou **Text Layer** (caso queira que a energia siga um desenho de máscara).
  3. Mude a transferência do layer para **Add** ou **Screen**.
  4. Escolha presets como `Fire`, `Electric`, `Energy` ou `Neon` no menu superior do plugin.

## Método com Scripts/Expressões
Se quiser que o brilho pisque como chama de fogo (expressão na intensidade do Glow ou do Saber):
```javascript
minIntensity = 0.5;
maxIntensity = 2.0;
freq = 15; // Velocidade da oscilação
(Math.sin(time * freq) * (maxIntensity - minIntensity)/2) + (maxIntensity + minIntensity)/2 + random(-0.2, 0.2);
```

## Problemas Comuns
* **Glow "Estourado" Sem Cor (Branco Puro)**: Ocorre quando a intensidade está muito alta e queima os canais RGB. *Solução*: Diminua a intensidade do primeiro glow da pilha e aumente o raio do segundo/terceiro para espalhar a cor antes que sature em branco puro.
* **Luz Invadindo Áreas Escuras Indesejadas**: O glow brilha o preto de fundo que deveria ser fosco. *Solução*: Ajuste o parâmetro `Threshold` para um valor mais alto (ex: 80%) para restringir o brilho apenas aos pixels mais claros da imagem.

## Checklist de Diagnóstico
- [ ] O projeto está configurado em profundidade de cor de 16-bpc ou 32-bpc para evitar banding?
- [ ] O modo de transferência (Blend Mode) do layer de luz/glow está como **Add** ou **Screen**?
- [ ] O decaimento de luz (Glow Radius) possui camadas curtas e longas empilhadas?

## Sugestões para MMV
* Use o plugin Deep Glow com aberração cromática ativa em cenas escuras com faíscas. A dispersão de cores frias e quentes em contraste com o preto cria mídias visuais muito premium para AMV/MMV.
* Faça a intensidade do glow piscar em sincronia com batidas de prato (cymbals) na música.

## Limitações
* Plugins como Deep Glow realizam cálculos intensivos de GPU; aplicar em múltiplos Adjustment Layers simultâneos pode congelar a RAM preview. Pré-componha e desative provisoriamente durante a montagem primária.
