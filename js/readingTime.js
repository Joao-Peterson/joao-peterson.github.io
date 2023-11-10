for(var time of document.getElementsByName("readingTime")){
	const timeTag = time;
	const url = time.id;
	pageReadingTime(url)
	.then((time) => timeTag.textContent = time)
	.catch((e) => {
		console.log(`Error calculating reading time: ${err}`);
		timeTag.textContent = "#";
	})
}

async function pageReadingTime(url){
	return fetch(url)
	.then((res) => res.text())
	.then((res) => {
		var parser = new DOMParser();
		return parser.parseFromString(res, "text/html");
	})
	.then((doc) => {
		const content = doc.getElementById("postContent");
	
		// words, any text except white space
		const words = content.textContent.matchAll(/[^\s]+/g);
		const wordCount = [...words].length;
	
		// average reading time in words / min ~ 238
		// source: https://thereadtime.com
		// source: https://scholarwithin.com/average-reading-speed
		const time = Math.ceil(wordCount / 238);
		return time + " min";
	});
}