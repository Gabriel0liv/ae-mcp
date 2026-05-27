# AE-mcp: Ponte Local entre Adobe After Effects e IA

O `AE-mcp` é uma ponte (bridge) local e segura desenvolvida para permitir que agentes de Inteligência Artificial inspecionem, analisem e apliquem edições controladas em projetos abertos no Adobe After Effects (AE) no Windows.

Esta fase inicial do projeto foca em **estabilizar a comunicação local via scripts JSX e utilitários Node.js (CLI)**. A integração com o Model Context Protocol (MCP) real de agentes de IA e interfaces visuais será realizada em uma fase posterior.

---

## Recursos Principais

### Leitura e Exportação
1. **Composição Ativa (`export-active-comp`)**: Extrai metadados completos da composição aberta e lista detalhada de layers (atributos, blending modes, detecção de efeitos, máscaras e expressões).
2. **Layers Selecionados (`export-selected-layers`)**: Exporta transformações (Anchor Point, Position, Scale, Rotation, Opacity) e seus keyframes/curvas de interpolação.
3. **Footage Ausente (`check-missing-footage`)**: Varre a biblioteca do projeto e aponta arquivos offline/missing.
4. **Erros de Expressão (`check-expression-errors`)**: Varredura profunda e recursiva por todas as propriedades (incluindo efeitos, máscaras, textos e shapes) para identificar expressões quebradas, usando try/catch individualizado para evitar travamentos.

### Aplicação de Presets Seguros (MMV / Animação)
1. **MMV Shake (`mmv-shake`)**: Duplica a composição ativa, ativa o Motion Blur e aplica tremor (wiggle) aos layers selecionados.
2. **Zoom Impact (`zoom-impact`)**: Duplica a composição ativa e aplica uma animação curta e dinâmica de impacto (escala e posição) com curvas de Easing suaves nos layers selecionados.
3. **Text Opacity Flicker (`text-flicker`)**: Duplica a composição ativa e aplica expressão de flicker estroboscópico de opacidade nos layers selecionados.

---

## 🔒 Regras de Segurança Críticas (Integridade do Projeto)

Para proteger seus arquivos de produção, a ponte segue regras rígidas:
* **Duplicação Obrigatória**: Presets de edição **nunca** modificam a composição original. Uma cópia é gerada com sufixo (ex: `_AI_Shake_001`).
* **Rastreamento por Índice**: Os layers selecionados no momento da execução são identificados por seus índices na composição original e mapeados diretamente na composição duplicada. Isso evita perda de referências após a duplicação.
* **Sem Destruição**: O script nunca apaga layers, composições ou deleta arquivos `.aep`.
* **Sem Sobrescrita**: Arquivos de projeto nunca são salvos por cima do original.
* **Undo Amigável**: Todas as ações são agrupadas via `app.beginUndoGroup()` e `app.endUndoGroup()`, permitindo reverter as alterações no After Effects com um simples `Ctrl + Z`.

---

## 🚀 Requisitos e Configuração

### 1. Habilitar Gravação de Arquivos no After Effects
Para que o After Effects permita que os scripts JSX exportem arquivos JSON locais, você deve ativar a seguinte opção:

1. Abra o After Effects.
2. Vá em **Edit > Preferences > General** (Editar > Preferências > Geral).
3. Marque a caixa: **Allow Scripts to Write Files and Access Network** (Permitir que os scripts gravem arquivos e acessem a rede).
4. Clique em **OK**.

### 2. Configurar o Projeto Local
1. Copie o arquivo de exemplo de configuração:
   ```bash
   copy config.example.json config.json
   ```
2. Abra o arquivo `config.json` e configure os caminhos de acordo com seu ambiente:
   ```json
   {
     "afterEffectsPath": "C:\\Program Files\\Adobe\\Adobe After Effects 2024\\Support Files\\AfterFX.exe",
     "projectBasePath": "d:\\documentos\\Projetos\\AE-mcp",
     "dataDir": "data",
     "logDir": "logs"
   }
   ```
   *Nota: No Windows, utilize duas barras invertidas (`\\`) nos caminhos do JSON.*

3. Valide o diagnóstico local de pastas e caminhos executando:
   ```bash
   node node/cli.js check-config
   ```

---

## 🛠️ Como Usar

### Executando pelo Node.js CLI (Recomendado)
Abra o prompt de comando ou terminal no diretório do projeto e execute:

```bash
# Diagnóstico de caminhos e scripts locais
node node/cli.js check-config

# Exportar dados da composição ativa
node node/cli.js export-active-comp

# Exportar transformações dos layers selecionados
node node/cli.js export-selected-layers

# Verificar se há footages offline
node node/cli.js check-missing-footage

# Escanear erros de expressões no projeto
node node/cli.js check-expression-errors

# Aplicar efeito de Shake (tremor)
node node/cli.js mmv-shake

# Aplicar efeito de Zoom Impact
node node/cli.js zoom-impact

# Aplicar Flicker de opacidade
node node/cli.js text-flicker
```

> [!WARNING]
> **Sincronismo de Execução**:
> O CLI do Node envia o comando de execução e retorna sucesso imediatamente após o After Effects aceitar o script. Para verificar se o script JSX executou com sucesso interno (ou se deu erro de permissão/objeto), consulte o arquivo de log gerado em [ae_bridge.log](file:///d:/documentos/Projetos/AE-mcp/logs/ae_bridge.log) e verifique os resultados exportados na pasta `data/`.


### Executando Manualmente dentro do After Effects
Caso queira executar os scripts diretamente pelo After Effects sem usar o Node.js:
1. Vá em **File > Scripts > Run Script File...** (Arquivo > Scripts > Executar Arquivo de Script...).
2. Escolha o script desejado na pasta `jsx/` (ou `jsx/presets/`).

---

## 🔄 Fluxo de Trabalho Recomendado com IA

1. Abra o After Effects e carregue seu projeto `.aep`.
2. Abra a composição que deseja trabalhar no painel de visualização (Active Comp).
3. Selecione os layers que serão alvos de animação.
4. Execute o exportador de dados da CLI:
   ```bash
   node node/cli.js export-active-comp
   ```
5. Forneça o arquivo gerado em `data/active_comp.json` para o seu Agente de IA.
6. A IA analisa as camadas, durações e o contexto do vídeo.
7. O Agente de IA recomenda a aplicação de presets locais através da CLI (ex: `zoom-impact`).
8. O preset gera a nova composição modificada mantendo o seu projeto original intocado.

---

## 🔮 Futuro do Projeto
* **Model Context Protocol (MCP)**: Integração com servidores MCP para permitir que o Agente de IA execute comandos da CLI de forma autônoma e em tempo real.
* **Painel CEP/UX**: Interface interna dentro do After Effects para interação direta e chat com IA.
* **Renderização Automatizada**: Integração com `aerender` para exportação rápida de previews em vídeo.
