for(var views of document.getElementsByName("viewCounter")){
	const view = views;
	const url = view.id;

	const goatUrl = 'https://d85dbedf-c6cc-4624-bcbe-eab483a2be4d.goatcounter.com/counter/' + 
		encodeURIComponent(url) + '.json';

	fetch(goatUrl,{
		method: "GET",
		cache: "default",
		// mode: "no-cors"
	})
	.then((res) => res.json())
	.then((json) => json.count)
	.then((count) => view.textContent = count)
	.catch((err) => {
		console.log(`Error getting post counts: ${err}`);
		view.textContent = "#";
	});
}

// var viewsCounter = document.getElementById('views-counter');

// if(viewsCounter){
// 	fetch(
// 		'https://d85dbedf-c6cc-4624-bcbe-eab483a2be4d.goatcounter.com/counter/' + encodeURIComponent(location.pathname) + '.json',
// 		{
// 			method: "GET"
// 		}
// 	)
// 	.then((res) => res.json())
// 	.then((json) => viewsCounter.textContent = json.count)
// 	.catch((err) => console.log(`Error getting post counts: ${err}`));
// }

// // xmlhttp
// var r = new XMLHttpRequest();

// r.addEventListener('load', function() {
// });

// r.open('GET', 'https://d85dbedf-c6cc-4624-bcbe-eab483a2be4d.goatcounter.com/counter/' + encodeURIComponent(location.pathname) + '.json');
// r.send();

// fetch api

// fetch(
// 	'https://d85dbedf-c6cc-4624-bcbe-eab483a2be4d.goatcounter.com/counter/' + encodeURIComponent(location.pathname) + '.json',
// 	{
// 		method: 'GET',
// 		mode: 'no-cors'
// 	}
// )
// .then(r => {
// 	if(r.ok){
// 		let json = r.json();
// 		document.querySelector('#views-counter').innerText = JSON.parse(json).count;
// 	}
// });
