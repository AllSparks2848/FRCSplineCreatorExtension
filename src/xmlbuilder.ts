'use strict';

export class XMLBuilder
{
	document: string;

	constructor(version = "1.0", encoding = "utf-8")
	{
		this.document = `<?xml version=\"${version}\" encoding=\"${encoding}\"?>\n\n<spline>\n</spline>`;
	}

	private startIndexOf(searchString: string): number
	{
		var index = this.document.indexOf("<" + searchString + ">");
		if (index > 0) return index + searchString.length + 2;
		return -1;
	}

	private endIndexOf(searchString: string): number
	{
		var index = this.document.lastIndexOf("</" + searchString + ">");
		if (index > 0) return index + searchString.length + 3;
		return -1;
	}

	private insert(original: string, inserted: string, index: number): string
	{
		return original.slice(0, index) + inserted + original.slice(index);
	}

	addSpline(x1: string, y1: string, x2: string, y2: string, x3: string, y3: string, x4: string, y4: string): void
	{
		var insertIndex = Math.max(this.startIndexOf("spline"), this.endIndexOf("curve"), 0);
		var splineInfo = `
	<curve>
		<anchor-point>
			<x>${x1}</x>
			<y>${y1}</y>
		</anchor-point>
		<control-point>
			<x>${x2}</x>
			<y>${y2}</y>
		</control-point>
		<control-point>
			<x>${x3}</x>
			<y>${y3}</y>
		</control-point>
		<anchor-point>
			<x>${x4}</x>
			<y>${y4}</y>
		</anchor-point>
	</curve>`;
		this.document = this.insert(this.document, splineInfo, insertIndex);
	}
}
	