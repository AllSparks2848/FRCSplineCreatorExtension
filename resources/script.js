var px, py, ox, oy, selectedElement, textElement, originElement;
const gridlineSpacing = 40;
const vscode = acquireVsCodeApi();

function updateGrid()
{
	var originX = parseInt(originElement.getAttribute("cx")),
		originY = parseInt(originElement.getAttribute("cy"));
	var linesX = document.querySelectorAll("line#x-line");
	var negLines = 1;
	for (var i = 0; i < linesX.length; i++) {
		var pos = originX + gridlineSpacing * i;
		if (pos >= document.body.clientWidth) {
			pos = originX - negLines * gridlineSpacing;
			negLines++;
		}
		linesX[i].setAttribute("x1", pos);
		linesX[i].setAttribute("x2", pos);
	}
	negLines = 1;
	var linesY = document.querySelectorAll("line#y-line");
	for (var i = 0; i < linesY.length; i++) {
		var pos = originY + gridlineSpacing * i;
		if (pos >= document.body.clientHeight) {
			pos = originY - negLines * gridlineSpacing;
			negLines++;
		}
		linesY[i].setAttribute("y1", pos);
		linesY[i].setAttribute("y2", pos);
	}
}

function updateCoords(e)
{
	var x = (selectedElement.getAttribute("cx") - originElement.getAttribute("cx")) / gridlineSpacing;
	var y = -(selectedElement.getAttribute("cy") - originElement.getAttribute("cy")) / gridlineSpacing;
	textElement.setAttribute("x", e.clientX + 4);
	textElement.setAttribute("y", e.clientY - 10);
	textElement.innerHTML = x + ", " + y;
}

function movePointInit(e)
{
	e.preventDefault();
	selectedElement = e.target;
	document.onmousemove = movePoint;
	document.onmouseup = movePointPost;
	px = e.clientX;
	py = e.clientY;
	ox = px - selectedElement.getAttribute("cx");
	oy = py - selectedElement.getAttribute("cy");
}

function movePoint(e)
{
	selectedElement.setAttribute("cx", e.clientX - ox);
	selectedElement.setAttribute("cy", e.clientY - oy);
	px = e.clientX;
	py = e.clientY;
	var c = document.querySelectorAll("circle");
	var s = "M" + c[0].getAttribute("cx") + " " + c[0].getAttribute("cy");
	s += "C" + c[1].getAttribute("cx") + " " + c[1].getAttribute("cy");
	s += "," + c[2].getAttribute("cx") + " " + c[2].getAttribute("cy");
	s += "," + c[3].getAttribute("cx") + " " + c[3].getAttribute("cy");
	var path = document.querySelector("path");
	path.setAttribute("d", s);
	updateGrid();
	updateCoords(e);
}

function movePointPost()
{
	document.onmousemove = document.onmouseup = selectedElement = null;
}

function initGridLines()
{
	var group = document.querySelector("g#gridlines");
	group.innerHTML = "";
	for (var i = 0; i < document.body.clientWidth; i += gridlineSpacing) {
		var child = document.createElementNS("http://www.w3.org/2000/svg", "line");
		child.setAttribute("x1", i);
		child.setAttribute("x2", i);
		child.setAttribute("y1", "0%");
		child.setAttribute("y2", "100%");
		child.id = "x-line";
		if (i == 0) child.classList += "thicc";
		group.appendChild(child);
	}

	for (var i = 0; i < document.body.clientHeight; i += gridlineSpacing) {
		var child = document.createElementNS("http://www.w3.org/2000/svg", "line");
		child.setAttribute("x1", "0%");
		child.setAttribute("x2", "100%");
		child.setAttribute("y1", i);
		child.setAttribute("y2", i);
		child.id = "y-line";
		if (i == 0) child.classList += "thicc";
		group.appendChild(child);
	}
	updateGrid();
}

window.onload = () =>
{
	textElement = document.querySelector("text#coords");
	originElement = document.querySelector("circle#origin")
	initGridLines();
}

window.onresize = initGridLines;

window.onmessage = (e) =>
{
	var c = document.querySelectorAll("circle");
	var pointArray = [];
	for (var i = 0; i < c.length; i++) {
		pointArray.push((c[i].getAttribute("cx") - originElement.getAttribute("cx")) / gridlineSpacing);
		pointArray.push(-(c[i].getAttribute("cy") - originElement.getAttribute("cy")) / gridlineSpacing);
	}
	vscode.postMessage({points: pointArray});
}

