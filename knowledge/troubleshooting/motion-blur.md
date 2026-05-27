# Troubleshooting: Motion Blur Not Working

## Sintomas
* Elementos ou personagens de anime se movem de forma muito rápida na tela (ex: em transições de chicote ou zooms de impacto), mas o deslocamento parece duro e truncado, sem o borrão de movimento característico de velocidade.
* O desfoque de movimento aparece na renderização final, mas não durante a reprodução da timeline (RAM Preview), ou vice-versa.

## Causas Prováveis
* **Chave Global de Motion Blur Desativada**: O botão de ativação de simulação de obturador de câmera (ícone de múltiplos círculos sobrepostos) na parte superior do painel Timeline está desligado.
* **Chave Individual do Layer Desativada**: O interruptor de Motion Blur do layer de mídia específico não foi marcado.
* **Obturador da Câmera Configurado Incorretamente**: O ângulo do obturador (*Shutter Angle*) nas configurações da composição está definido com valor `0` (desligado).
* **Ausência de Movimento de Propriedade**: O layer não possui animação de posição, rotação ou escala real de keyframes, impossibilitando o cálculo de desfoque por velocidade (por exemplo, quando o movimento é feito por efeitos que não calculam velocidade como o Transform comum ou quando o Null está parado).

## Como Verificar no AE
1. Verifique se o ícone do obturador de movimento global (múltiplos círculos) na linha de ferramentas da Timeline está ativado em azul.
2. Certifique-se de que a coluna de chaves (Switches) está visível e que a caixinha correspondente ao círculo de desfoque está marcada no layer que você deseja aplicar o borrão.
3. Abra as configurações da composição (`Ctrl+K`), vá na aba *Advanced* e certifique-se de que o **Shutter Angle** está definido entre `180` (borrão padrão de cinema) e `360` (borrão de alta velocidade, comum em MMVs).

## Quais Dados do AE-mcp Ajudam
* **`export-diagnostics` (Comando CLI)**: Varre as propriedades das composições e dos layers de mídias e reporta warnings específicos caso:
  * O Motion Blur global da composição esteja desativado (`COMP_MOTION_BLUR_DISABLED`).
  * Um layer rápido (com keyframes dinâmicos) não possua o interruptor de desfoque individual ativado (`LAYER_MOTION_BLUR_DISABLED`).

## Soluções Manuais
* Pressione a tecla `F4` na timeline para alternar entre as colunas de modos de transferência e chaves (Switches/Modes) e ativar a caixinha de Motion Blur do layer.
* Ligue o botão de Motion Blur geral na barra de ferramentas acima da lista de layers da Timeline.
* Aumente o `Shutter Angle` nas configurações de composição para tornar o desfoque mais visível.

## Soluções Via Script (Quando Seguro)
O AE-mcp pode gerar um script JSX simples que varre todas as composições e ativa as chaves de Motion Blur global e individual em lote para acelerar o processo:
```javascript
// Exemplo JSX para ativar Motion Blur em lote
var comp = app.project.activeItem;
if (comp && comp instanceof CompItem) {
    app.beginUndoGroup("Ativar Motion Blur Global");
    comp.motionBlur = true;
    for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i).canMotionBlur) {
            comp.layer(i).motionBlur = true;
        }
    }
    app.endUndoGroup();
}
```
