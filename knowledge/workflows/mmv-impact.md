# Workflow: MMV Impact Animation (Beat Sync & Shakes)

## Quando Usar
* Em AMVs/MMVs (Anime/Manga Music Videos) de ação, luta ou ritmo rápido.
* Para sincronizar transições ou cortes secos com batidas fortes da música (kicks, snares, drops).
* Quando quiser destacar um golpe, colisão ou transição visual agressiva.

## Formas Possíveis
1. **Nativa**: Uso de expressões de `wiggle` ou keyframes manuais de escala, rotação e posição, combinados com o efeito **Motion Tile** (Mosaico em Movimento) para preencher as bordas pretas.
2. **Plugins/Presets**: Uso de **RTFX Zoom/Impacts**, shakes do **Sapphire** (`S_Shake`), ou **Red Giant Universe Shake**.
3. **Scripts/Expressões**: Expressões de decaimento senoidal (decay wiggles) baseadas em marcadores na timeline ou vinculadas a sliders de controle de impacto.

## Método Nativo
1. Crie um **Null Object** e vincule a ele os layers que sofrerão o impacto.
2. Adicione o efeito **Motion Tile** aos layers de mídia (antes de aplicar o Null) para evitar bordas pretas durante o tremor. Configure:
   * `Output Width`: 150 a 200
   * `Output Height`: 150 a 200
   * `Mirror Edges`: Ativado (Crucial!)
3. No Null Object, crie 3 keyframes na propriedade **Scale**:
   * Frame 0 (Batida): `115%` (ou `120%` dependendo da intensidade).
   * Frame 1 (1-2 frames antes): `100%`.
   * Frame 8-12 (Decaimento): Volta a `100%` com atenuação suave (Easy Ease).
4. Crie uma animação rápida na propriedade **Position** ou **Rotation** do Null Object para simular o tranco da batida, aplicando curvas de velocidade acentuadas no gráfico (gráfico de velocidade com influência de 80% a 90% na saída e entrada).

## Método com Plugins/Presets
* **Sapphire S_Shake**:
  1. Aplique `S_Shake` em um Adjustment Layer posicionado acima das mídias.
  2. Ajuste `Amplitude` com um pico de `1.0` a `2.0` na batida e anime para `0.0` em 5 a 10 frames.
  3. Ajuste `Frequency` entre `8.0` e `15.0` para tremores de ação rápidos.
  4. Ative `MoBlurCard` ou use o Motion Blur nativo do After Effects no Adjustment Layer.
* **RTFX Preset Pack**:
  1. Importe o preset de impacto `.ffx` do RTFX.
  2. Posicione o marcador do preset exatamente no frame correspondente ao pico do áudio.

## Método com Scripts/Expressões
Use a seguinte expressão na propriedade **Position** de um Null para criar um shake com decaimento que começa no marcador da timeline:
```javascript
n = 0;
if (marker.numKeys > 0){
  n = marker.nearestKey(time).index;
  if (marker.key(n).time > time){
    n--;
  }
}
if (n == 0){
  value;
}else{
  t = time - marker.key(n).time;
  amp = 50; // Amplitude do shake em pixels
  freq = 15; // Freqüência em Hz
  decay = 5; // Rapidez de decaimento
  w = Math.sin(t * freq * Math.PI * 2) * amp / Math.exp(t * decay);
  value + [w, w];
}
```

## Problemas Comuns
* **Bordas Pretas Aparecendo**: Ocorre porque o efeito **Motion Tile** está posicionado depois do efeito de shake na lista de efeitos (ou o shake foi feito no Null e o Motion Tile está no layer sem escala estendida). *Solução*: Garanta que o Motion Tile seja sempre o primeiro efeito na ordem do painel de controle do layer de mídia.
* **Impacto Sem Velocidade (Linear)**: Curvas lineares deixam o impacto lerdo e sem energia. *Solução*: Selecione os keyframes, pressione `F9` (Easy Ease) e puxe as alças no Gráfico de Curva (Value/Speed Graph) para concentrar a aceleração extrema no início e o decaimento gradual no fim.

## Checklist de Diagnóstico
- [ ] O efeito **Motion Tile** está aplicado e com `Mirror Edges` marcado?
- [ ] O pico de escala/shake coincide perfeitamente (frame a frame) com o pico do áudio ou marcador?
- [ ] A interpolação dos keyframes foi modificada de Linear para Bezier atenuado?
- [ ] O **Motion Blur** global da composição e do layer está ativado?

## Sugestões para MMV
* Para transições de estilo *dark/action*, adicione um flash branco rápido ou inversão de cores de 1-2 frames na batida usando o efeito **Invert** ou **Levels** (animando a propriedade Input White).
* Use um leve zoom na batida (`Scale` 105% -> 100%) para dar o efeito de "camera bump" físico.

## Limitações
* Shakes gerados puramente por expressões de `wiggle()` comuns são contínuos e não sincronizam dinamicamente com picos de impacto sem o uso de sliders de controle complexos.
