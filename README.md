# AE-mcp: Ponte Local entre Adobe After Effects e IA

O `AE-mcp` é uma ponte (bridge) local e segura desenvolvida para permitir que agentes de Inteligência Artificial inspecionem, analisem e apliquem edições controladas em projetos abertos no Adobe After Effects (AE) no Windows.

Esta fase (**Tool Inventory**) permite mapear o ecossistema local do After Effects: quais plugins, scripts, painéis, presets, extensões e documentações estão instalados no seu computador, fornecendo um inventário rico para tomada de decisão pela IA.

---

## 📂 Recursos de Inventário e Catálogos

A ponte opera com quatro arquivos de dados e catálogos:

### 1. Catálogo de Efeitos (`effects_catalog.json`)
* **Como é gerado**: Executado diretamente dentro do After Effects com `export-effects`.
* **O que mostra**: A lista real de efeitos instalados que o After Effects **reconhece de fato** (usando `app.effects`), incluindo Match Names (ex: `ADBE Slider Control`, `ADBE Glass`), categorias e versões.

### 2. Inventário de Arquivos Locais (`local_inventory.json`)
* **Como é gerado**: Executado localmente pelo Node.js com `scan-inventory`.
* **O que mostra**: Metadados de arquivos mapeados de forma dedupada.
* **Categoria por Contexto**: O campo `category` representa a classificação baseada na extensão e na estrutura do caminho, não sendo uma simples herança da pasta raiz.
* **Grupos em Dois Níveis**: Cada item rastreado possui os campos:
  * `parentFolderGroup`: Nome da pasta pai imediata do arquivo.
  * `topLevelToolGroup`: Nome da primeira pasta relativa ao `sourceRoot`. Se o arquivo estiver diretamente na raiz do `sourceRoot`, esse campo será `null`.
  * *Exemplo*: Um preset localizado em `Plug-ins/RTFX/Transitions/Impact.ffx` terá `parentFolderGroup` como `"Transitions"` e `topLevelToolGroup` como `"RTFX"`.

### 3. Agrupamento de Ferramentas (`tool_groups.json`)
* **Como é gerado**: Compilado automaticamente durante a execução de `scan-inventory`.
* **O que mostra**: Pastas estruturadas como pacotes ou ferramentas (ex: *RTFX*, *Duik*).
* **groupLevel (Níveis de Grupo)**:
  * `"parent"`: Mapeia o diretório pai imediato contendo arquivos (ex: a subpasta `"Transitions"` dentro de `RTFX`).
  * `"topLevel"`: Mapeia a primeira pasta relativa ao `sourceRoot` (ex: a pasta raiz do pacote `"RTFX"`), acumulando todos os arquivos contidos em qualquer uma de suas subpastas (como `Transitions` e `UI`).
  * *Deduplicação de Grupos*: O scanner usa a chave combinada `groupLevel + ":" + normalizedPath` para garantir que um diretório que seja ao mesmo tempo pai e raiz de ferramenta não sofra colisão no dedupe e seja catalogado corretamente em ambos os níveis.
* **Agrupamento Inteligente**: Uma pasta gera um grupo apenas se:
  * Contiver 2 ou mais arquivos relevantes;
  * OU o nome da pasta corresponder a um termo conhecido (ex: *Duik, AutoSway, RTFX, Red Giant, Sapphire, BCC, Mister Horse*);
  * OU contiver uma mistura de tipos de arquivos (ex: scripts + presets).
* **Metadados de Grupo**: Inclui a categorização (`tool_package`, `preset_pack`, `mixed_tool_package`, etc.), extensões, quantidade de arquivos (`fileCount`), o fornecedor provável (`possibleVendor`), flags booleanas de conteúdo (`containsScripts`, `containsPresets`, `containsPlugins`, `containsPanels`, `containsDocs`) e uma justificativa explicativa (`reason`).

### 4. Capacidades das Ferramentas (`tool_capabilities.example.json` / `tool_capabilities.json`)
* **O que é**: Mapeamento que ensina à IA os casos de uso, nível de automação e limitações de cada ferramenta.
* **Uso Local**: O arquivo `tool_capabilities.example.json` é versionado no Git como modelo. Copie-o para criar o arquivo local **`data/tool_capabilities.json`** (que já está configurado no `.gitignore` para preservar suas preferências privadas locais).

---

## 🔒 Regras de Segurança e Privacidade

