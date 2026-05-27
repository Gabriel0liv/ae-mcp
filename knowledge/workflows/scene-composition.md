# Workflow: Scene Composition (Parallax & Depth Separation)

## Quando Usar
* Para criar profundidade tridimensional a partir de imagens ou clipes 2D de animes.
* Em mídias estáticas (páginas de mangá, ilustrações, fanarts) que precisam se mover dinamicamente.
* Para separar o personagem principal do fundo (background) e criar transições complexas em mídias MMV.

## Formas Possíveis
1. **Nativa**: Recorte de personagens usando a ferramenta **Pen Tool** (máscaras) ou **Rotobrush 2.0/3.0**, posicionamento em espaço 3D, e movimentação com câmera 3D nativa.
2. **Plugins/Presets**: Uso de plugins de desfoque de profundidade (**Sapphire S_LensBlur** ou **S_BlurMoCurves**) e ferramentas auxiliares de extrusão.
3. **Scripts/Expressões**: Expressões de vinculação proporcional para calcular distância focal automaticamente ou automatizar o efeito de paralaxe com sliders.

## Método Nativo
1. **Recorte de Elementos**:
   * Duplique o clipe ou imagem original. Chame o layer de cima de `FG_Character` (Foreground) e o de baixo de `BG_Fundo` (Background).
   * No `FG_Character`, use a **Pen Tool** (`G`) para recortar o personagem. Se for um clipe de vídeo, utilize o **Rotobrush** para traçar e propagar a seleção frame a frame.
   * No `BG_Fundo`, idealmente use a ferramenta de carimbo (**Clone Stamp**) ou preenchimento sensível ao conteúdo (**Content-Aware Fill**) para remover o personagem e preencher o fundo vazio (evitando que o personagem apareça duplicado ao mover a câmera).
2. **Espaço 3D e Paralaxe**:
   * Ative a chave 3D (ícone de cubo) em ambos os layers.
   * Empurre o `BG_Fundo` no eixo Z para trás (`Position Z: 1000` a `2000`).
   * Aumente a escala (`Scale`) do `BG_Fundo` para que ele volte a preencher a tela, compensando o afastamento físico.
   * Mantenha o `FG_Character` mais próximo da câmera (`Position Z: 0` ou próximo).
3. **Câmera e Desfoque**:
   * Crie um layer de Câmera 3D (`Layer > New > Camera`) e um Null Object 3D para controlá-la. Vincule a câmera ao Null Object.
   * Ao mover o Null Object nas direções X e Y (ou girar em órbita), a paralaxe ocorrerá naturalmente: o personagem em primeiro plano se moverá mais rápido que o fundo.
   * Ative a profundidade de campo (**Depth of Field**) na câmera e ajuste a propriedade **Aperture** e **Focus Distance** para manter o personagem focado e o fundo suavemente desfocado.

## Método com Plugins/Presets
* **Sapphire S_LensBlur**:
  * Ao invés do desfoque de câmera padrão do AE (que consome muito processamento), aplique o `S_LensBlur` no layer de fundo. Ele gera um bokeh muito mais realista e estético para a estética dark/action anime.
* **Auto-Parallax Rigging (via scripts)**:
  * Ferramentas nativas do After Effects ajudam a automatizar a linkagem de profundidade para páginas de mangá de MMV.

## Método com Scripts/Expressões
Use a seguinte expressão na propriedade **Position** do `BG_Fundo` para automatizar a distância relativa baseada em um Slider sem precisar arrastar o Z manualmente:
```javascript
zOffset = thisComp.layer("Controlador_CC").effect("Distancia_BG")("Slider"); // slider de controle
value + [0, 0, zOffset];
```

## Problemas Comuns
* **"Bordas Rasgadas" ou Halos no Recorte**: Restos de cor do fundo original aparecem nas bordas do personagem recortado. *Solução*: Ajuste as propriedades de máscara (**Mask Feather** entre 1.0 e 2.0 pixels, e **Mask Expansion** com valores ligeiramente negativos como -1 ou -2).
* **Fundo Vazio Revelado**: Ao mover a câmera para a lateral, a "área limpa" do fundo não cobre toda a tela. *Solução*: Aumente a escala do BG_Fundo ou use o efeito **Motion Tile** para estender as bordas horizontais/verticais do fundo tridimensional.

## Checklist de Diagnóstico
- [ ] A chave 3D está ativa em todos os layers envolvidos na composição?
- [ ] O layer de câmera está posicionado acima de todas as mídias 3D?
- [ ] Os recortes do personagem principal possuem atenuador de borda (feather) adequado?
- [ ] O personagem recortado foi removido ou mascarado no layer de fundo para evitar duplicação visual?

## Sugestões para MMV
* Adicione partículas de poeira, faíscas ou fumaça em 3D posicionadas *entre* o personagem e o fundo. Isso acentua drasticamente a sensação de profundidade tridimensional durante movimentos de câmera.
* Em edições de mangá (MMV estático), utilize camadas de texto flutuando no espaço Z intermediário para dinamizar a leitura.

## Limitações
* O Rotobrush pode falhar em cenas de anime com traços muito confusos, exigindo rotoscopia manual demorada com a Pen Tool frame a frame.
* O uso de profundidade de campo nativa da câmera do AE aumenta significativamente o tempo de renderização da composição.
