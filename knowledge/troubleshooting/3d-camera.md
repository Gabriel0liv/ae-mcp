# Troubleshooting: 3D Camera Issues (Bypassed or Missing Cameras)

## Sintomas
* Elementos ou camadas de mídias que deveriam estar no espaço 3D (ex: partículas, textos flutuantes, ou camadas de paralaxe) aparecem achatadas e não respondem à movimentação ou órbita da câmera do After Effects.
* A câmera 3D é criada, mas a viewport exibe a mensagem: *"Camera is not active"*.
* Os movimentos de rotação da câmera fazem com que as mídias sumam de forma aleatória ou fiquem com distorção de rotação excessiva (gimbal lock).

## Causas Prováveis
* **Chave 3D do Layer Desativada**: As camadas de mídias de vídeo, imagem ou sólidos não têm o interruptor 3D ativado, de forma que a câmera as ignora.
* **Câmera Inativa na Viewport**: A janela de visualização (Viewport) está configurada para exibir uma câmera ortogonal (ex: *Front*, *Left*, *Custom View 1*) ao invés de exibir a **Active Camera** (Câmera Ativa).
* **Layers 2D no Meio da Pilha 3D**: Um layer puramente 2D (sem chave 3D) está posicionado no meio de dois layers 3D na timeline, interrompendo a renderização e o agrupamento 3D do After Effects (quebrando a profundidade de campo e a oclusão).
* **Câmera de Dois Nós (Two-Node) Sem Parentagem**: A câmera possui um ponto de interesse fixo que anula e distorce movimentos de translação diretos da câmera.

## Como Verificar no AE
1. Verifique a coluna de interruptores (Switches) na timeline e certifique-se de que o ícone do cubo 3D está marcado em azul nos layers de mídias que deveriam interagir com a câmera.
2. Certifique-se de que o menu suspenso de câmeras na parte inferior direita da Viewport de visualização está definido como **Active Camera**.
3. Verifique se existem layers 2D no meio da pilha de layers 3D. Se existirem, reorganize a ordem arrastando as camadas 2D (como mídias de ajuste ou CC) para o topo absoluto da composição.

## Quais Dados do AE-mcp Ajudam
* **`export-diagnostics` (Comando CLI)**: Varre a composição e reporta warnings ou infos cruciais, como:
  * Camadas tridimensionais ativas em composição que não possui nenhuma câmera 3D (`THREE_D_LAYER_NO_ACTIVE_CAMERA`).
  * Layers de ajuste ou mídias 2D inseridos no meio de pilhas tridimensionais encadeadas, alertando sobre a quebra de renderização.

## Soluções Manuais
* Crie um layer de câmera One-Node (`Layer > New > Camera` > tipo One-Node) se a Two-Node estiver apresentando rotações incômodas.
* Ative o cubo 3D em todos os clipes de anime, mídias e fundos tridimensionais.
* Certifique-se de que a câmera 3D está na primeira posição superior da linha de mídias da timeline (ou abaixo apenas de Adjustment Layers de CC).

## Soluções Via Script (Quando Seguro)
O AE-mcp pode propor um script JSX para criar uma estrutura de câmera 3D limpa parentada a um Null 3D para evitar erros manuais:
```javascript
// Exemplo JSX para criar rig de Câmera 3D seguro
var comp = app.project.activeItem;
if (comp && comp instanceof CompItem) {
    app.beginUndoGroup("Criar Rig de Camera 3D");
    var control = comp.layers.addNull();
    control.name = "Controlador_Camera_3D";
    control.threeDLayer = true;
    
    var cam = comp.layers.addCamera("Camera_Lente_3D", [comp.width/2, comp.height/2]);
    cam.parent = control;
    app.endUndoGroup();
}
```
