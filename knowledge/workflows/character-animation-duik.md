# Workflow: Character Rigging & Animation (Duik Angela)

## Quando Usar
* Para animar personagens de anime, mascotes ou monstros 2D a partir de partes isoladas (braços, pernas, tronco, cabeça).
* Quando precisar de movimentos humanos/orgânicos controlados, como andar, correr, respirar ou empunhar armas.
* Ideal para recortes estáticos de mangá ou ilustrações que precisam ganhar animações articuladas em mídias MMV de alta qualidade.

## Formas Possíveis
1. **Nativa**: Uso da ferramenta de marionete do AE (**Puppet Pin Tool**) e vinculação manual de expressões (`parenting`) complexas ligando posições e rotações de mídias recortadas.
2. **Plugins/Presets**: Uso do painel **Duik Angela** para criar estruturas de ossos virtuais (Bones) e automatizar com **Inverse Kinematics** (IK) de 2 ou 3 articulações.
3. **Scripts/Expressões**: Expressões trigonométricas complexas de cinemática inversa ligando a posição de um controlador às rotações relativas das articulações da imagem.

## Método Nativo
1. Separe o personagem em camadas individuais no Photoshop/Illustrator: antebraço, braço, mão, coxa, perna, pé, tronco, pescoço, cabeça.
2. Importe como composição mantendo o tamanho das camadas.
3. **Ajuste dos Pontos de Ancoragem (Anchor Points)**: Esse é o passo mais importante!
   * Coloque o anchor point do antebraço exatamente na articulação do cotovelo.
   * Coloque o anchor point do braço na articulação do ombro.
   * Coloque o anchor point da mão no punho.
4. **Parentagem Manual**:
   * Vincule a mão -> ao antebraço.
   * Vincule o antebraço -> ao braço.
   * Vincule o braço -> ao tronco.
5. Rotacione o braço ou o antebraço manualmente para obter a animação (Cinemática Direta - FK).

## Método com Duik Angela
1. **Recorte e Importação**: Prepare a imagem fatiada do personagem.
2. **Criar Estruturas (Hominoid/Bones)**:
   * Abra o painel do **Duik Angela**.
   * Vá em *Rigging > Structures* e clique em **Hominoid** (ou crie estruturas de ossos avulsos para braços/pernas).
   * Reposicione cada ponto da estrutura gerada (ossos guia vermelhos) sobre as articulações corretas do seu personagem (ex: ombro, cotovelo, pulso).
3. **Vincular Mídias aos Ossos**:
   * Vincule o layer da sua arte correspondente ao seu respectivo osso de estrutura do Duik (ex: vincule o layer "Imagem_Braço" ao osso "S_Arm").
4. **Auto-Rig & IK**:
   * Selecione todas as estruturas criadas pelo Duik.
   * No painel do Duik, clique em **Auto-Rig**.
   * O Duik gerará controladores inteligentes (shapes na tela) e criará sistemas de cinemática inversa (IK) automaticamente. Agora, ao mover o controlador da mão, o braço e o cotovelo se dobrarão organicamente!

## Método com Scripts/Expressões
O Auto-Rig do Duik baseia-se em expressões complexas aplicadas à rotação das articulações. Um exemplo simplificado de expressão aplicada à rotação do cotovelo baseado na distância ao controlador da mão:
```javascript
p1 = parent.globalPosition; // Ombro
p2 = globalPosition; // Cotovelo
p3 = thisComp.layer("Controlador_Mao").globalPosition; // Controlador da Mão
// Cálculos de trigonometria de lei dos cossenos ocultados para simplificação
// O Duik automatiza a inserção dessas fórmulas nas propriedades de rotação
```

## Problemas Comuns
* **Articulações Desconexas ao Mover**: As junções se separam visualmente. *Solução*: Verifique se os pontos de ancoragem (Anchor Points) dos ossos e das imagens estão perfeitamente sobrepostos. Utilize a sobreposição de imagens com pontas arredondadas nas juntas para mascarar a rotação sem deixar "buracos" na pele do personagem.
* **Braço Dobrando para o Lado Incorreto**: O cotovelo vira no sentido contrário ao natural. *Solução*: No controlador gerado pelo Duik, vá ao painel *Effect Controls* e marque a opção **Reverse** ou ajuste o parâmetro **Stretch/IK Direction**.

## Checklist de Diagnóstico
- [ ] Todos os pontos de ancoragem estão posicionados exatamente no centro de rotação das juntas?
- [ ] A hierarquia de parentagem (Parent & Link) liga a imagem ao osso correto do Duik?
- [ ] As estruturas (ossos) foram posicionadas e alinhadas antes de clicar em Auto-Rig?
- [ ] Os controladores do Duik estão livres de keyframes indesejados nas posições iniciais de repouso?

## Sugestões para MMV
* Use o Duik para criar um ciclo de animação leve (respiração e flutuação de cabelo) para o personagem estático ficar "vivo" enquanto a cena se move na batida.
* Combine a cabeça articulada com uma expressão de `wiggle()` suave e contínua para simular balanço dinâmico realista de câmera lenta.

## Limitações
* A deformação de uma única imagem sólida com Puppet Pins no Duik pode rasgar ou distorcer texturas se o movimento for muito brusco. O recorte em camadas rígidas separadas é recomendado para animes e mangás.
* Estruturas complexas com dezenas de controladores do Duik podem deixar a viewport do After Effects lenta. Ative a visualização em qualidade "Draft" durante a animação.
