# Sunny Pets

Site institucional para a Sunny Pets (Uberlândia-MG): banho, tosa, daycare/hotelzinho e estúdio fotográfico para pets.

HTML, CSS e JavaScript puros — sem build step, sem dependências.

## Funcionalidades

- Calculadora de orçamento (porte, tipo de pelo, linha do banho e adicionais) com link direto para o WhatsApp
- Catálogo de estilos de tosa com filtros
- FAQ em acordeão
- Menu com scroll-spy e header dinâmico
- Efeito de revelação ao rolar (`IntersectionObserver`) e parallax sutil no desktop
- Totalmente responsivo, com alvos de toque e imagens otimizadas para mobile

## Rodando localmente

Qualquer servidor estático funciona, por exemplo:

```bash
python3 -m http.server 4191
```

Depois acesse `http://localhost:4191`.

## Estrutura

```
index.html   marcação
style.css    estilos e breakpoints responsivos
script.js    interatividade (calculadora, galeria, FAQ, scroll)
assets/      imagens e fontes
```
