import {ProseMirror} from "./prosemirror-dist/edit"
import {Span, style} from "./prosemirror-dist/model"
import {addInputRules, Rule} from "./prosemirror-dist/inputrules/inputrules"
import "./prosemirror-dist/inputrules/autoinput"
import "./prosemirror-dist/convert/to_markdown"

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

let pm = window.pm = new ProseMirror({
	place: document.querySelector("#editor"),
	autoInput: true,
	doc: document.querySelector("#content"),
	docFormat: "dom"
});
addInputRules(pm, additionalRules);
