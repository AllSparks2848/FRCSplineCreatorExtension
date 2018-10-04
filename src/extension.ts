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
	WorkspaceEdit
} from 'vscode';

import * as path from 'path';
import * as fs from 'fs';
import { XMLBuilder } from './xmlbuilder'

const jsElementOriginal = "<script type=\"javascript\" src=\"script.js\"></script>";
const styleElementOriginal = "<link rel=\"stylesheet\" type=\"text/css\" media=\"screen\" href=\"style.css\" />";

let panel: WebviewPanel | undefined;

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
				s = s.replace(jsElementOriginal, "<script>" + scriptText + "</script>");
				s = s.replace(styleElementOriginal, "<style>" + styleText + "</style>");
				
				if (panel) panel.webview.html = s;
			});
			panel.onDidDispose(() => { panel = undefined; }, undefined, context.subscriptions);
		}),
		commands.registerCommand("splineEditor.export.xml", () => {
			if (!panel) {
				window.showErrorMessage("Must open the spline editor to export!");
				return;
			} else{
				panel.webview.postMessage({ command: "ping" });
				panel.webview.onDidReceiveMessage((message) => {
					var pointArray: Array<string> = message.points;
					var xml = new XMLBuilder();
					xml.addSpline(pointArray[0], pointArray[1],
						pointArray[2], pointArray[3],
						pointArray[4], pointArray[5],
						pointArray[6], pointArray[7]);
					workspace.openTextDocument({language: "xml"}).then(doc => {
						window.showTextDocument(doc);
						let edit = new WorkspaceEdit();
							
						edit.insert(doc.uri, doc.lineAt(0).range.start, xml.document);
						workspace.applyEdit(edit);
					});
				});
			}
		})
	);
	context.subscriptions.push(disposable);
}

export function deactivate()
{

}