---
layout: post
title:  "Gerando citações Bibtex para um artigo no meu blog"
author: [peterson]
date:   2022-12-08 03:24:00 -0300
description: "Gerando citações Bibtex para um artigo no meu blog"
categories: [latex, jekyll, tutorials]
keywords: [latex, jekyll, tutorials, bibtex, vanilla js, html]
published: true
katex: true
---

Olá leitores, acabei de alterar uma coisas no site e resolvi escrever por que achei bem legal kkkkkkk. A questão é que eu gostaria que meus artigos tivessem um pequeno botão para gerar uma referência bibtex de forma automática, o que parece trivial mas como estou usando Jekyll para gerar meu website estático acabou se tornando um leve problema.

Para começar eu roubei um botão padrão de mim mesmo e usei um ícone do *font awesome*, o botão ficou assim em css e html:

[`post.css`](https://github.com/Joao-Peterson/joao-peterson.github.io/blob/1b53092cab639331922f3b33e55cec5a300cfb42/css/post.css):
```css
:root{
    --post-background: rgb(230, 238, 236);
	--post-text: #5E6E6C;
	--post-href-text: #5AB5A7;
	--post-highlight-text: #95D0C7;
}

...

.meta-button a{
	position: relative;
    display: block;
    width: 30px;
    height: 30px;
    border-bottom: 1px solid var(--banner-font);
    color: var(--banner-font);
	text-align: center;
}

.meta-button a:hover{
	border-bottom: 1px solid var(--post-highlight-text);
	color: var(--post-highlight-text);
}

.meta-button li {
	padding-left: 0.5ex;
	padding-right: 0.5ex;
}

.meta-button ul{
	margin: 0;
	padding: 0;
	display: inline-flex;
	list-style-type: none;
}
```

[`post.html`](https://github.com/Joao-Peterson/joao-peterson.github.io/blob/1b53092cab639331922f3b33e55cec5a300cfb42/_layouts/post.html):
```html
...

<div class="meta-button text-center text-bottom">
	<ul>
		<!-- bibtex cite -->
		<li>
		<a href="#" onclick="copyBibtex()" data-toggle="tooltip" title="Cite as bibtex">
				<i class="fa fa-quote-right"></i>
		</a>
		</li>
		
	</ul>
</div>

...
```

O elemento do botão, quando clicado chama `copyBibtex()`:

[`bibtex.js`](https://github.com/Joao-Peterson/joao-peterson.github.io/blob/1b53092cab639331922f3b33e55cec5a300cfb42/js/bibtex.js)
```javascript
async function copyBibtex(){
	var bib = genbib();
	// console.log(bib);
	await navigator.clipboard.writeText(bib);
	alert(`Bibtex entry copied to clipboard: ${bib}`);
}

...

function genbib(){

var postDate = new Date('2022-12-08T02:43:04.00-03:00');
var date = new Date();

var bib =
`@article{${jekyll.page.authorsShort.join('')}${postDate.getFullYear()},
	author={${jekyll.page.authors.join(' and ')}},
	journal={Peterson's Blog},
	year={${postDate.getFullYear()}}
	title={${jekyll.page.title}},
	url={${jekyll.site.url}},
	urlaccessdate={${date.getDate()} ${month[date.getMonth()]}. ${date.getFullYear()}},
}`;

	return bib;
}
```

Ele copia o conteúdo da referência para a *clipboard* do sistema e exibe um alerta, a referência em si é gerada plea função `genbib()`, note que a mesma possuí o template da referência bibtex para artigo, funciona bem com [abntex2cite](http://linorg.usp.br/CTAN/macros/latex/contrib/abntex2/doc/abntex2cite.pdf), bem como as variáveis do template, mas a questão é como eu acesso os metadados da minha página jekyll dentro do javascript?

A resposta é, gambiarra. As variáveis do jekyll, que são acessadas via liquid, só são acessadas no momento de compilação, ou seja, quando eu termino de escrever um post em markdown, jekyll usa os templates `post.html` e `default.html` para gerar a página estática para aquele post, e o javascript, para acessar essas variáveis não tem como, pois elas já foram substituídas por texto html no momento da compilação da página, fundamentalmente elas não são acessíveis ao javascript. 

A solução foi a seguinte, no momento de gerar o html, eu fiz o liquid jogar essas variáveis dentro do html em uma tag `script`:

[`default.html`](https://github.com/Joao-Peterson/joao-peterson.github.io/blob/1b53092cab639331922f3b33e55cec5a300cfb42/_layouts/default.html):
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1 user-scalable=no">

	{% raw %}{% include meta.html %}

	<link  href= "{{"lite-yt-embed/lite-yt-embed.css" | relative_url }}" rel="stylesheet">
	<script src= "{{"lite-yt-embed/lite-yt-embed.js" | relative_url}}" defer></script>
	<link  href= "{{"bootstrap/css/bootstrap.min.css" | relative_url }}" rel="stylesheet">
	<script src= "{{"jquery/jquery-3.2.1.slim.min.js" | relative_url}}" defer></script>
	<script src= "{{"popperjs/popper.min.js" | relative_url}}" defer></script>
	<script src= "{{"bootstrap/js/bootstrap.bundle.min.js" | relative_url}}" defer></script>
	{% include jekyll_vars.html %}
	<script src= "{{"js/bibtex.js" | relative_url}}" defer></script>
	{% endraw %}
...
```

[`jekyll_vars.html`](https://github.com/Joao-Peterson/joao-peterson.github.io/blob/1b53092cab639331922f3b33e55cec5a300cfb42/_includes/jekyll_vars.html):
```javascript
<script defer>
var jekyll = {
	site: {
		title:              '{{site.title}}',
		time:               '{{site.time}}',
		collections:        '{{site.collections}}',
		data:               '{{site.data}}',
		tags:               '{{site.tags.TAG}}',
		url:                '{{site.url}}',
	},
	page:{
		authors:[
			{% raw %}{% assign sep = false %}
			{% for page-author in page.author %}
			{% assign author = site.authors | where: "short-name", page-author | first %}
				{% if sep == true %}
				,            
				{% else %}
					{% assign sep = true %}
				{% endif %}
					'{{author.name}}'
			{% endfor %}{% endraw %}
		],
		authorsShort:[
			{% raw %}{% assign sep = false %}
			{% for page-author in page.author %}
			{% assign author = site.authors | where: "short-name", page-author | first %}
				{% if sep == true %}
				,            
				{% else %}
					{% assign sep = true %}
				{% endif %}
					'{{author.short-name}}'
			{% endfor %}{% endraw %}
		],
		title:              '{{page.title}}',
		url:                '{{page.url}}',
		date:               '{{page.date}}',
		id:                 '{{page.id}}',
		categories:         '{{page.categories}}',
		collection:         '{{page.collection}}',
		tags:               '{{page.tags}}',
		dir:                '{{page.dir}}',
		name:               '{{page.name}}',
		path:               '{{page.path}}',
	},

...

</script>
```

Ou seja, para cada página gerada, devido ao template `default.html`, a tag `script` será inserida e irá armazenar os valores das variáveis para serem usadas posteriormente no objeto `jekyll`. Após a compilação o post terá a seguinte tag preenchida:

```javascript
<script defer>
var jekyll = {
	site: {
		title:              'Peterson',
		time:               '2022-12-08 03:44:34 -0300',

...

		tags:               '',
		url:                'http://localhost:4000',
	},
	page:{
		authors:[
			'João Peterson'
		],
		authorsShort:[
			'peterson'
		],
		title:              'Gerando citações Bibtex para um artigo no meu blog',
		url:                '/latex/jekyll/tutorials/2022/12/08/citacaobibtex.html',
		date:               '2022-12-08 03:24:00 -0300',
		id:                 '/latex/jekyll/tutorials/2022/12/08/citacaobibtex',
		categories:         'latexjekylltutorials',
		collection:         'posts',
		tags:               '',
		dir:                '',
		name:               '',
		path:               '_posts/2022-12-08-citacaobibtex.md',
	},

...

</script>
```

Note como as variáveis fora substituídas e agora são parte da memória do browser, inclusive o loop feito para fazer um array de autores `authors` e `authorsShort`.

Por isso conseguimos acessar essa variável global na função `genbib()` e os dados requeridos.

Agora todas vez que alguém clica no botão de citação, poderá me citar facilmente.

![]({{"../assets/2022-12-08-03-49-08.png" | relative_url}})