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
* **O que mostra**: Metadados (nome, caminho, extensão, tamanho, data de modificação) de arquivos mapeados de forma dedupada.
* **Categoria por Contexto**: O campo `category` representa a classificação real baseada na extensão do arquivo e na estrutura do caminho, não sendo uma simples herança da pasta raiz (ex: scripts `.jsxbin` ou presets `.ffx` localizados dentro de subpastas do diretório de Plug-ins serão classificados corretamente como `script_compiled` ou `preset`).

### 3. Agrupamento de Ferramentas (`tool_groups.json`)
* **Como é gerado**: Compilado automaticamente durante a execução do comando `scan-inventory`.
* **O que mostra**: Pastas agrupadas como ferramentas ou pacotes de ferramentas (ex: *RTFX*).
* **Regras de Agrupamento**: Uma pasta gera um grupo apenas se:
  * Contiver 2 ou mais arquivos relevantes;
  * OU o nome da pasta corresponder a um termo conhecido (ex: *Duik, AutoSway, RTFX, Red Giant, Sapphire, BCC, Mister Horse*);
  * OU contiver uma mistura de tipos de arquivos relevantes (ex: scripts + presets, plugins + scripts).
* **Metadados de Grupo**: Inclui o nível de confiança do mapeamento (`high`, `medium`, `low`), categorização (`tool_package`, `preset_pack`, `mixed_tool_package`, etc.), as extensões encontradas e uma justificativa explicativa (`reason`).

### 4. Capacidades das Ferramentas (`tool_capabilities.example.json` / `tool_capabilities.json`)
* **O que é**: Mapeamento que ensina à IA os casos de uso, nível de automação e limitações de cada ferramenta.
* **Uso Local**: O arquivo `tool_capabilities.example.json` é versionado no Git como modelo. Copie-o para criar o arquivo local **`data/tool_capabilities.json`**.
* **Segurança do Usuário**: O arquivo real `data/tool_capabilities.json` é ignorado pelo Git, permitindo que você adicione anotações privadas, caminhos específicos do seu ambiente e preferências pessoais.

---

## 🔒 Regras de Segurança e Privacidade

O escaneamento local foi projetado seguindo princípios rígidos de privacidade:
* **Strict Metadata-Only (Sem Leitura de Conteúdo)**: Nenhum arquivo é aberto ou lido internamente (isso inclui arquivos de script `.jsx`, textos `.txt`, Markdown `.md`, HTML `.html`, JSON `.json` ou documentos `.pdf`). Apenas atributos do sistema de arquivos são catalogados.
* **Filtro de Diretórios e Arquivos Sensíveis**: O scanner ignora completamente qualquer diretório ou arquivo que contenha termos de chaves, senhas, licenças ou hacks. Se uma pasta for nomeada com um termo sensível (ex: `license`, `serial`, `keygen`, `crack`, `auth`, `credentials`), ela e todo o seu conteúdo são sumariamente ignorados.
* **Sem Transferência ou Cópia**: Nenhum binário ou dado local é movido ou transmitido. Tudo permanece no seu computador.

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
2. Abra o arquivo `config.json` e configure os caminhos do After Effects e das pastas de inventário do seu sistema. Utilize `mixedContentDirs` para diretórios que contenham múltiplos tipos de ferramentas misturadas (como a pasta `Plug-ins` do After Effects 2025):
   ```json
   {
     "afterEffectsPath": "D:\\After Effects\\Adobe After Effects 2025\\Support Files\\AfterFX.exe",
     "projectBasePath": "D:\\documentos\\Projetos\\AE-mcp",
     "dataDir": "data",
     "logDir": "logs",
     "inventory": {
       "pluginDirs": [
         "D:\\After Effects\\Adobe After Effects 2025\\Support Files\\Plug-ins",
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
