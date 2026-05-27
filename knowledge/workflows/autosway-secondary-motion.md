# Workflow: Secondary Motion & Wind Sway (AutoSway)

## Quando Usar
* Para animar movimentos secundários automáticos e orgânicos, como cabelo flutuando, capas, cachecóis, roupas ou correntes em personagens de anime.
* Quando quiser simular vento contínuo ou física de gravidade em partes flexíveis.
* Para economizar tempo de keyframing manual em múltiplos segmentos encadeados.

## Formas Possíveis
1. **Nativa**: Uso da ferramenta de marionete (**Puppet Pin Tool**) e aplicação manual da expressão `wiggle()` ou decaimento senoidal em múltiplos pins vinculados a expressões de atraso (`delay`).
2. **Plugins/Presets**: Uso do script/painel **AutoSway** aplicado a um conjunto de Puppet Pins ou a uma cadeia de camadas vinculadas.
3. **Scripts/Expressões**: Criação de expressões de propagação de atraso com base no índice da camada (ex: `valueAtTime(time - delay)`) para propagar movimento do elemento principal.

## Método Nativo
Para simular ondulação nativamente em um cabelo ou cachecol:
1. Aplique a ferramenta **Puppet Pin Tool** criando de 3 a 5 pins ao longo do cabelo (Pin 1 na raiz, Pin 5 na ponta).
2. Alt+clique na propriedade de posição do Pin 2 e aplique a expressão:
   ```javascript
   delay = 0.05; // 5 centésimos de segundo de atraso
   thisComp.layer(index).effect("Puppet").arap.mesh("Mesh 1").deform("Puppet Pin 1").position.valueAtTime(time - delay);
   ```
3. Repita a expressão para os pins subsequentes, incrementando o multiplicador do atraso (`delay * 2`, `delay * 3`, etc.).
4. Adicione um `wiggle()` suave na posição do Pin 1 (raiz) para servir de motor da oscilação.

## Método com AutoSway
O AutoSway automatiza todo o processo de rigging e atraso de articulações em segundos:
* **Modo Puppet Pin (Recomendado para mídias únicas)**:
  1. Selecione a camada do cabelo/roupa.
  2. Crie Puppet Pins sequenciais do início ao fim do objeto (ex: Pin 1 no ombro da capa, Pin 5 na ponta inferior da capa).
  3. Selecione os Puppet Pins criados **na ordem correta** (do primeiro ao último na linha do tempo).
  4. Abra o painel do **AutoSway**, selecione a opção **Apply** no modo *Puppet*.
  5. O script criará controles na camada e aplicará expressões que interligam os pins com simulação física de vento, gravidade e oscilação.
* **Modo Layer (Para múltiplos objetos parentados)**:
  1. Crie uma cadeia de camadas articuladas (ex: Cadeia de 5 elos de uma corrente parentados: Elo 5 -> Elo 4 -> Elo 3 -> Elo 2 -> Elo 1).
  2. Selecione as camadas do elo mais alto (raiz) ao mais baixo (ponta).
  3. No painel **AutoSway**, clique em **Apply** no modo *Layer*.
  4. Mova o Elo 1 (raiz) e os demais seguirão com uma simulação de balanço atrasado física.

## Método com Scripts/Expressões
O AutoSway utiliza em seu core fórmulas de ondas senoidais encadeadas com decaimento físico e atraso de amostragem temporal. Veja uma variação simplificada de onda aplicada nas posições dos pins encadeados:
```javascript
indexInSway = 2; // Número de ordem do pino
waveFreq = thisComp.layer("Controlador_Sway").effect("Frequencia")("Slider");
waveAmp = thisComp.layer("Controlador_Sway").effect("Amplitude")("Slider");
waveSpeed = time * waveFreq * Math.PI * 2;
waveOffset = indexInSway * thisComp.layer("Controlador_Sway").effect("Atraso")("Slider");
w = Math.sin(waveSpeed - waveOffset) * waveAmp;
value + [w, 0];
```

## Problemas Comuns
* **Ondulação Deformando a Base Fixa**: O cabelo solta da cabeça ou a capa descola do ombro do personagem ao balançar. *Solução*: No painel de efeitos do AutoSway, ajuste o parâmetro de atenuação inicial. Garanta que o primeiro Puppet Pin criado esteja configurado como fixo ou tenha peso/influência menor no movimento.
* **Ondulação Rígida/Sem Vida**: O movimento parece mecânico e duro. *Solução*: Aumente o número de Puppet Pins intermediários instalados e selecione-os em ordem estrita antes de aplicar. No painel de controle do AutoSway, aumente a propriedade **Atraso (Delay)** para dar mais flexibilidade de "mola" ou "chicote".

## Checklist de Diagnóstico
- [ ] Os Puppet Pins foram selecionados de forma sequencial (da raiz à ponta) antes de clicar em Apply?
- [ ] A camada controlada está pré-composta para evitar conflitos de coordenadas de escala e efeitos externos?
- [ ] O controlador do AutoSway gerado possui valores ativos de frequência (`Frequency` > 0) e vento (`Wind` / `Sway`)?

## Sugestões para MMV
* Para clipes rápidos de MMV com muito movimento ou vento (como queda livre ou vôo de personagem), configure o AutoSway com frequência alta (`2.5` a `4.0`) e ative o Motion Blur para dar sensação de velocidade extrema.
* Duplique a camada do cabelo e aplique variações ligeiramente diferentes de sintonização física no AutoSway para dar volume de múltiplas camadas de mechas de cabelo.

## Limitações
* AutoSway consome poder de processamento considerável em composições que possuem dezenas de sways ativos simultaneamente.
* Mudanças bruscas de posição do personagem principal podem fazer com que os pins do sway se desloquem de forma exagerada ou estiquem a malha ("efeito elástico"). Controle a velocidade limitando a escala global.
