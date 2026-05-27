# Troubleshooting: Duik Rig Issues (Broken Limbs & Joints)

## Sintomas
* Ao mover o controlador do pé ou da mão gerado pelo Duik Angela, a perna ou o braço não dobram e permanecem completamente esticados.
* Ao rotacionar um controlador, as partes do corpo do personagem se separam visualmente na viewport (ex: a mão voa longe do punho).
* Expressões do Duik exibem erros vermelhos e travam o movimento das estruturas.
* O ciclo de caminhada automático (*Auto Walk*) faz o personagem deslizar ou patinar sem sair do lugar.

## Causas Prováveis
* **Anchor Points Desalinhados**: Os pontos de ancoragem da arte original (imagem recortada) e dos ossos da estrutura (Structures) do Duik não foram posicionados exatamente no mesmo pixel de centro das juntas.
* **Hierarquia de Parentagem (Parent & Link) Incorreta**: O layer da imagem do braço foi vinculado ao controlador ao invés de ser vinculado ao osso correspondente da estrutura (ex: S_Arm), ou os elos de parentagem foram cruzados.
* **Membros Esticados Além do Limite**: O controlador foi arrastado para muito longe do ombro/quadril, esticando o sistema de cinemática inversa (IK) ao seu comprimento máximo linear.
* **Ordem de Seleção Incorreta no Auto-Rig**: As estruturas foram selecionadas fora da ordem anatômica recomendada no momento do clique de automação de rig do Duik.

## Como Verificar no AE
1. Selecione a ferramenta de Anchor Point (`Y`) e clique em cada osso e em cada imagem correspondente para checar visualmente se seus pontos de rotação coincidem exatamente.
2. Expanda a coluna *Parent & Link* na timeline e revise se a hierarquia de parentagem segue o manual:
   * Layer de Imagem -> Vinculado ao seu respectivo Osso (Structure) do Duik.
   * Ossos da Extremidade -> Vinculados ao Controlador do membro correspondente.
3. Clique no controlador do Duik que está apresentando problemas, vá nas propriedades de efeitos (*Effect Controls*) e verifique se as configurações de IK (como `Reverse` ou `Stretch`) estão ativadas de forma incorreta.

## Quais Dados do AE-mcp Ajudam
* **`export-diagnostics` (Comando CLI)**: Reporta warnings importantes de estrutura e checa se existem expressões com erros relacionadas a termos do Duik (como `duik`, `ik`, `autorig`) na timeline.
* **`check-expression-errors` (Comando CLI)**: Identifica a expressão exata do Duik que quebrou e isola a propriedade afetada.

## Soluções Manuais
* **Refazer a Relação de Rotação**: Desvincule todos os layers, reposicione os Anchor Points da sua imagem exatamente nas juntas de rotação e realize a parentagem novamente.
* **Inverter a Direção do IK**: No painel Effect Controls do controlador do braço/perna, marque a opção **Reverse** ou altere o parâmetro **Stretch Limit** para impedir deformações indesejadas.
* **Limitar o Movimento**: Reduza a distância de deslocamento do controlador para manter o braço ligeiramente flexionado nas poses extremas.

## Soluções Via Script (Quando Seguro)
O AE-mcp não gerará scripts invasivos de alteração de rig para não corromper o banco de dados interno complexo do Duik, mas fornecerá instruções detalhadas e diagnósticos textuais rápidos baseados no seu arquivo de composição para orientar os passos corretos de ajuste.
