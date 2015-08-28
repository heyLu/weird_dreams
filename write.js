import {ProseMirror} from "./prosemirror-dist/edit"

let pm = window.pm = new ProseMirror({
	place: document.querySelector("#editor"),
	doc: document.querySelector("#content"),
	docFormat: "dom"
});
