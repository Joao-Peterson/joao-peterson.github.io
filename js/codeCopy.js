for(var codeBlock of document.getElementsByClassName("highlighter-rouge")){
	// filter inline code blocks
	if(codeBlock.tagName == "CODE") continue;

	var buttonDiv = document.createElement("div");
	buttonDiv.classList.add("codeCopy");

	var buttonLink = document.createElement("a");

	// filter $ from console commands
	var snippet = codeBlock.textContent;
	snippet = snippet.replace(/^[\$\#\@\&]\s{0,2}/, "");

	// const so we allocate unique memory for each codeBlock
	const snippetUnique = snippet;

	buttonLink.onclick = (ev) => {
		navigator.clipboard.writeText(snippetUnique);
	};
	
	var buttonIcon = document.createElement("span");
	buttonIcon.classList.add("fa", "fa-regular", "fa-copy");

	buttonLink.appendChild(buttonIcon);
	buttonDiv.appendChild(buttonLink);
	codeBlock.appendChild(buttonDiv);
}