# Tool Guide: Boris FX Sapphire (Advanced VFX Suite)

## Para Que Serve
* Efeitos profissionais de iluminação (Glows, Flares, LightLeaks).
* Distorções e tremores orgânicos de câmera (S_Shake, S_BlurMoCurves, S_Distort).
* Estilizações avançadas (S_Glitch, S_PixelSort, S_FilmEffect, S_Halftone).

## Quando Usar
* Para elevar a qualidade visual (look) de qualquer edição de MMV/AMV de ação ou dark.
* Para transições dinâmicas de movimento ultra velozes (Whip/Zoom/Spin) usando desfoque de movimento de sub-pixel de alta qualidade.
* Para dar estilo de película vintage ou aberrações de câmera reais nas mídias de anime.

## Quando Evitar
* Em projetos que exigem renderizações muito leves e mídias limpas de pós-processamento.
* Se os recursos de hardware do computador forem muito limitados (Sapphire faz uso intensivo de renderização de GPU).

## Casos de Uso em MMV
* **S_Shake nas Batidas**: O clássico tremor de câmera de MMV dark/action. Sincronizar o pico de amplitude com a batida forte e animar o decaimento em velocidade exponencial.
* **S_BlurMoCurves para Transições**: Realizar zoom in/out rápidos com rotação na transição entre cenas, gerando rastros de desfoque ultra realistas.
* **S_Flicker para Iluminação de Fogo**: Fazer com que a exposição ou brilho de uma cena de luta pisque simulando luz de chamas ao redor.

## Problemas Comuns
* **Mensagem "Missing Plugin" (Licença/Instalação)**: Se o projeto contendo Sapphire for aberto em outra máquina sem o plugin. *Solução*: O AE-mcp reportará a ausência nos diagnósticos de efeitos. Substitua por efeitos nativos ou instale a mesma versão do Sapphire.
* **Cintilações Vermelhas (Red X) no Render**: Ocorre quando a licença do Sapphire expira ou falha ao autenticar. *Solução*: Valide o status da licença do plugin.

## Como Combinar com Outras Ferramentas
* **Deep Glow**: Em vez de usar apenas o `S_Glow`, combine o contraste gerado pelo Sapphire com o decaimento do `Deep Glow` para highlights de olhos acesos em animes.
* **VideoCopilot Saber**: Aplique `S_Distort` ou `S_Glitch` em camadas de ajuste acima dos feixes de energia do Saber para tornar os raios elétricos mais instáveis e orgânicos.

## Classificação do AE-mcp
* **Category**: `plugin_package`.
* **Automation Level**: `effect_matchname` (identificável via propriedade de efeitos no ExtendScript; a IA pode ler se o plugin está instalado, mapear seus parâmetros e propor scripts JSX seguros para criar Adjustment Layers e aplicar efeitos como `S_Shake` com keyframes precisos).
