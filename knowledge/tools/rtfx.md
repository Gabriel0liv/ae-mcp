# Tool Guide: RTFX (2D FX & Transitions Preset Pack)

## Para Que Serve
* Inserção de animações desenhadas à mão (2D cel animation) de fumaça, fogo, explosões, faíscas, raios e impactos energéticos.
* Transições fluidas baseadas em elementos dinâmicos (liquid cuts, fire transitions).

## Quando Usar
* Em transições rápidas de mídias ou introduções de títulos em MMVs de ação e fantasia.
* Para enriquecer visualmente golpes de lutas, adicionando rastro de energia ou faíscas no frame do impacto da batida.
* Para dar estilo visual orgânico de anime clássico/manga (cel shading).

## Quando Evitar
* Em edits minimalistas ou de estilo realista que exijam apenas cortes limpos e gradações de cores frias.
* Se a composição já estiver muito poluída visualmente a ponto de distrair o foco principal do personagem.

## Casos de Uso em MMV
* **Elemento de Impacto no Beat**: Adicionar um círculo de faíscas ou explosão rápida de fumaça preta/roxa (estética dark action) exatamente na batida forte de drop da música.
* **Transição de Elementos**: Transicionar entre duas cenas de luta usando uma onda de fogo ou fluido de fumaça que cobre toda a tela por 2 frames.

## Problemas Comuns
* **Bordas Pretas Cortadas no Layer de Presets**: A fumaça atinge as bordas físicas do layer quadrado e é cortada abruptamente. *Solução*: Aumente o tamanho do layer do preset para caber em toda a tela ou mude a escala geral do preset de forma a centralizar o brilho.
* **Lentidão Crítica na Preview**: Por carregar centenas de frames de mídias pré-renderizadas ou vetores, a preview pode travar. *Solução*: Ajuste a qualidade da viewport para `Half` ou `Third` e use o cache de disco (RAM Cache).

## Como Combinar com Outras Ferramentas
* **Deep Glow**: Aplique o efeito Deep Glow sobre o preset da RTFX (especialmente raios e chamas) para fazer as cores estourarem de forma vibrante e volumétrica, simulando emissão de luz física na cena.
* **Sapphire S_Displacement**: Use as partículas do RTFX (como fumaça ou distorção) como mapa de entrada para o Sapphire S_Displacement para distorcer a cena de anime de fundo de forma reativa à explosão.

## Classificação do AE-mcp
* **Category**: `preset_pack` / `mixed_tool_package`.
* **Automation Level**: `applyable_preset` (a IA pode recomendar caminhos específicos de arquivos `.ffx` ou de mídia e sugerir onde recortar e encaixar na timeline para obter efeitos otimizados).
