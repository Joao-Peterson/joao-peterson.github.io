var r = new XMLHttpRequest();
r.addEventListener('load', function() {
	document.querySelector('#views-counter').innerText = JSON.parse(this.responseText).count
})
r.open('GET', 'https://d85dbedf-c6cc-4624-bcbe-eab483a2be4d.goatcounter.com/counter/' + encodeURIComponent(location.pathname) + '.json')
r.send()