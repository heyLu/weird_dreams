import {ProseMirror} from "./prosemirror/dist/edit"
import {Span, Pos, style} from "./prosemirror/dist/model"
import {addInputRules, Rule} from "./prosemirror/dist/inputrules/inputrules"
import "./prosemirror/dist/inputrules/autoinput"
import "./prosemirror/dist/convert/to_markdown"

function wrapInline(pm, match, pos, style) {
	let start = pos.shift(-(match[0].length));
	let text = match[0].substring(1, match[0].length - 1);
	let span = Span.text(text, [style]);
	pm.apply(pm.tr.delete(start, pos).insert(start, span));
	pm.setInlineStyle(style);
}

let additionalRules = [
	new Rule("`", /\`\w+(?: \w+)*\`/, (pm, match, pos) => wrapInline(pm, match, pos, style.code)),
	new Rule("*", /\*\w+(?: \w+)*\*/, (pm, match, pos) => wrapInline(pm, match, pos, style.em)),
	new Rule("_", /_\w+(?: \w+)*_/, (pm, match, pos) => wrapInline(pm, match, pos, style.em))
];

function lastIndexOf(str, vals, offset) {
	let idx = -1;
	for (let i = 0; i < vals.length; i++) {
		let newIdx = str.lastIndexOf(vals[i], offset);
		if (idx == -1 || newIdx != -1 && newIdx > idx) {
			idx = newIdx
		}
	}
	return idx
}

function indexOf(str, vals, offset) {
	let idx = -1;
	for (let i = 0; i < vals.length; i++) {
		let newIdx = str.indexOf(vals[i], offset);
		if (idx == -1 || newIdx != -1 && newIdx < idx) {
			idx = newIdx
		}
	}
	return idx
}

let _ = window.ProseMirror = function(options) {
	let pm = new ProseMirror(options);
	addInputRules(pm, additionalRules);
	pm.currentSentence = function() {
		var path = pm.selection.anchor.path;
		var node = pm.doc.path(path);
		var offset = pm.selection.head.offset;
		var start = lastIndexOf(node.textContent, [". ", "? ", "! "], offset);
		var end = indexOf(node.textContent, [". ", "? ", "! "], offset);
		return {
			from: new Pos(path.slice(), start == -1 ? 0 : start + 2),
			to: new Pos(path.slice(), end == -1 ? node.textContent.length : end + 1)
		}
	}
	return pm;
}
