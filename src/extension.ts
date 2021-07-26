'use strict';

import {
	commands,
	window,
	workspace,
	WebviewPanel,
	Disposable,
	ExtensionContext,
	ViewColumn,
	Uri,
	WorkspaceEdit,
	QuickPickItem
} from 'vscode';

import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process'
import { XMLBuilder } from './xmlbuilder'

const JS_ELEMENT = "<script type=\"text/javascript\" src=\"script.js\"></script>";
const STYLE_ELEMENT = "<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"style.css\" />";
const IMG_ELEMENT = "<img>";

let panel: WebviewPanel | undefined;



let items: Array<QuickPickItem> = [
	{
		description: "description1",
		detail: "detail1",
		label: "label1"
	},
	{
		description: "description2",
		detail: "detail2",
		label: "label2"
	},
	{
		description: "description3",
		detail: "detail3",
		label: "label3"
	}
];

//* First function to be activated
export function activate(context: ExtensionContext)
{
	let disposable = Disposable.from(
		commands.registerCommand("splineEditor.launch", () => {
			if (panel) {
				window.showErrorMessage("Spline editor already open!");
				panel.reveal();
				return;
			}

			panel = window.createWebviewPanel("splineEditor", "Spline Editor", ViewColumn.Active, {
				enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [
					Uri.file(path.join(context.extensionPath, "resources"))
				]
			});

			var scriptText = fs.readFileSync(path.join(context.extensionPath, "resources", "script.js")).toString("utf8");
			var styleText = fs.readFileSync(path.join(context.extensionPath, "resources", "style.css")).toString("utf8");

			fs.readFile(path.join(context.extensionPath, "resources", "index.html"), (error, content) => {
				var s = content.toString("utf8");
				s = s.replace(JS_ELEMENT, "<script>" + scriptText + "</script>");
				s = s.replace(STYLE_ELEMENT, "<style>" + styleText + "</style>");
				s = s.replace(IMG_ELEMENT, fs.readFileSync(path.join(context.extensionPath, "images", "field.svg")).toString("utf8"));

				if (panel) panel.webview.html = s;
			});
			panel.onDidDispose(() => { panel = undefined; }, undefined, context.subscriptions);
		}),
		commands.registerCommand("splineEditor.export.xml", () => {
			if (!panel) {
				window.showErrorMessage("Must open the spline editor to export!");
				return;
			}
			panel.webview.postMessage({ command: "ping" });
			panel.webview.onDidReceiveMessage((message) => {
				var pointArray: Array<string> = message.points;
				for (var s in pointArray) {
					var result = s.match(/-?\d+(\.\d\d?)?/g);
					if (result) s = result[0];
				}
				var xml = new XMLBuilder();

				for (var i = 0; i < pointArray.length - 6; i += 6) {
					xml.addSpline(
						pointArray[i], pointArray[i + 1],
						pointArray[i + 2], pointArray[i + 3],
						pointArray[i + 4], pointArray[i + 5],
						pointArray[i + 6], pointArray[i + 7]
					);
				}
				workspace.openTextDocument({ language: "xml" }).then(doc => {
					window.showTextDocument(doc);
					let edit = new WorkspaceEdit();

					edit.insert(doc.uri, doc.lineAt(0).range.start, xml.document);
					workspace.applyEdit(edit);
				});
			});
		}),
		commands.registerCommand("splineEditor.export.clipboard", () => {
			if (!panel) {
				window.showErrorMessage("Must open the spline editor to export!");
				return;
			}

			let input = window.createQuickPick<QuickPickItem>();
			input.items = items;
			input.title = "Select Export Format";
			input.show();

			/*panel.webview.postMessage({ command: "ping" });
			panel.webview.onDidReceiveMessage((message) => {

				var orderedPoints = new Array<string>();

				for(var i = 0; i < message.points.length; i += 2)
					orderedPoints.push(message.points[i]);

				for(var i = 1; i < message.points.length; i += 2)
					orderedPoints.push(message.points[i]);

				var data = orderedPoints.join(" ");
				switch (process.platform) {
					case "win32": //Windows copy
						child_process.spawn('clip').stdin.end(data);
						break;
					case "darwin": //OS X copy
						child_process.spawn('pbcopy').stdin.end(data);
						break;
					case "linux": //Linux copy
						child_process.spawn('xclip').stdin.end(data);
						break;
				}

				window.showInformationMessage("Successfully copied to clipboard!", data);
			});*/
		})
	);
	context.subscriptions.push(disposable);
}

export function deactivate()
{

}