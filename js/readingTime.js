var tempoLeitura = document.getElementById('tempoLeitura');

if(tempoLeitura){
	tempoLeitura.textContent = pageReadingTime() + " min";
}

function pageReadingTime(){
	const content = document.getElementById("postContent");

	// words, any text except white space
	const words = content.textContent.matchAll(/[^\s]+/g);
	const wordCount = [...words].length;

	// average reading time in words / min ~ 238
	// source: https://thereadtime.com
	// source: https://scholarwithin.com/average-reading-speed
	const time = Math.ceil(wordCount / 238);
	return time;
}