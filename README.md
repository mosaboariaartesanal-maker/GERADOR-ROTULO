# Gerador de Rótulos — Sabonetes Artesanais

Aplicação web em HTML, CSS e JavaScript, com dados estruturados em JSON e armazenamento local no navegador.

## Como executar
1. Extraia o ZIP para uma pasta.
2. Abra `index.html` no Chrome, Edge ou Firefox.
3. Para gerar PDFs, mantenha conexão com a internet para carregar a biblioteca jsPDF via CDN.

## Recursos
- Cadastro dos campos presentes no rótulo de referência: nome, tipo, descrição, destaque de ingredientes, composição, modo de usar, benefícios, advertências, fabricação, validade, peso, telefone/WhatsApp, Instagram, e-mail, endereço, texto/link para QR Code e marca/fabricante.
- Repositório com busca, ordenação, edição, duplicação e exclusão.
- Seleção individual do sabonete para geração do PDF.
- PDF A4 retrato, rótulos de 60 × 35 mm, com margens e espaçamentos de recorte. A grade atual comporta até 21 rótulos por folha (3 colunas × 7 linhas), com margens de 5 mm e intervalos de 2 mm.
- Escolha de 1, 2, 5 ou 10 folhas.
- Importação e exportação dos cadastros em JSON.

## Observações importantes
- O texto do QR Code/link é armazenado no cadastro, mas o QR Code gráfico não é gerado nesta versão.
- Os dados ficam no `localStorage` do navegador e não sincronizam automaticamente entre computadores. Use exportação JSON para backup.
- A biblioteca jsPDF é carregada por CDN com tentativa alternativa de carregamento; a geração de PDF depende de conexão com a internet.
- O conteúdo é ajustado ao espaço disponível no rótulo. Como 6 × 3,5 cm é um formato pequeno, revise o PDF antes de imprimir para garantir que os textos permaneçam legíveis.
- O exemplo é uma ferramenta de organização e diagramação, não uma validação regulatória. Revise as informações legais e obrigatórias aplicáveis ao seu produto antes de comercializar.
- Na janela de impressão, escolha papel A4, escala de 100% / tamanho real e desative “ajustar à página”.


## Atualização visual
Rótulo refinado com composição em duas colunas, hierarquia de títulos, paleta creme/verde/dourado, ornamentos botânicos e pequenos ícones vetoriais desenhados diretamente no PDF. As dimensões físicas permanecem em 60 × 35 mm.


## Legibilidade aprimorada
As fontes da pré-visualização e do PDF foram ampliadas. A escala acompanha as dimensões escolhidas e os blocos de informação aproveitam melhor o espaço vertical disponível. Para rótulos pequenos com textos muito extensos, recomenda-se usar dimensões maiores para preservar a legibilidade.

## Correção de correspondência entre prévia e PDF
A composição do PDF foi refeita para seguir a mesma estrutura visual da pré-visualização: duas colunas, fundo branco, moldura verde/dourada, título, descrição, destaque, peso, composição, modo de usar, atenção e dados de contato. A geração usa medidas físicas em milímetros e mantém o cálculo automático de rótulos por folha A4.

O QR Code do Instagram é gerado automaticamente com destino fixo `https://www.instagram.com/mosaboaria/`, tanto na prévia quanto no PDF. É necessário acesso à internet para carregar a biblioteca de QR Code na primeira utilização.
