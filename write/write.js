import {ProseMirror} from "./prosemirror-dist/edit"
import "./prosemirror-dist/inputrules/autoinput"

let pm = window.pm = new ProseMirror({
	place: document.querySelector("#editor"),
	autoInput: true,
	doc: document.querySelector("#content"),
	docFormat: "dom"
});
