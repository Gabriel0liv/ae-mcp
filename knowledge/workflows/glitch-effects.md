# Workflow: Glitch Effects & Aberration (Chromatic & Digital Glitches)

## Quando Usar
* Em transições rápidas e agressivas de MMV/AMV no estilo cyberpunk, glitch, industrial ou terror psicológico.
* Para simular interferência digital, defeito de sinal ou quebra de fluxo temporal no drop de músicas eletrônicas ou batidas de trap agressivas.
* Para dar textura analógica a textos ou logotipos na introdução.

## Formas Possíveis
1. **Nativa**: Criação de mapas de ruído fractais (**Fractal Noise**), aplicação com **Displacement Map** (Mapa de Deslocamento), e separação manual de canais RGB (Aberração Cromática) via **Shift Channels**.
2. **Plugins/Presets**: Sapphire **S_Glitch**, **S_GlitchTransition**, Red Giant **Universe Glitch**, ou presets `.ffx` prontos.
3. **Scripts/Expressões**: Expressões de `wiggle()` aplicadas ao deslocamento horizontal/vertical ou à escala dos canais de cores em frames específicos usando condicionais de marcadores.

## Método Nativo
Para criar uma aberração cromática e um glitch de mapa de deslocamento nativos:
1. **Aberração Cromática (Separação RGB)**:
   * Crie uma pré-composição da sua mídia original e chame de `Midia_Original`.
   * Traga-a para a timeline principal e duplique duas vezes (ficando com 3 camadas: `Vermelho`, `Verde`, `Azul`).
   * No layer `Vermelho`, aplique o efeito **Shift Channels** (Redefinir Canais): configure *Take Red From Red*, *Green From Full Off*, *Blue From Full Off*.
   * No layer `Verde`: configure *Red From Full Off*, *Green From Green*, *Blue From Full Off*.
   * No layer `Azul`: configure *Red From Full Off*, *Green From Full Off*, *Blue From Blue*.
   * Selecione as 3 camadas e mude o modo de transferência (Blend Mode) para **Screen** ou **Add**.
   * Agora, desloque ligeiramente a posição (`Position`) do layer Vermelho 2 pixels para a esquerda e do layer Azul 2 pixels para a direita. As bordas exibirão a aberração cromática clássica!
2. **Mapa de Deslocamento (Glitch de Bloco)**:
   * Crie um novo sólido chamado `Mapa_Ruido`. Aplique o efeito **Fractal Noise**:
     * `Fractal Type`: **Max** ou **Block** (para gerar blocos quadrados).
     * `Contrast`: aumente para `300` a `400`.
     * Anime a evolução ou aplique `wiggle(24, 100)` na propriedade Evolution.
     * Desative o ícone de olho do layer `Mapa_Ruido` (mantenha-o invisível na timeline).
   * Crie um **Adjustment Layer** acima de todas as mídias e aplique o efeito **Displacement Map**:
     * `Displacement Map Layer`: selecione o sólido `Mapa_Ruido`.
     * `Use For Horizontal Displacement`: altere para **Luminance**.
     * `Max Horizontal Displacement`: ajuste entre `20` e `100` (deslocamento lateral nos picos de ruído).

## Método com Plugins/Presets
* **Sapphire S_Glitch / S_GlitchTransition**:
  1. Aplique `S_Glitch` em um Adjustment Layer.
  2. Ajuste `Glitch Amp` para regular a força da distorção e `Rel RGB Distort` para controlar a separação cromática incorporada no próprio efeito.
  3. Desative a sincronização de frames (`Sync Frames`) se preferir um visual de campo intercalado.

## Método com Scripts/Expressões
Se quiser que o efeito de deslocamento lateral do canal de cores ocorra apenas em momentos específicos e curtos (expressão na posição do layer de canal):
```javascript
// Ativa tremor de canal de cores apenas se o slider de controle estiver acima de 0
control = thisComp.layer("Controlador_Glitch").effect("Ativar_Glitch")("Slider");
if (control > 0) {
  wiggle(24, 20); // 24 tremores por segundo com 20 pixels de intensidade
} else {
  value;
}
```

## Problemas Comuns
* **Linhas Pretas nas Bordas do Deslocamento**: O efeito empurra a imagem expondo o vazio. *Solução*: No painel do efeito **Displacement Map**, marque a opção **Wrap Pixels Around** ou aumente levemente a escala do layer em 2%.
* **Glitch Persistente / Sem Ritmo**: O efeito fica ativo o tempo todo deixando a visualização bagunçada. *Solução*: Limite a duração do Adjustment Layer que contém o glitch a apenas 2 a 5 frames nas transições ou batidas da música.

## Checklist de Diagnóstico
- [ ] O modo de transferência das 3 camadas de canais de cores está definido para **Screen**?
- [ ] O layer usado como mapa de ruído está oculto (olho desligado), mas ativo como referência no Displacement Map?
- [ ] OsAdjustment Layers de transição de glitch estão cortados para durar apenas a transição e não a cena toda?

## Sugestões para MMV
* Combine o glitch visual com um efeito sonoro correspondente (glitch/tape stop SFX) e reduza temporariamente a taxa de quadros (frame rate) para 12 fps usando o efeito **Posterize Time** no Adjustment Layer durante o glitch para emular um travamento estético de computador.

## Limitações
* Processos de separação RGB por Shift Channels triplicam o consumo de RAM preview na timeline do After Effects. Desative a visualização das camadas de canais até a renderização final.
