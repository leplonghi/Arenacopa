

## Destaque da Logo no Header

A logo esta com filtros insuficientes para se destacar no fundo escuro. Vou aplicar ajustes mais agressivos:

### Mudancas em `src/components/Layout.tsx` (linha 41-42)

**Container da logo:**
- Adicionar um fundo com leve gradiente verde para criar contraste
- Aumentar o glow verde ao redor (`shadow-copa-green/30`)
- Adicionar `ring` sutil verde para destaque extra

**Imagem da logo:**
- Aumentar `brightness` de 110 para 125 para clarear a imagem
- Aumentar intensidade do `drop-shadow` verde (de 6px/0.4 para 8px/0.6)
- Adicionar `contrast-125` para tornar as cores mais vivas
- Aumentar tamanho para `h-9 w-9`

Resultado: a logo fica visivelmente mais brilhante e contrastada contra o fundo escuro, com um halo verde sutil que reforça a identidade visual.