O escaneamento local segue regras rígidas:
* **Strict Metadata-Only (Sem Leitura de Conteúdo)**: Nenhum arquivo é aberto ou lido internamente (isso inclui arquivos de script `.jsx`, textos `.txt`, Markdown `.md`, HTML `.html`, JSON `.json` ou documentos `.pdf`). Apenas atributos do sistema de arquivos são catalogados.
* **Filtro de Diretórios e Arquivos Sensíveis**: O scanner ignora completamente qualquer diretório ou arquivo contendo termos de chaves, senhas ou licenças. Se uma pasta for nomeada com um termo sensível (ex: `license`, `serial`, `crack`, `auth`, `credentials`), ela e todo o seu conteúdo são ignorados. O termo `auth` foi refined para evitar falsos positivos com palavras como `author` ou `authoring`.
* **Sem Transferência ou Cópia**: Tudo permanece local.

---

## 🚀 Configuração e Requisitos

### 1. Habilitar Gravação de Arquivos no After Effects
Para permitir exportações de metadados dentro do After Effects:
1. Abra o After Effects.
2. Vá em **Edit > Preferences > General** (Editar > Preferências > Geral).
3. Marque a caixa: **Allow Scripts to Write Files and Access Network** (Permitir que os scripts gravem arquivos e acessem a rede).
4. Clique em **OK**.

### 2. Configurar o Projeto Local
1. Copie o arquivo de exemplo de configuração:
   ```bash
   copy config.example.json config.json
   ```
2. Abra o arquivo `config.json` e configure os caminhos do After Effects e das pastas de inventário do seu sistema.
   * **Inventário de Pastas Mistas (`mixedContentDirs`)**: A pasta de Plug-ins do After Effects (`D:\After Effects\Adobe After Effects 2025\Support Files\Plug-ins`) deve ser mantida apenas nesta chave. Isso ocorre porque ela é uma pasta mista (contendo presets, scripts compilados, painéis e subpastas de ferramentas). Deixe `pluginDirs` para pastas dedicadas unicamente a plugins binários tradicionais (como MediaCore).
   ```json
   {
     "afterEffectsPath": "D:\\After Effects\\Adobe After Effects 2025\\Support Files\\AfterFX.exe",
     "projectBasePath": "D:\\documentos\\Projetos\\AE-mcp",
     "dataDir": "data",
     "logDir": "logs",
     "inventory": {
       "pluginDirs": [
         "C:\\Program Files\\Adobe\\Common\\Plug-ins\\7.0\\MediaCore"
       ],
       "scriptDirs": [
         "D:\\After Effects\\Adobe After Effects 2025\\Support Files\\Scripts",
         "D:\\After Effects\\Adobe After Effects 2025\\Support Files\\Scripts\\ScriptUI Panels"
       ],
       "presetDirs": [
         "D:\\After Effects\\Adobe After Effects 2025\\Support Files\\Presets"
       ],
       "extensionDirs": [
         "C:\\Program Files (x86)\\Common Files\\Adobe\\CEP\\extensions",
         "C:\\Users\\%USERNAME%\\AppData\\Roaming\\Adobe\\CEP\\extensions"
       ],
       "mixedContentDirs": [
         "D:\\After Effects\\Adobe After Effects 2025\\Support Files\\Plug-ins"
       ],
       "docDirs": [
         "knowledge"
       ]
     }
   }
   ```
3. Valide o diagnóstico local de pastas e caminhos executando:
   ```bash
   node node/cli.js check-config
   ```

---

## 🛠️ Como Usar a CLI

Abra o terminal no diretório do projeto e execute:

```bash
# 1. Validar configuração local de diretórios e scripts
node node/cli.js check-config

# 2. Mapear inventário e grupos locais (gera data/local_inventory.json e data/tool_groups.json)
node node/cli.js scan-inventory

# 3. Exportar catálogo de efeitos instalados no AE (gera data/effects_catalog.json)
node node/cli.js export-effects

# 4. Exportar dados da composição ativa
node node/cli.js export-active-comp

# 5. Exportar transformações/keyframes dos layers selecionados
node node/cli.js export-selected-layers

# 6. Escanear erros de expressões no projeto
node node/cli.js check-expression-errors

# 7. Aplicar presets seguros (cria cópia da composição)
node node/cli.js mmv-shake
node node/cli.js zoom-impact
node node/cli.js text-flicker
```

> [!WARNING]
> **Sincronismo de Execução**:
> Comandos que iniciam o After Effects (como `export-effects` ou `mmv-shake`) retornam sucesso na CLI assim que o After Effects aceita o script. Verifique o arquivo `logs/ae_bridge.log` e a pasta `data/` para acompanhar o status e o resultado das execuções internas do JSX.

