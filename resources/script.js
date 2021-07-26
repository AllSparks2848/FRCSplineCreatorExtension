/**
 * [Offset X]: x-displacement between initial mouse click and selected element
 */
var ox = 0;

/**
 * [Offset Y]: y-displacement between initial mouse click and selected element
 */
var oy = 0;

/**
 * DOM element clicked on by user
 * @type {SVGCircleElement}
 */
var selectedElement;

/**
 * SVG text element displaying currents coordinates of selected element
 * @type {SVGTextElement}
 */
var textElement;

/**
 * First anchor point of spline.
 * @type {SVGCircleElement}
 */
var originElement;

/**
 * Field image behind spline
 * @type {SVGElement}
 */
var background;

/**
 * Screen space (pixels) to real space (feet)
 */
const gridlineSpacing = 40;

/**
 * Used for getTextWidth()
 */
var canvas = document.createElement("canvas"), context = canvas.getContext("2d");

/**
 * Currect background position
 */
var bgX = 500, bgY = -200;

/**
 * Tells if background is moving or not
 */
var bgMoving = false;

/**
 * 
 * @param {MouseEvent} e
 */
function updateBackgroundInit(e)
{
	ox = bgX - e.clientX;
	oy = bgY - e.clientY;
	document.onmousemove = updateBackground;
	document.onmouseup = updateBackgroundPost;
}

/**
 * 
 * @param {MouseEvent} e
 */
function updateBackground(e)
{
	console.log(`translate(${ox + e.clientX} ${oy + e.clientY}) rotate(-90) scale("${gridlineSpacing})`);
	background.querySelector("g").setAttribute("transform", `translate(${ox + e.clientX} ${oy + e.clientY}) rotate(-90) scale(${gridlineSpacing})`);
}

/**
 * 
 * @param {MouseEvent} e
 */
function updateBackgroundPost(e) {
	bgX = ox + e.clientX;
	bgY = oy + e.clientY;
	document.onmousemove =	document.onmouseup = undefined;
}

/**
 * Position SVG text element and set inner text
 * @param {MouseEvent} e
 */
function updateCoords(e)
{
	var x = Math.round((selectedElement.getAttribute("cx") - originElement.getAttribute("cx")) / gridlineSpacing * 100) / 100;
	var y = Math.round(-(selectedElement.getAttribute("cy") - originElement.getAttribute("cy")) / gridlineSpacing * 100) / 100;
	textElement.innerHTML = x + ", " + y;

	var tX = Math.min(e.clientX + 4, document.body.clientWidth - getTextWidth(textElement.innerHTML) - 10);
	var tY = Math.max(e.clientY - 10, 30);
	textElement.setAttribute("x", tX);
	textElement.setAttribute("y", tY);
}

/**
 * Get pixel length for given string of text
 * @param {string} text
 * @returns {number}
 */
function getTextWidth(text)
{
    context.font = "15pt Arial Rounded MT";
    var metrics = context.measureText(text);
    return metrics.width;
}

/**
 * @param {SVGCircleElement} control
 * @returns {SVGCircleElement | null}
 */
function getOppositeControl(control)
{
	var searchString = "#" + control.id;
	if (searchString.endsWith("a"))
		return document.querySelector(searchString.replace("a", "b"));
	else
		return document.querySelector(searchString.replace("b", "a"));
}

/**
 * Returns the anchor element that the given control corresponds to
 * @param {SVGCircleElement} control
 * @returns {SVGCircleElement | null}
 */
function getBelongingAnchor(control)
{
	if (control.id.endsWith("a"))
		return control.nextElementSibling;
	if (control.id.endsWith("b"))
		return control.previousElementSibling;
}

/**
 * Redirects different mouseDown inputs to different functions
 * @param {MouseEvent} e
 */
function mouseDownHandle(e)
{
	if (e.target.classList.contains("movable")) movePointInit(e);
	else if (e.shiftKey) {
		if (e.button == 0) addPoint(e);
		if (e.button == 2) removePoint(e);
	} else updateBackgroundInit(e);
}

/**
 * Redirects different key presses to different functions
 * @param {KeyboardEvent} e
 */

function keyPressHandle(e)
{
	console.log(e.key);
	if (e.key == '-' || e.key == '_') removePoint();
}

/**
 * Called when left mouse button is first pressed
 * @param {MouseEvent} e
 */
