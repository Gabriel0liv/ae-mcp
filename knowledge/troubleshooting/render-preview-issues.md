# Troubleshooting: Render & RAM Preview Issues (Lags & Viewport Freezes)

## Sintomas
* O After Effects congela ou para a reprodução da timeline (RAM Preview) após renderizar poucos frames.
* Mensagem de erro de falta de memória: *"RAM Preview needs 2 or more frames to play"* ou *"Out of memory"*.
* Viewport de visualização exibe uma imagem desatualizada ou preta mesmo ao mover o cursor do tempo.
* Renderizações finais (exportação pelo Render Queue ou Media Encoder) demoram horas para pouquíssimos segundos de vídeo, ou travam no meio do processo.

## Causas Prováveis
* **Cache de Disco e Memória Ram Lotados**: O After Effects acumulou gigabytes de cache temporário corrompido ou desatualizado.
* **Excesso de Efeitos Pesados**: Uso excessivo de plugins intensivos de processador/GPU (ex: *Deep Glow*, *Sapphire S_Glow*, *Particular*) aplicados de forma cumulativa sem pré-composição.
* **Profundidade de Cor Inadequada**: Utilizar `32-bpc` (bits por canal de cor) desnecessariamente em composições simples de anime de 8 bits de origem.
* **Drivers de Placa de Vídeo Desatualizados**: Falha na aceleração de GPU por drivers NVIDIA/AMD antigos ou corrompidos.
* **Resolução da Viewport Excessiva**: Tentar reproduzir a preview em resolução integral (`Full`) em telas de alta densidade de pixels.

## Como Verificar no AE
1. Verifique o uso de memória RAM no gerenciador de tarefas do Windows.
2. No After Effects, olhe a barra verde na parte superior da régua de tempo da Timeline: ela representa os quadros salvos em cache de RAM. Se estiver fragmentada ou não carregar, há problemas de alocação de memória.
3. Abra as configurações de visualização (resolução da Viewport) na parte inferior do painel Composition e verifique se está configurado como `Auto` ou `Full`.

## Quais Dados do AE-mcp Ajudam
* **`export-diagnostics` (Comando CLI)**: Varre as configurações do projeto e reporta warnings de otimização de performance, tais como:
  * Resolução de composição excessiva sem necessidade.
  * Pilhas cumulativas de efeitos pesados conhecidos em layers de ajuste que cobrem toda a linha de tempo.
  * Status da profundidade de cor do projeto.

## Soluções Manuais
* **Limpar Cache Geral (Purge)**:
  * Vá no menu: `Edit > Purge > All Memory & Disk Cache...`.
  * Isso liberará espaço em disco e forçará o After Effects a recalcular os frames de visualização limpos.
* **Reduzir Resolução da Viewport**:
  * Altere a resolução de visualização de `Full` para `Half` ou `Quarter` durante a fase de montagem e animação das mídias.
* **Otimizar Profundidade de Cores**:
  * Alt+clique na profundidade de cor na barra de status inferior do projeto e mude de `32bpc` para `16bpc` (que preserva a qualidade e remove banding sem pesar tanto no processamento).
* **Desativar Efeitos Pesados Temporariamente**:
  * Desmarque o interruptor de efeitos (`fx`) de Adjustment Layers de CC e Glow pesados enquanto trabalha na movimentação e sincronização com o beat de áudio na timeline.

## Soluções Via Script (Quando Seguro)
O AE-mcp pode propor um script JSX para desativar temporariamente todos os Adjustment Layers de efeitos pesados (ou com determinados nomes) na composição ativa para acelerar a fase de animação primária do usuário:
```javascript
// Exemplo JSX para desativar Adjustment Layers pesados de efeitos
var comp = app.project.activeItem;
if (comp && comp instanceof CompItem) {
    app.beginUndoGroup("Otimizar Performance de Preview");
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (layer instanceof AVLayer && layer.adjustmentLayer && (layer.name.indexOf("CC") !== -1 || layer.name.indexOf("Glow") !== -1)) {
            layer.enabled = false; // Desativa temporariamente para preview veloz
        }
    }
    app.endUndoGroup();
}
```
*Atenção*: Esse script será gerado apenas como proposta textual para seu controle completo.
