# Tool Guide: Maxon Trapcode (Particular, Form & Particles)

## Para Que Serve
* Geração de sistemas de partículas 3D complexos (Particular).
* Geração de malhas de partículas e grids baseados em mapas de áudio ou ruído (Form).
* Criação de geometrias 3D abstratas de terreno ou túneis de luz (Mir).

## Quando Usar
* Em introduções tridimensionais, transições de fumaça volumétrica realista, faíscas que ricocheteiam fisicamente na cena ou chuva de pétalas de cerejeira (sakura) em animes.
* Para criar fundos (backgrounds) dinâmicos e atmosferas espaciais.

## Quando Evitar
* Em composições que necessitam de renderizações simples e rápidas (sistemas de partículas 3D pesam consideravelmente no processamento).
* Para faíscas bidimensionais planas simples (que podem ser resolvidas com mídias pré-renderizadas ou presets do RTFX).

## Casos de Uso em MMV
* **Chuva de Faíscas Tridimensional**: Configurar o emissor do *Trapcode Particular* para cuspir partículas douradas que caem com simulação física de gravidade e resistência ao vento durante cortes rápidos de espada.
* **Poeira Atmosférica e Neblina**: Criar uma névoa volumétrica lenta no espaço 3D entre a câmera e o personagem de anime para acentuar a profundidade da cena.

## Problemas Comuns
* **Partículas Desaparecendo ao Mudar Câmera**: Ocorre se as partículas não estiverem no mesmo espaço de coordenadas 3D ou se o layer do Particular for acidentalmente transformado em 2D na pilha de mídias. *Solução*: Garanta que o layer que contém o Particular seja um sólido 2D padrão sem chave 3D ativa (o próprio Particular interpreta as coordenadas da câmera 3D interna automaticamente).
* **Crash de Memória durante RAM Preview**: Emissão de milhões de partículas simultâneas consome toda a memória física. *Solução*: Defina limites máximos de emissão (`Max Particles`) no início da composição e reduza a qualidade da viewport durante a edição.

## Como Combinar com Outras Ferramentas
* **Deep Glow**: Aplique o Deep Glow diretamente no layer do Particular para dar um visual radiante e brilhante às partículas de poeira ou faíscas.
* **Sure Target (Câmera)**: Configure as partículas 3D para preencherem o espaço ao redor dos alvos focados da câmera para intensificar o paralaxe do movimento tridimensional.

## Classificação do AE-mcp
* **Category**: `plugin_package`.
* **Automation Level**: `effect_matchname` (identificável via matchNames dos efeitos no ExtendScript).