---

## 💡 Pasta `knowledge/` (Base de Conhecimento)

A pasta `knowledge/` serve para guardar anotações manuais em Markdown sobre fluxos de trabalho (MMV), parâmetros de efeitos de glow/shake, limitações e guias rápidos de uso de ferramentas (como Duik Angela, AutoSway, RTFX) para consulta direta da IA.

---

## 🤖 AE Editing Copilot (Assistente de Edição)

O `AE-mcp` evoluiu para incluir uma camada de **Assistente de Edição (AE Editing Copilot)**, focada no fluxo de trabalho de MMVs (Music Movie Videos), AMVs, anime edits e sincronização de batidas (beat sync). 

A arquitetura de assistente ajuda a IA a entender tanto o contexto técnico do seu After Effects quanto os guias de boas práticas criativas e solução de problemas locais.

### Comandos do Copilot
```bash
# 1. Obter conselho de contexto (sugere quais comandos rodar e arquivos enviar para a IA)
node node/cli.js context-advisor "sua pergunta aqui"

# Exemplo com saída JSON para MCP / Integração:
node node/cli.js context-advisor "quero fazer um impacto no beat" --json

# 2. Exportar diagnósticos detalhados da composição ativa (gera data/diagnostics.json)
node node/cli.js export-diagnostics

# 3. Compilar um pacote de revisão completo para enviar para a IA (gera pasta em data/review_packages/)
node node/cli.js export-review-package

# 4. Executar os diagnósticos e exports principais e depois empacotar tudo em lote
node node/cli.js export-review-package --run-checks
```

### Phase 3.5 — Project-Wide Context (Análise de Todo o Projeto)

Esta fase adiciona comandos para analisar o projeto inteiro, permitindo que a IA entenda a estrutura de composições, dependências de precomps/footages e problemas globais mesmo quando nenhuma composição está ativa na tela.

#### Novos Comandos Project-Wide:
```bash
# 1. Exporta resumo leve de todas as comps, configurações e candidatos a comp principal (gera data/project_summary.json)
node node/cli.js export-project-summary

# 2. Exporta mapa estrutural de dependências, layers e expressões resumidas (gera data/project_map.json)
node node/cli.js export-project-map

# 3. Exporta propriedades profundas e keyframes (heavy scan, gera data/project_deep.json)
node node/cli.js export-project-deep

# 4. Exporta dados detalhados de uma composição específica por nome ou ID (mode: summary|map|deep, gera data/comps/<nome>.json)
node node/cli.js export-comp-by-name "Nome Da Minha Comp" map
node node/cli.js export-comp-by-name 123 deep
```

#### Diretrizes de Uso e Segurança:
* **Leves e Seguros**: Os comandos `export-project-summary` e `export-project-map` são leves e seguros para rodar com frequência. Eles são executados automaticamente ao rodar `export-review-package --run-checks` para garantir que a IA tenha uma visão completa do projeto.
* **Scan Profundo (Heavy)**: O comando `export-project-deep` pode ser extremamente pesado dependendo do tamanho do projeto (pois percorre todas as propriedades e keyframes de todas as camadas). Por isso:
  * **Não é executado automaticamente** por `export-review-package --run-checks`.
  * Deve ser usado manualmente apenas quando necessário.
  * Pode ser configurado/limitado editando o arquivo `data/project_deep_request.json` (que é gerado automaticamente com limites padrão seguros ao rodar o comando pela primeira vez). Os campos suportados são:
    * `maxComps` (padrão: 5)
    * `maxLayersPerComp` (padrão: 20)
    * `maxPropertiesPerLayer` (padrão: 50)
    * `includeExpressions` (padrão: true)
    * `includeExpressionSource` (padrão: false - se true, exporta o código completo da expressão)
    * `includeKeyframes` (padrão: `"summary"`, valores suportados: `"none"`, `"summary"`, `"values"`)
* **Nomes Duplicados**: O comando `export-comp-by-name` lidará de forma segura com composições que possuem nomes idênticos no projeto. Se duplicatas forem encontradas, o comando retornará um arquivo JSON de erro com o código `MULTIPLE_COMPS_FOUND` e uma lista com o ID e o nome de cada correspondência para que você possa especificar o `compId` único na próxima execução.
```

### Phase 4 — Visual Review Assistant (Assistente de Revisão Visual)

Esta fase adiciona suporte para a IA analisar frames estáticos e previews de vídeo da composição ativa, permitindo a identificação de problemas estéticos e visuais (enquadramento, intensidade de glow, contraste de cor, legibilidade de texto, ritmo de movimento) que não aparecem nos relatórios puramente de código.

#### Novos Comandos Visuais:
```bash
# 1. Exporta um PNG do frame atual na linha do tempo da comp ativa (gera data/visual_snapshots/<timestamp>/current_frame.png)
node node/cli.js export-frame-snapshot

