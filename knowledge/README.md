# Pasta de Conhecimento Local (Knowledge Base)

Esta pasta serve como base de conhecimento local para guardar anotações, notas técnicas, parâmetros recomendados, fluxos de trabalho (workflows) e limitações sobre ferramentas e técnicas usadas no After Effects para MMV e animação.

Qualquer Agente de IA que interaja com este repositório no futuro poderá ler esses arquivos de documentação para entender suas preferências de design e saber exatamente como aplicar e recomendar cada ferramenta.

---

## Estrutura Sugerida de Arquivos

Recomendamos organizar as notas nas seguintes subpastas:

```
knowledge/
├─ README.md                    <- Este arquivo explicativo
├─ plugins/
│  └─ deep-glow.md              <- Notas sobre o plugin Deep Glow e similares
├─ scripts/
│  ├─ duik-angela.md            <- Fluxo de Rigging e controladores
│  └─ autosway.md               <- Parâmetros de oscilação secundária
├─ presets/
│  └─ rtfx.md                   <- Transições e pacotes de efeitos .ffx
└─ mmv-workflows.md             <- Metodologia e workflows de sincronização com batidas (beats)
```

---

## Conteúdo Recomendado por Arquivo

Ao criar anotações sobre uma ferramenta ou workflow, tente documentar:

1. **Quando Usar**: Em quais cenários a ferramenta gera o melhor resultado visual.
2. **Parâmetros Recomendados**: Valores numéricos que funcionam bem (ex: frequências de wiggle, opacidades de glow, comprimentos de sway).
3. **Casos de Uso para MMV**: Exemplos práticos em animações de videoclipes (ex: "aplicar sway no cabelo do personagem no beat calmo").
4. **Limitações Conhecidas**: Coisas que causam erro no After Effects ou lentidão de render.
5. **Favoritos Pessoais**: Seus presets prediletos e atalhos preferidos.
6. **Workflows Integrados**: Como combinar a ferramenta com outras (ex: "usar Duik para rigging + AutoSway para a oscilação das pontas").