function movePointInit(e)
{
	e.preventDefault();
	selectedElement = e.target;
	document.onmousemove = movePoint;
	document.onmouseup = movePointPost;
	ox = e.clientX - selectedElement.getAttribute("cx");
	oy = e.clientY - selectedElement.getAttribute("cy");
	if (selectedElement.classList.contains("anchor")) {
		var index = selectedElement.id.match(/\d+/g);
		var controlA = document.querySelector("#control-" + index + "a");
		if (controlA) {
			controlA.setAttribute("ox", e.clientX - controlA.getAttribute("cx"));
			controlA.setAttribute("oy", e.clientY - controlA.getAttribute("cy"));
		}
		var controlB = document.querySelector("#control-" + index + "b");
		if (controlB) {
			controlB.setAttribute("ox", e.clientX - controlB.getAttribute("cx"));
			controlB.setAttribute("oy", e.clientY - controlB.getAttribute("cy"));
		}
	} else if (selectedElement.classList.contains("control")) {
		var anchor = getBelongingAnchor(selectedElement);
		if (anchor) {
			var x1 = parseFloat(selectedElement.getAttribute("cx"));
			var x2 = parseFloat(anchor.getAttribute("cx"));
			var y1 = parseFloat(selectedElement.getAttribute("cy"));
			var y2 = parseFloat(anchor.getAttribute("cy"));
			selectedElement.setAttribute("a", y1 - y2);
			selectedElement.setAttribute("b", x2 - x1);
			selectedElement.setAttribute("c", x1 * y2 - x2 * y1);
			var opposite = getOppositeControl(selectedElement);
			if (opposite) {
				opposite.setAttribute("px", opposite.getAttribute("cx"));
				opposite.setAttribute("py", opposite.getAttribute("cy"));
				opposite.setAttribute("mag", Math.sqrt(
					Math.pow(opposite.getAttribute("cx") - anchor.getAttribute("cx"), 2) +
					Math.pow(opposite.getAttribute("cy") - anchor.getAttribute("cy"), 2)
				));
			}
		}
	// } else if (selectedElement.id == "origin") {
	// 	var c = document.querySelectorAll(".movable");
	// 	for (var i = 0; i < c.length; i++) {
	// 		c[i].setAttribute("px", c[i].getAttribute("cx"));
	// 		c[i].setAttribute("py", c[i].getAttribute("cy"));
	// 		c[i].setAttribute("ox", e.clientX - c[i].getAttribute("cx"));
	// 		c[i].setAttribute("oy", e.clientY - c[i].getAttribute("cy"));
	// 	}
	}
	textElement.removeAttribute("display");
}

/**
 * Called when mouse is moved while left button is held down
 * @param {MouseEvent} e
 */
function movePoint(e)
{
	selectedElement.setAttribute("cx", e.clientX - ox);
	selectedElement.setAttribute("cy", e.clientY - ox);
	
	if (selectedElement.classList.contains("anchor")) {
		var index = selectedElement.id.match(/\d+/g);
		var controlA = document.querySelector("#control-" + index + "a");
		if (controlA) {
			controlA.setAttribute("cx", e.clientX - controlA.getAttribute("ox"));
			controlA.setAttribute("cy", e.clientY - controlA.getAttribute("oy"));
		}
		var controlB = document.querySelector("#control-" + index + "b");
		if (controlB) {
			controlB.setAttribute("cx", e.clientX - controlB.getAttribute("ox"));
			controlB.setAttribute("cy", e.clientY - controlB.getAttribute("oy"));
		}
	} else if (selectedElement.classList.contains("control")) {
		var anchor = getBelongingAnchor(selectedElement);
		if (anchor) {
			var opposite = getOppositeControl(selectedElement);
			if (e.shiftKey) {
				var a = parseFloat(selectedElement.getAttribute("a"));
				var b = parseFloat(selectedElement.getAttribute("b"));
				var c = parseFloat(selectedElement.getAttribute("c"));

				var x = (b * (b * e.clientX - a * e.clientY) - a * c) / (a * a + b * b);
				var y = (a * (a * e.clientY - b * e.clientX) - b * c) / (a * a + b * b);

				selectedElement.setAttribute("cx", x);
				selectedElement.setAttribute("cy", y);

				if (opposite) {
					opposite.setAttribute("cy", opposite.getAttribute("py"));
					opposite.setAttribute("cx", opposite.getAttribute("px"));
				}
			} else if (opposite) {
				var x = selectedElement.getAttribute("cx") - anchor.getAttribute("cx");
				var y = selectedElement.getAttribute("cy") - anchor.getAttribute("cy");

				var m = -opposite.getAttribute("mag") / Math.sqrt(x * x + y * y);

				x *= m;
				y *= m;

				x += parseFloat(anchor.getAttribute("cx"));
				y += parseFloat(anchor.getAttribute("cy"));

				opposite.setAttribute("cx", x);
				opposite.setAttribute("cy", y);
			}
		}
	// } else if (selectedElement.id == "origin") {
	// 	var c = document.querySelectorAll(".movable");
	// 	if (e.shiftKey) {
	// 		for (var i = 0; i < c.length; i++) {
	// 			if (c[i].id === "origin") continue;
	// 			c[i].setAttribute("cx", c[i].getAttribute("px"));
	// 			c[i].setAttribute("cy", c[i].getAttribute("py"));
	// 		}
	// 	} else {
	// 		for (var i = 0; i < c.length; i++) {
	// 			if (c[i].id === "origin") continue;
	// 			c[i].setAttribute("cx", e.clientX - c[i].getAttribute("ox"));
	// 			c[i].setAttribute("cy", e.clientY - c[i].getAttribute("oy"));
	// 		}
	// 	}
	}
	updatePaths();
	updatePairlines();
	updateGrid();
	updateCoords(e);
}

/**
 * Called when left mouse button is released
 */
function movePointPost()
{
	document.onmousemove = document.onmouseup = selectedElement = undefined;
	textElement.setAttribute("display", "none");
}