# 2. Exporta múltiplos frames representativos (início, meio, fim, tempo atual e markers de comp) de forma segura restaurando a agulha de tempo ao final (gera pasta data/visual_snapshots/frames/)
node node/cli.js export-timeline-frames

# 3. Renderiza um vídeo curto em baixa resolução (MP4) usando aerender.exe para análise de movimento (experimental/best-effort)
node node/cli.js render-preview

# 4. Compila um pacote completo mesclando relatórios técnicos e mídias visuais (gera data/visual_review_packages/<timestamp>/)
node node/cli.js export-visual-review-package

# 5. Executa os checks técnicos e visuais principais em lote e empacota tudo junto
node node/cli.js export-visual-review-package --run-checks
```

#### Diretrizes de Análise Visual e Limitações:
* **Frames vs. Vídeo (Preview)**:
  * **Frames Estáticos (PNG)** são suficientes para análise visual estática (layout, composição de cena, cores, enquadramento de personagem, legibilidade de textos).
  * **Preview de Vídeo (MP4)** é opcional e experimental (depende do `aerender.exe` configurado e do projeto estar salvo no disco).
  * **Atenção**: Sem o vídeo de preview, a IA não possui contexto de movimento e **não deve** fazer afirmações definitivas sobre a fluidez do timing, pacing ou transições de corte.
* **Segurança e Isolamento**: Nenhuma imagem ou vídeo é enviado externamente de forma automática. O empacotamento é totalmente local. O processo de restauração de tempo em `export-timeline-frames` usa tratamento de erro robusto (`try/catch/finally`) para garantir que a agulha de tempo (`comp.time`) sempre volte à sua posição original mesmo se houver erro ao salvar as imagens.

### Exemplos Práticos de Uso

#### Exemplo A: "como faço um impacto no beat?"
1. Execute o conselheiro de contexto:
   ```bash
   node node/cli.js context-advisor "como faço um impacto no beat?"
   ```
2. O script identificará o intent `how_to`/`plan_workflow` com alta confiança, sugerindo os guias relevantes (ex: `knowledge/workflows/mmv-impact.md` e `knowledge/tools/rtfx.md`) e os arquivos de dados a serem enviados.

#### Exemplo B: "meu AutoSway não funciona no cabelo"
1. Execute o conselheiro de contexto:
   ```bash
   node node/cli.js context-advisor "meu AutoSway não funciona no cabelo"
   ```
2. O conselheiro identificará o intent `troubleshoot`, sugerindo a execução do pacote de revisão completo e recomendando guias como `knowledge/troubleshooting/autosway-not-working.md`.
3. Gere o pacote executando diagnósticos frescos no After Effects:
   ```bash
   node node/cli.js export-review-package --run-checks
   ```
4. Navegue até a pasta criada `data/review_packages/<timestamp>/`, abra o arquivo `prompt_for_ai.md`, preencha os campos de contexto criativo e envie o pacote para análise.

#### Exemplo C: "minha composição está estranha"
1. Execute o conselheiro:
   ```bash
   node node/cli.js context-advisor "minha composição está estranha"
   ```
2. O sistema identificará um `visual_review` (análise estética).
3. Gere o pacote de revisão com `node node/cli.js export-review-package --run-checks`.
4. Envie o pacote para a IA analisar. 

> [!NOTE]
> **Avaliação de Estética Visual**: A IA não consegue avaliar a estética de imagens e vídeos de forma puramente matemática a partir do código ou de metadados estruturais sem mídias reais de frames ou pré-visualizações de vídeo (recurso planejado para o futuro). No entanto, o **Pacote de Revisão** ajuda a IA a mapear com extrema precisão a hierarquia de layers, tempo de tela, presença de motion blur, curvas de keyframes no gráfico e potenciais erros ocultos que causam a estranheza técnica.

---

## 🔒 Regras de Segurança do Copilot
* **Zero Alterações**: O assistente atua de forma estritamente analítica nesta fase. Ele **não** modifica o seu projeto `.aep` original, **não** deleta camadas e **não** aplica JSX de edição automaticamente sem seu consentimento explícito.
* **Diagnósticos em Cópia**: Qualquer ajuste gerado ou sugerido pela IA deve ser testado em uma cópia segura do seu projeto ou composição.
