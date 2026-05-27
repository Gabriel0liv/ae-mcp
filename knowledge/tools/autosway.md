# Tool Guide: AutoSway (Physics & Sway Automation)

## Para Que Serve
* Automação de movimentos de oscilação, ondulação e vento em cadeias de Puppet Pins ou camadas encadeadas.
* Simulação física simplificada de gravidade, inércia, rigidez e resistência ao ar em partes moles.

## Quando Usar
* Para animar mechas de cabelo, roupas (capas, vestidos, saias), faixas, correntes, cordas ou rabos de personagens.
* Para dar vida a elementos estáticos de background (folhas de árvores, grama, bandeiras ao vento).
* Para obter atraso (delay) de física realista de forma rápida.

## Quando Evitar
* Em partes rígidas do personagem que não devem dobrar, como ossos longos, pernas ou braços com articulação seca (use Duik Angela para esses casos).
* Para objetos que realizam movimentos manuais ativos com trajetórias de keyframes complexas.

## Casos de Uso em MMV
* **Cabelo ao Vento em Slow Motion**: Aplicar AutoSway em mechas de cabelo de personagens de anime posicionados na cena, ajustando o vento para dar peso tridimensional e sensação de atmosfera.
* **Correntes e Armas Flexíveis**: Rigar correntes (comuns em animes de ação/dark) para que elas balancem de forma reativa a cada pancada de impacto ou deslocamento de câmera.

## Problemas Comuns
* **Ponta Fixa e Base Solta (Inversão)**: A ponta do cabelo fica colada na tela e a raiz balança solta, descolando da cabeça do personagem. *Solução*: O AutoSway assume que o primeiro pin selecionado é a raiz (base fixa). Certifique-se de selecionar os pinos na ordem correta (da raiz à ponta) antes de clicar em Apply.
* **Malha Esticada ou Deformada**: A imagem se deforma visualmente mostrando pixels rasgados. *Solução*: Aumente o raio de influência dos pinos ou reduza a amplitude do balanço (`Sway`) nos controles do efeito.

## Como Combinar com Outras Ferramentas
* **Duik Angela**: Rigar o personagem principal usando o Duik (controlando a pose geral e a locomoção) e anexar cadeias de AutoSway nas partes flexíveis do personagem parentadas à cabeça ou tronco do rig do Duik.
* **Sapphire S_Shake**: O tremor da câmera gerado pelo Sapphire S_Shake pode induzir o movimento físico das mídias. Ajuste o balanço do AutoSway para harmonizar com a direção e intensidade da câmera.

## Classificação do AE-mcp
* **Category**: `script_package` (disponível como ScriptUI Panel).
* **Automation Level**: `manual_panel_only` (configurações procedurais e linkagem inicial requerem uso do painel pelo editor).