/**
 * Adds an anchor point at the cursor's position and any missing control points
 * @param {MouseEvent} e 
 */
function addPoint(e)
{
	var maxIndex = textElement.previousElementSibling.id.match(/\d+/g)[0];
	var prevAnchor = textElement.previousElementSibling;
	var prevControl = prevAnchor.previousElementSibling;

	var controlB = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	controlB.setAttribute("id", "control-" + maxIndex + "b");
	controlB.classList += "movable control";
	controlB.setAttribute("cx", prevAnchor.getAttribute("cx") * 2 - prevControl.getAttribute("cx"));
	controlB.setAttribute("cy", prevAnchor.getAttribute("cy") * 2 - prevControl.getAttribute("cy"));
	controlB.setAttribute("r", 7);
	
	var controlA = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	controlA.setAttribute("id", "control-" + (parseFloat(maxIndex) + 1) + "a");
	controlA.classList += "movable control";
	controlA.setAttribute("cx", (parseFloat(prevAnchor.getAttribute("cx")) + e.clientX) / 2);
	controlA.setAttribute("cy", (parseFloat(prevAnchor.getAttribute("cy")) + e.clientY) / 2);
	controlA.setAttribute("r", 7);

	var anchor = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	anchor.setAttribute("id", "anchor-" + (parseFloat(maxIndex) + 1));
	anchor.classList += "movable anchor";
	anchor.setAttribute("cx", e.clientX);
	anchor.setAttribute("cy", e.clientY);
	anchor.setAttribute("r", 7);

	textElement.insertAdjacentElement("beforebegin", controlB);
	textElement.insertAdjacentElement("beforebegin", controlA);
	textElement.insertAdjacentElement("beforebegin", anchor);

	document.querySelector("#paths").appendChild(document.createElementNS("http://www.w3.org/2000/svg", "path"));
	updatePaths();
	updatePairlines();
}

/**
 * Removes the last anchor point and other unnecessary control points
 * @param {MouseEvent} e
 */
function removePoint(e)
{
	if (document.querySelectorAll(".anchor").length < 3) return;
	for (var i = 0; i < 3; i++)
		textElement.previousElementSibling.remove();
	document.querySelector("path").remove();
	updatePaths();
	updatePairlines();
}

/**
 * Reset entire gridline scheme
 */
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

/**
 * Reposition all gridlines according to location of origin
 */
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

/**
 * Reposition all gridlines according to location of origin
 */
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

function updatePaths()
{
	var paths = document.querySelectorAll("path");
	for (var i = 0; i < document.querySelectorAll(".anchor").length - 1; i++) {
		var c = [
			document.querySelector("#anchor-" + i),
			document.querySelector("#control-" + i + "b"),
			document.querySelector("#control-" + (i + 1) + "a"),
			document.querySelector("#anchor-" + (i + 1))
		];
		var s = "M" + c[0].getAttribute("cx") + " " + c[0].getAttribute("cy");
		s += "C" + c[1].getAttribute("cx") + " " + c[1].getAttribute("cy");
		s += "," + c[2].getAttribute("cx") + " " + c[2].getAttribute("cy");
		s += "," + c[3].getAttribute("cx") + " " + c[3].getAttribute("cy");
		paths[i].setAttribute("d", s);
	}
}

/**
 * Updates the line elements connecting a control to its neighbor anchor
 */
function updatePairlines()
{
	var group = document.querySelector("#pairlines");
	var pairlines = group.children;
	var controls = document.querySelectorAll(".control");
	
	while (pairlines.length < controls.length)
		group.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "line"));

	while (pairlines.length > controls.length)
		pairlines[0].remove();
	
	for (var i = 0; i < controls.length; i++) {
		var anchor = getBelongingAnchor(controls[i]);
		pairlines[i].setAttribute("x1", anchor.getAttribute("cx"));
		pairlines[i].setAttribute("y1", anchor.getAttribute("cy"));
		pairlines[i].setAttribute("x2", controls[i].getAttribute("cx"));
		pairlines[i].setAttribute("y2", controls[i].getAttribute("cy"));
	}
}

window.onload = () =>
{
	textElement = document.querySelector("#coords");
	originElement = document.querySelector("#origin");
	background = document.querySelector("#bg");
	initGridLines();
	updatePairlines();
	background.querySelector("g").setAttribute("transform", `translate(${bgX} ${bgY}) rotate(-90) scale(${gridlineSpacing})`);
}

window.onresize = initGridLines;

/**
 * Utility for sending data outside of webpage
 * @type {any}
 */
const vscode = acquireVsCodeApi();

window.onmessage = () =>
{
	var c = document.querySelectorAll(".movable");
	var pointArray = new Array();
	for (var i = 0; i < c.length; i++) {
		if (c[i].id == "origin") continue;
		pointArray.push((c[i].getAttribute("cx") - originElement.getAttribute("cx")) / gridlineSpacing);
		pointArray.push(-(c[i].getAttribute("cy") - originElement.getAttribute("cy")) / gridlineSpacing);
	}
	vscode.postMessage({ points: pointArray });
}
