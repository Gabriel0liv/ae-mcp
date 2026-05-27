# Troubleshooting: Missing Footage (Offline Media)

## Sintomas
* Mídias de vídeo ou imagem são exibidas na tela como barras verticais coloridas (azul, verde, vermelho, branco) padrão do After Effects.
* O painel Project exibe mídias com um ícone de interrogação ou quadrado de barras de cores.
* Caixa de diálogo de aviso ao abrir o projeto: *"X files are missing since you last saved this project"*.

## Causas Prováveis
* **Mudança de Localização dos Arquivos**: Os arquivos de vídeo originais do anime foram movidos de pasta no seu HD.
* **Pendrive ou HD Externo Desconectado**: O projeto dependia de arquivos guardados em um drive externo que foi desconectado.
* **Renomeação de Arquivos**: O nome do arquivo de mídia física foi alterado no sistema de arquivos do Windows.
* **Projetos Compartilhados**: O projeto foi baixado da internet ou compartilhado por outro editor que usava caminhos absolutos diferentes.

## Como Verificar no AE
1. Na barra de pesquisa do painel Project, digite: **missing** ou **ausente**.
2. O After Effects filtrará todos os itens de mídias que estão offline.
3. Para ver o caminho de origem do arquivo ausente, clique no arquivo com o botão direito e escolha *Reveal in Explorer* (se ativo) ou verifique o painel superior de informações do Project.

## Quais Dados do AE-mcp Ajudam
* **`check-missing-footage` (Comando CLI)**: Varre todo o catálogo do projeto e salva uma lista contendo o nome, tipo e o último caminho absoluto conhecido de todas as mídias ausentes em `data/missing_footage.json`.
* **`export-diagnostics` (Comando CLI)**: Retorna a quantidade de mídias offline e adiciona logs com severidade `"error"` recomendando a substituição dos caminhos.

## Soluções Manuais
1. No painel Project, dê um clique duplo sobre a mídia que está com barras coloridas.
2. A janela do gerenciador de arquivos do Windows será aberta. Navegue até a nova pasta onde o vídeo está salvo e selecione o arquivo.
3. Ao reconectar uma mídia, o After Effects tentará automaticamente encontrar outras mídias ausentes na mesma pasta ou subpastas relativas.

## Soluções Via Script (Quando Seguro)
O AE-mcp pode ler o arquivo `data/missing_footage.json` e, se você configurar a nova pasta base no seu `config.json`, pode gerar um JSX que busca e atualiza dinamicamente os caminhos de importação das mídias offline:
```javascript
// Exemplo conceitual JSX para reconectar mídias
var project = app.project;
var searchFolder = new Folder("D:/NovasMidas/Anime");
// Varre itens ausentes e substitui por arquivos correspondentes em searchFolder
```
*Atenção*: Esse script será gerado apenas como proposta textual para que você aplique com segurança e controle.
