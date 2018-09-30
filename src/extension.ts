'use strict';

import {
	ExtensionContext,
	commands,
	window,
	ViewColumn
} from 'vscode';

import * as path from 'path';
import * as fs from 'fs';

const jsElementOriginal = "<script type=\"javascript\" src=\"script.js\"></script>"
const styleElementOriginal = "<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"style.css\" />"

//* First function to be activated
export function activate(context: ExtensionContext) {
	let disposable = commands.registerCommand("splineEditor.launch", () => {
		const panel = window.createWebviewPanel("splineEditor", "Spline Editor", ViewColumn.Active, { enableScripts: true });
		const scriptText = fs.readFileSync(path.join(__dirname, "script.js")).toString("utf8");
		const styleText = fs.readFileSync(path.join(__dirname, "style.css")).toString("utf8");
		fs.readFile(path.join(__dirname, "index.html"), (error, content) => {
			var s = content.toString("utf8");
			s = s.replace(jsElementOriginal, "<script>" + scriptText + "</script>");
			s = s.replace(styleElementOriginal, "<style>" + styleText + "</style>");
			panel.webview.html = s;
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate()
{

}