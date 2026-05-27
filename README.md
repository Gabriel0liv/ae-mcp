# AE-mcp: Ponte Local entre Adobe After Effects e IA

O `AE-mcp` é uma ponte (bridge) local e segura desenvolvida para permitir que agentes de Inteligência Artificial inspecionem, analisem e apliquem edições controladas em projetos abertos no Adobe After Effects (AE) no Windows.

Esta fase (**Tool Inventory**) permite mapear o ecossistema local do After Effects: quais plugins, scripts, painéis, presets, extensões e documentações estão instalados no seu computador, fornecendo um inventário rico para tomada de decisão pela IA.

---

## 📂 Recursos de Inventário e Catálogos

A ponte opera com dois tipos de rastreamento fundamentais:

### 1. Catálogo de Efeitos (`effects_catalog.json`)
* **Como é gerado**: Executado diretamente dentro do After Effects através do comando `export-effects`.
* **O que mostra**: A lista real de efeitos instalados que o After Effects **reconhece de fato** (usando `app.effects`), incluindo o Match Name de efeitos de terceiros (ex: Red Giant, Video Copilot, etc.), categorias e versões.

### 2. Inventário de Arquivos Locais (`local_inventory.json`)
* **Como é gerado**: Executado localmente pelo Node.js (sem abrir o After Effects) através do comando `scan-inventory`.
* **O que mostra**: Arquivos e pastas mapeados recursivamente nas pastas de plugins, scripts, ScriptUI panels, presets e CEP do sistema.
* **Ferramentas Identificadas**: Classifica se as ferramentas são scripts simples, ScriptUI Panels (como *Duik Angela* e *AutoSway*), extensões CEP/ZXP, presets individuais `.ffx` ou pacotes de presets (como *RTFX*).

### 3. Recursos de Ferramentas (`tool_capabilities.example.json`)
* **O que é**: Um arquivo de modelo onde o usuário anota as capacidades de automação de ferramentas complexas (Duik Angela, AutoSway, RTFX) para guiar o agente de IA sobre como recomendar, usar ou interagir com cada uma delas.

---

## 🔒 Regras de Segurança e Privacidade

O escaneamento local foi projetado seguindo princípios rígidos de segurança e privacidade:
* **Sem Leitura de Binários**: Arquivos compactados ou compilados (`.aex`, `.zxp`, `.jsxbin`, `.ffx`) **nunca** são abertos ou lidos pelo conteúdo. Apenas seus metadados (nome, tamanho, data de modificação e caminho) são mapeados.
* **Filtro Antivazamento de Licenças**: O scanner ignora automaticamente qualquer arquivo ou pasta que contenha em seu nome termos associados a ativações, senhas ou licenças (ex: `license`, `licence`, `serial`, `keygen`, `crack`, `activation`, `token`, `password`).
* **Sem Transferência de Arquivos**: Nenhum binário ou arquivo de script é copiado, movido ou transmitido para fora do seu computador. Tudo permanece local.

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
2. Abra o arquivo `config.json` e configure os caminhos do After Effects e das pastas de inventário do seu sistema. Variáveis de ambiente como `%USERNAME%` ou `%APPDATA%` serão expandidas automaticamente:
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
       "docDirs": [
         "knowledge"
       ]
     }
   }
   ```

---

## 🛠️ Como Usar a CLI

Abra o terminal no diretório do projeto e execute:

```bash
# 1. Validar configuração local de diretórios e scripts
node node/cli.js check-config

# 2. Escanear inventário local de arquivos (gera data/local_inventory.json)
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
