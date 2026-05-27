# Troubleshooting: Expression Errors

## Sintomas
* Alerta luminoso de aviso laranja na parte inferior da tela do After Effects com a mensagem: "Expression details...".
* Elementos ou propriedades animadas por expressão travam na tela e param de se mover.
* Expressão é desativada automaticamente (o ícone de sinal de igual "=" fica riscado de vermelho).

## Causas Prováveis
* **Mudança de Nome de Layer ou Composição**: A expressão aponta para um layer específico (ex: `thisComp.layer("Audio Amplitude")`), mas o usuário renomeou o layer para `Amplitude`.
* **Erros de Sintaxe em Javascript**: Falta de fechar parênteses, colchetes, ponto e vírgula, ou erro de digitação em funções matemáticas (ex: digitar `Math.sinus` ao invés de `Math.sin`).
* **Incompatibilidade de Versão de Idioma**: Projetos criados em inglês que usam nomes de efeitos nativos (ex: `effect("Slider Control")("Slider")`) geram erros ao serem abertos em After Effects configurado em português ou espanhol (onde o efeito chama `effect("Controle de controle deslizante")("Controle deslizante")`).
* **Tipos de Dados Incompatíveis**: Retornar um único número em uma propriedade bidimensional/tridimensional (como Posição, que exige uma matriz de 2 ou 3 valores `[x, y]`).

## Como Verificar no AE
1. Clique no ícone de aviso de erro na barra amarela/laranja inferior do painel Timeline.
2. O After Effects abrirá um painel de detalhes mostrando o erro exato, a linha de código e a propriedade afetada.
3. Se a barra de erro não estiver aparecendo, pressione a tecla `EE` no teclado com o layer selecionado para expor todas as expressões que possuem erros na composição ativa.

## Quais Dados do AE-mcp Ajudam
* **`check-expression-errors` (Comando CLI)**: Executa um script JSX profundo que varre todas as propriedades de todos os layers da composição ativa à procura de expressões com erros e retorna o nome do layer, a propriedade afetada, o código da expressão e o erro retornado no arquivo `data/expression_errors.json`.
* **`export-diagnostics` (Comando CLI)**: Realiza diagnóstico amplo e reporta o número acumulado de erros de expressões com severidade de `"error"`.

## Soluções Manuais
* **Corrigir Referência de Nome**: Abra a expressão e altere o nome do layer referenciado para corresponder exatamente ao nome atual na timeline.
* **Corrigir Tipagem**: Se for uma propriedade de Posição ou Escala, garanta que o resultado final da expressão seja um array de números, por exemplo:
  ```javascript
  w = wiggle(15, 20);
  [w[0], w[1]]; // Garante retorno 2D correto
  ```
* **Universalizar Expressões**: Utilize o script *ExpressionUniversalizer* ou escreva expressões utilizando índices (ex: `thisComp.layer(index + 1)`) ao invés de nomes de mídias para evitar quebra de idioma.

## Soluções Via Script (Quando Seguro)
O AE-mcp pode propor scripts JSX para corrigir erros comuns ou desabilitar expressões quebradas temporariamente:
```javascript
// Exemplo JSX para desativar expressões com erro em lote
var comp = app.project.activeItem;
if (comp && comp instanceof CompItem) {
    app.beginUndoGroup("Desativar Expressões Quebradas");
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        // Varredura recursiva de propriedades e desativação se expressionError não for vazio
    }
    app.endUndoGroup();
}
```
*Atenção*: O AE-mcp não aplicará este JSX automaticamente sem a sua aprovação explícita e sempre trabalhará em uma cópia segura do projeto.
