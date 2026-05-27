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

A pasta `knowledge/` serve para guardar anotações manuais em Markdown sobre fluxos de trabalho (MMV), parâmetros ideais de efeitos de glow/shake, limitações e guias rápidos de uso de ferramentas complexas (como Duik Angela, AutoSway, RTFX) para consulta direta da IA. Veja mais em [knowledge/README.md](file:///d:/documentos/Projetos/AE-mcp/knowledge/README.md).
