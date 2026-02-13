

## Header Nota 10 - Escudo + Refinamentos

### Problema Atual
O escudo/logo não está aparecendo no header. Apenas o texto "ARENACOPA" é visível. O container `w-10 h-10` pode estar muito pequeno ou a imagem não está carregando corretamente.

### Melhorias Planejadas

**1. Escudo visivel e destacado**
- Aumentar o container e a imagem para `h-12 w-12` para garantir visibilidade
- Adicionar fundo circular branco semi-transparente (`bg-white/90`) para contraste do escudo no dark mode
- Aplicar `rounded-full`, `p-1`, e `shadow-lg shadow-copa-green/20` para dar profundidade

**2. Texto "ARENACOPA" refinado**
- Aumentar para `text-xl` e adicionar leve `drop-shadow` no texto para brilho sutil

**3. Botao de notificacao harmonizado**
- Manter consistente com o novo tamanho do logo

### Arquivo alterado
- `src/components/Layout.tsx` (linhas 40-46): container da logo e estilos da imagem

### Resultado esperado
Escudo visivel com fundo claro circular, texto bold ao lado, tudo equilibrado e profissional no header escuro.
