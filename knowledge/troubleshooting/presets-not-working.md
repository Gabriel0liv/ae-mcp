# Troubleshooting: Presets Not Working (.ffx Files)

## Sintomas
* O After Effects exibe um alerta de erro ao aplicar o preset `.ffx` ou durante a inicialização: *"Preset cannot be applied"* ou *"Effect or engine is missing"*.
* O preset é aplicado com sucesso na timeline, mas a tela fica preta, o efeito não renderiza, ou a animação permanece estática.

## Causas Prováveis
* **Ausência de Plugins de Terceiros Necessários**: O preset `.ffx` foi criado por outro editor e contém efeitos aplicados de plugins como Sapphire ou Red Giant que você não possui instalados na sua máquina.
* **Caminhos de Efeitos Diferentes (Idioma)**: O preset tenta chamar efeitos nativos pelo nome em inglês (ex: *Fast Box Blur*), mas o seu After Effects está configurado em outro idioma (onde o efeito chama *Desfoque de Caixa Rápido*).
* **Versão Incompatível do After Effects**: O preset foi salvo em uma versão muito mais recente do After Effects (ex: AE 2024/2025) e o usuário está tentando aplicar em uma versão mais antiga (ex: AE CC 2019).
* **Propriedades Desvinculadas**: O preset depende de expressões internas que apontam para mídias ou Sliders controladores que não existem na composição atual.

## Como Verificar no AE
1. Aplique o preset no layer e pressione `F3` no teclado para abrir o painel *Effect Controls*.
2. Verifique se existem efeitos marcados com a mensagem de aviso `(Missing)` na cor cinza ou vermelha.
3. Pressione a tecla `U` para expor se existem expressões internas do preset exibindo a barra de erros de Javascript.

## Quais Dados do AE-mcp Ajudam
* **`check-config` e `scan-inventory` (Comando CLI)**: Mapeia todos os presets disponíveis nas suas pastas de Presets e verifica a integridade de caminhos absolutos locais do projeto.
* **`check-expression-errors` (Comando CLI)**: Identifica se o preset quebrado gerou expressões com falha nas propriedades do layer e aponta a causa exata.

## Soluções Manuais
* **Instalar Plugins Faltantes**: Verifique quais plugins são exigidos pelo criador do preset (ex: Sapphire, Boris FX, Red Giant, Universe, Deep Glow) e instale-os na sua máquina.
* **Substituir Efeitos Missing**: Se o efeito em falta for nativo do After Effects (como desfoques ou distorções), remova a instância `(Missing)` e aplique o equivalente manualmente através do painel de efeitos nativos.
* **Renomear no Efeito**: Altere os parâmetros das expressões geradas pelo preset para corresponderem ao idioma do seu After Effects.

## Soluções Via Script (Quando Seguro)
O AE-mcp não modificará os arquivos `.ffx` binários originais, mas pode propor a criação de scripts JSX para limpar ou reconfigurar as propriedades quebradas aplicadas no layer:
```javascript
// Exemplo JSX para remover efeitos marcados como "Missing"
var comp = app.project.activeItem;
if (comp && comp instanceof CompItem) {
    app.beginUndoGroup("Remover Efeitos Ausentes");
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        var fxGroup = layer.effect;
        if (fxGroup) {
            for (var j = fxGroup.numProperties; j >= 1; j--) {
                var fx = fxGroup.property(j);
                if (fx.name.indexOf("(Missing)") !== -1) {
                    fx.remove();
                }
            }
        }
    }
    app.endUndoGroup();
}
```
*Atenção*: Esse script removerá os efeitos quebrados permitindo a visualização limpa do restante da cena.
