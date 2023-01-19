async function copyBibtex(){
	var bib = genbib();
	// console.log(bib);
	await navigator.clipboard.writeText(bib);
	alert(`Bibtex entry copied to clipboard: ${bib}`);
}

var month = [
	"jan",
	"fev",
	"mar",
	"abr",
	"mai",
	"jun",
	"jul",
	"ago",
	"set",
	"out",
	"nov",
	"dez",
]

function genbib(){

var postDate = new Date('2022-12-08T02:43:04.00-03:00');
var date = new Date();

var bib =
`@article{${jekyll.page.authorsShort.join('')}${postDate.getFullYear()},
	author={${jekyll.page.authors.join(' and ')}},
	journal={Peterson's Blog},
	year={${postDate.getFullYear()}}
	title={${jekyll.page.title}},
	url={${document.URL}},
	urlaccessdate={${date.getDate()} ${month[date.getMonth()]}. ${date.getFullYear()}},
}`;

	return bib;
}