# Tool Guide: Duik Angela (Rigging & IK)

## Para Que Serve
* Criação de rigs de animação 2D completos (ossos, articulações, controladores inteligentes).
* Sistemas de Cinemática Inversa (IK) para membros (pernas, braços, caudas, tentáculos).
* Automação de ciclos de caminhada, animação facial e dinâmica física de mola/atenuação.

## Quando Usar
* Em animações de personagens detalhados em mídias MMV ou curtas-metragens.
* Quando o personagem precisa interagir fisicamente com o cenário de forma controlada (ex: pés fixados no chão enquanto o quadril se move).
* Para controlar rigs complexos através de poucos controladores visuais baseados em shapes.

## Quando Evitar
* Em edições de corte rápido (fast cut AMVs) onde os personagens aparecem apenas por alguns frames e não necessitam de articulação real.
* Para animação de tremores simples ou zooms que podem ser feitos com Nulls e expressões comuns de wiggle.

## Casos de Uso em MMV
* **Puppet Rigging de Anime**: Recortar um personagem de mangá ou cena de anime estática em partes (braços, pernas, tronco) e criar um rig para fazê-lo respirar, andar ou atacar sincronizado com o beat.
* **Balanço Dinâmico de Câmera lenta**: Rigar cabelos compridos ou casacos usando as ferramentas de dinâmica de ossos (Bones + Dynamics) do Duik para que eles sigam os movimentos corporais automaticamente.

## Problemas Comuns
* **Rig Quebrando / Distorções Estranhas**: Acontece quando as juntas de rotação não estão alinhadas no mesmo local dos anchor points. *Solução*: Sempre posicione a âncora exatamente na articulação antes de rodar a criação de estruturas ou parentagem.
* **Gimbal Lock (Rotações Invertidas)**: O cotovelo vira no sentido oposto ao mover o controlador. *Solução*: Ajuste as configurações de limites e direção do IK (IK Direction) nos efeitos do controlador gerado na aba Effect Controls.

## Como Combinar com Outras Ferramentas
* **AutoSway**: Use o Duik Angela para estruturar a rig rígida do corpo do personagem (tronco, membros) e aplique o AutoSway nas mechas de cabelo soltas e pontas flexíveis de tecidos para simular vento automático.
* **Sapphire S_BlurMoCurves**: Aplique o desfoque de movimento da Sapphire nos renders finais do rig para obter um rastro realista de velocidade alta durante ataques.

## Classificação do AE-mcp
* **Category**: `script_package` (instalado na pasta Scripts / ScriptUI Panels).
* **Automation Level**: `manual_panel_only` (a IA pode dar instruções de fluxo, recomendar controladores e ensinar configurações, mas não deve disparar comandos de automação cega via JSX na interface sem ação do usuário).
