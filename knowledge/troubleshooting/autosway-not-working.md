# Troubleshooting: AutoSway Issues (Static Chains & Errors)

## Sintomas
* O AutoSway é aplicado nos Puppet Pins ou nas camadas, mas elas permanecem completamente estáticas na viewport, sem qualquer oscilação ou ondulação física.
* A ponta do cabelo ou da capa fica fixa na tela e o movimento oscila de forma descontrolada na raiz (descolando do corpo do personagem).
* O After Effects exibe erros de expressão em cascata após a aplicação do script AutoSway.

## Causas Prováveis
* **Frequência ou Amplitude zeradas**: No painel de controle do AutoSway, os parâmetros de `Sway` (Oscilação), `Wind` (Vento) ou `Frequency` (Frequência) estão configurados com o valor `0.0`.
* **Ordem de Seleção Inversa**: Os pinos do Puppet Tool foram selecionados da ponta para a raiz antes de clicar em Apply. O AutoSway define o primeiro pino selecionado como a raiz (base estática/âncora).
* **Conflito de Nomes no Projeto**: A expressão do AutoSway aponta para um controlador genérico (ex: `AutoSway_Ctrl`), mas existem múltiplos sways na mesma composição usando o mesmo nome de controlador.
* **Puppet Pins Fora da Malha**: Os pinos criados foram deslocados acidentalmente para fora dos limites da camada de imagem original.

## Como Verificar no AE
1. Clique na camada afetada, vá em `Effect Controls` e verifique as propriedades do efeito **AutoSway**.
2. Certifique-se de que os valores de `Sway`, `Wind` e `Frequency` estão definidos com valores superiores a zero.
3. Pressione a tecla `U` para expor a lista de Puppet Pins e verifique se as expressões aplicadas pelo AutoSway em cada pin possuem avisos laranja de erro.

## Quais Dados do AE-mcp Ajudam
* **`export-diagnostics` (Comando CLI)**: Varre as expressões e relatawarnings se houver erros de JavaScript vinculados ao plugin AutoSway ou se o controlador central estiver inativo.
* **`check-expression-errors` (Comando CLI)**: Detalha a falha de expressão de atraso que impede a oscilação de fluir do pino pai para o pino filho.

## Soluções Manuais
* **Refazer Seleção e Aplicação**:
  1. Apague o efeito AutoSway e remova as expressões dos pinos (Alt+clique no cronômetro da posição de cada pino).
  2. Selecione os pinos na ordem exata: **primeiro o da raiz (base)** e **por último o da ponta (extremidade flexível)**.
  3. No painel do AutoSway, certifique-se de que o modo *Puppet* está ativo e clique em **Apply** novamente.
* **Ajustar Sensibilidade**: Aumente o parâmetro **Delay** no painel Effect Controls para ampliar a flexibilidade de oscilação.
* **Renomear Controlador**: Se houver mais de um sway na composição, renomeie os layers controladores gerados (ex: de `AutoSway_Ctrl` para `AutoSway_Ctrl_Cabelo` e `AutoSway_Ctrl_Capa`) e atualize os nomes correspondentes nas expressões para evitar interferência mútua.

## Soluções Via Script (Quando Seguro)
O AE-mcp pode gerar propostas de código JSX para remover expressões antigas do AutoSway e limpar o layer afetado permitindo que o usuário aplique o script do zero sem lixo acumulado de rigs anteriores.
