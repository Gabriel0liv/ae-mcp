# Workflow: Camera Movement & 3D Camera (Pans, Zooms & Shakes)

## Quando Usar
* Para criar movimentos virtuais de câmera em cenas 2D de anime ou páginas estáticas de mangá.
* Para dar dinamismo e senso de escala às cenas de luta em edições de MMV.
* Para suavizar transições complexas, interligando diferentes clipes como se pertencessem ao mesmo espaço geográfico.

## Formas Possíveis
1. **Nativa**: Criação de um layer de **Câmera 3D**, controlado por um **Null Object 3D**, animando propriedades de posição, rotação e distância focal.
2. **Plugins/Presets**: Uso de presets de tremores do **Sapphire** (`S_Shake`) aplicados a uma camada de ajuste sobre a câmera, ou plugins como **Sure Target** para alternar focos automaticamente.
3. **Scripts/Expressões**: Uso de expressões de tremor em três eixos (X, Y, Z) vinculados a controles de sliders para simular câmera na mão ou trancos físicos de batida.

## Método Nativo
Para configurar uma câmera 3D de forma profissional e evitar rotações confusas do ponto de interesse:
1. Vá em `Layer > New > Camera`. Selecione o tipo **One-Node Camera** (ou se usar Two-Node, lembre-se de que o ponto de interesse pode dar problemas de orientação ao animar). Configure o tamanho como `35mm` ou `50mm`.
2. Vá em `Layer > New > Null Object`.
3. Renomeie o Null para `Controlador_Camera` e ative sua chave 3D (ícone de cubo).
4. Vincule o layer da Câmera ao `Controlador_Camera` usando o chicote de parentagem (Parent & Link).
5. **Animação**: Não anime a câmera diretamente! Controle toda a movimentação de translação e rotação através do Null `Controlador_Camera`. Isso previne que a câmera gire em torno de eixos errados ou que trave no ponto de interesse.
6. Aplique curvas suaves de velocidade (F9 / Easy Ease) nos keyframes de posição do controlador para simular acelerações realistas de câmera física.

## Método com Plugins/Presets
* **Sure Target (Videocopilot)**:
  * Um script gratuito que automatiza a câmera do AE. Você apenas lista as mídias que quer focar na timeline e ele gera a movimentação de transição, profundidade de campo e inclinação da câmera automaticamente de forma suave.
* **Sapphire S_BlurMoCurves**:
  * Para movimentos de câmera ultra rápidos (ex: chicotes de câmera/whip pans), aplique `S_BlurMoCurves` para aplicar desfoques de movimento de alta qualidade que superam a renderização nativa de motion blur.

## Método com Scripts/Expressões
Adicione a seguinte expressão na propriedade **Position** do Null `Controlador_Camera` para simular uma câmera na mão (handheld shake) controlada por sliders:
```javascript
freq = thisComp.layer("Controlador_Geral").effect("Freq_Shake")("Slider"); // Frequência do shake
amp = thisComp.layer("Controlador_Geral").effect("Amp_Shake")("Slider"); // Amplitude do shake
w = wiggle(freq, amp);
[w[0], w[1], value[2]]; // Shake apenas nos eixos X e Y, mantendo o Z estático
```

## Problemas Comuns
* **Bordas Pretas Reveladas Durante Movimentos**: A câmera se move além das mídias 2D da tela. *Solução*: Aumente ligeiramente a escala da mídia afetada, ou adicione o efeito **Motion Tile** com `Mirror Edges` ligado como primeiro efeito do layer de mídia.
* **Inversão Repentina da Câmera (Giro 180°)**: Ocorre se a câmera ultrapassar fisicamente o ponto de interesse ou se as propriedades de rotação 3D entrarem em conflito (Gimbal Lock). *Solução*: Use uma câmera do tipo "One-Node" e faça a parentagem sempre em um Null Object 3D para controlar a rotação através do Null.

## Checklist de Diagnóstico
- [ ] A câmera 3D está vinculada a um Null Object com a chave 3D ativada?
- [ ] O renderizador 3D da composição está configurado corretamente (Classic 3D na maioria das vezes, evite Cinema 4D se não for usar extrusões para manter o render leve)?
- [ ] O **Motion Blur** global da composição e da câmera está ligado?

## Sugestões para MMV
* Crie zooms rápidos no beat do bumbo (kick) e pequenos trancos de rotação (`Z Rotation` de -2° para +2°) nas batidas de caixa (snare) para integrar a movimentação da câmera diretamente à energia do áudio.

## Limitações
* Layers 2D sem a chave 3D ativa não serão afetados pelos movimentos da câmera 3D (permanecerão fixos e planos em relação à tela).
* Movimentos bruscos de aproximação (Z-zoom) podem pixelar mídias 2D que tenham resolução baixa. Garanta que a mídia tenha o dobro de resolução necessária se for receber zooms extremos.
