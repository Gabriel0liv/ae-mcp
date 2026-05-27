# Tool Guide: Native After Effects (Keyframes, Animators & Expressions)

## Para Que Serve
* Controle total de propriedades de transformações básicas (Posição, Escala, Rotação, Opacidade, Ponto de Ancoragem).
* Interpolação de keyframes e manipulação de curvas de velocidade (Speed/Value Graphs).
* Criação de máscaras e rotoscopia (Pen Tool, Rotobrush 2.0/3.0).
* Criação de shapes procedurais e animadores de texto.
* Vinculação lógica e física de propriedades via linguagem de expressões (JavaScript base).

## Quando Usar
* Em todas as composições, servindo de fundação essencial para qualquer edição de vídeo ou efeitos especiais de MMV.
* Para transições manuais, sincronização primária de mídias com o áudio, e ajustes estruturais de projeto.

## Quando Evitar
* Raramente evitado, mas certifique-se de não criar keyframes excessivos manualmente para animações que podem ser automatizadas por expressões (como wiggles de tremores contínuos ou sways físicos repetitivos).

## Casos de Uso em MMV
* **Sincronização com Áudio**: Utilizar a função nativa *Convert Audio to Keyframes* para converter as batidas da música em canais de dados (sliders) e linkar escala, efeitos de brilho ou flash de luz de forma procedural.
* **Máscaras de Transição (Luma Matte / Alpha Matte)**: Usar clipes de tinta escorrendo ou mídias em preto e branco nativos do After Effects para transicionar revelando o próximo clipe de anime na batida da caixa.

## Problemas Comuns
* **Expressão com Erro Desativando Animação**: Pequenos erros de digitação ou mudanças de nome de layers quebram a execução do JavaScript, desativando toda a lógica. *Solução*: O AE-mcp possui diagnósticos específicos (`EXPRESSION_ERROR`) para varrer e reportar erros exatos de expressão.
* **Curvas de Animação com Movimento Irregular (Bouncing)**: Ocorre quando a interpolação espacial do keyframe é alterada acidentalmente para Auto-Bezier, fazendo com que o objeto faça uma curva indesejada na tela entre dois keyframes estáticos. *Solução*: Selecione os keyframes, clique com o botão direito, vá em *Keyframe Interpolation* e mude a interpolação espacial de Bezier para **Linear**.

## Como Combinar com Outras Ferramentas
* **Plugins de Terceiros (Sapphire / Red Giant)**: Sempre estruture a pré-composição e parentagem de câmera usando os Nulls e Câmeras nativas do AE antes de aplicar estilizações com Sapphire ou partículas do Trapcode nos Adjustment Layers.

## Classificação do AE-mcp
* **Category**: `tool_package` (Nativo do After Effects).
* **Automation Level**: `full_script_integration` (a IA pode gerar e escrever códigos JSX seguros para automatizar a criação de Nulls, parentagens, alteração de modos de transferência e inserção de expressões nativas com alta confiabilidade).
