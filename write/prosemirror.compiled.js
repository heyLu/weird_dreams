(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertFrom = convertFrom;
exports.convertTo = convertTo;
exports.knownSource = knownSource;
exports.knownTarget = knownTarget;
exports.defineSource = defineSource;
exports.defineTarget = defineTarget;
var from = Object.create(null);
var to = Object.create(null);

function convertFrom(value, format, arg) {
  var converter = from[format];
  if (!converter) throw new Error("Source format " + format + " not defined");
  return converter(value, arg);
}

function convertTo(doc, format, arg) {
  var converter = to[format];
  if (!converter) throw new Error("Target format " + format + " not defined");
  return converter(doc, arg);
}

function knownSource(format) {
  return !!from[format];
}

function knownTarget(format) {
  return !!to[format];
}

function defineSource(format, func) {
  from[format] = func;
}

function defineTarget(format, func) {
  to[format] = func;
}

},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

exports.fromDOM = fromDOM;
exports.fromHTML = fromHTML;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _model = require("../model");

var _convert = require("./convert");

function fromDOM(dom, options) {
  if (!options) options = {};
  var context = new Context(options.topNode || new _model.Node("doc"));
  var start = options.from ? dom.childNodes[options.from] : dom.firstChild;
  var end = options.to != null && dom.childNodes[options.to] || null;
  context.addAll(start, end, true);
  return context.stack[0];
}

(0, _convert.defineSource)("dom", fromDOM);

function fromHTML(html, options) {
  var wrap = options.document.createElement("div");
  wrap.innerHTML = html;
  return fromDOM(wrap, options);
}

(0, _convert.defineSource)("html", fromHTML);

var blockElements = {
  address: true, article: true, aside: true, blockquote: true, canvas: true,
  dd: true, div: true, dl: true, fieldset: true, figcaption: true, figure: true,
  footer: true, form: true, h1: true, h2: true, h3: true, h4: true, h5: true,
  h6: true, header: true, hgroup: true, hr: true, li: true, noscript: true, ol: true,
  output: true, p: true, pre: true, section: true, table: true, tfoot: true, ul: true
};

var Context = (function () {
  function Context(topNode) {
    _classCallCheck(this, Context);

    this.stack = [topNode];
    this.styles = [];
    this.closing = false;
  }

  // FIXME don't export, define proper extension mechanism

  _createClass(Context, [{
    key: "addDOM",
    value: function addDOM(dom) {
      if (dom.nodeType == 3) {
        var value = dom.nodeValue;
        var _top = this.top,
            block = _top.type.block;
        if (/\S/.test(value) || block) {
          value = value.replace(/\s+/g, " ");
          if (/^\s/.test(value) && _top.content.length && /\s$/.test(_top.content[_top.content.length - 1].text)) value = value.slice(1);
          this.insert(_model.Span.text(value, this.styles));
        }
      } else if (dom.nodeType != 1) {
        // Ignore non-text non-element nodes
      } else if (dom.hasAttribute("pm-html")) {
          var type = dom.getAttribute("pm-html");
          if (type == "html_tag") this.insert(new _model.Span("html_tag", { html: dom.innerHTML }, this.styles));else this.insert(new _model.Node("html_block", { html: dom.innerHTML }));
        } else {
          var _name = dom.nodeName.toLowerCase();
          if (_name in tags) {
            tags[_name](dom, this);
          } else {
            this.addAll(dom.firstChild, null);
            if (blockElements.hasOwnProperty(_name) && this.top.type == _model.nodeTypes.paragraph) this.closing = true;
          }
        }
    }
  }, {
    key: "addAll",
    value: function addAll(from, to, sync) {
      var stack = sync && this.stack.slice();
      for (var dom = from; dom != to; dom = dom.nextSibling) {
        this.addDOM(dom);
        if (sync && blockElements.hasOwnProperty(dom.nodeName.toLowerCase())) this.sync(stack);
      }
    }
  }, {
    key: "doClose",
    value: function doClose() {
      if (!this.closing) return;
      var left = this.stack.pop().copy();
      this.top.push(left);
      this.stack.push(left);
      this.closing = false;
    }
  }, {
    key: "insert",
    value: function insert(node) {
      if (this.top.type.contains == node.type.type) {
        this.doClose();
      } else {
        for (var _i = this.stack.length - 1; _i >= 0; _i--) {
          var route = (0, _model.findConnection)(this.stack[_i].type, node.type);
          if (!route) continue;
          if (_i == this.stack.length - 1) this.doClose();else this.stack.length = _i + 1;
          for (var j = 0; j < route.length; j++) {
            var _wrap = new _model.Node(route[j]);
            this.top.push(_wrap);
            this.stack.push(_wrap);
          }
          if (this.styles.length) this.styles = [];
          break;
        }
      }
      this.top.push(node);
    }
  }, {
    key: "enter",
    value: function enter(node) {
      this.insert(node);
      if (this.styles.length) this.styles = [];
      this.stack.push(node);
    }
  }, {
    key: "sync",
    value: function sync(stack) {
      while (this.stack.length > stack.length) this.stack.pop();
      while (!stack[this.stack.length - 1].sameMarkup(stack[this.stack.length - 1])) this.stack.pop();
      while (stack.length > this.stack.length) {
        var add = stack[this.stack.length].copy();
        this.top.push(add);
        this.stack.push(add);
      }
      if (this.styles.length) this.styles = [];
      this.closing = false;
    }
  }, {
    key: "top",
    get: function get() {
      return this.stack[this.stack.length - 1];
    }
  }]);

  return Context;
})();

var tags = Object.create(null);

exports.tags = tags;
function wrap(dom, context, node) {
  context.enter(node);
  context.addAll(dom.firstChild, null, true);
  context.stack.pop();
}

function wrapAs(type) {
  return function (dom, context) {
    return wrap(dom, context, new _model.Node(type));
  };
}

function inline(dom, context, added) {
  var old = context.styles;
  context.styles = _model.style.add(old, added);
  context.addAll(dom.firstChild, null);
  context.styles = old;
}

tags.p = wrapAs("paragraph");

tags.blockquote = wrapAs("blockquote");

var _loop = function _loop() {
  var attrs = { level: i };
  tags["h" + i] = function (dom, context) {
    return wrap(dom, context, new _model.Node("heading", attrs));
  };
};

for (var i = 1; i <= 6; i++) {
  _loop();
}

tags.hr = function (_, context) {
  return context.insert(new _model.Node("horizontal_rule"));
};

tags.pre = function (dom, context) {
  var params = dom.firstChild && /^code$/i.test(dom.firstChild.nodeName) && dom.firstChild.getAttribute("class");
  if (params && /fence/.test(params)) {
    var found = [],
        re = /(?:^|\s)lang-(\S+)/g,
        m = undefined;
    while (m = re.test(params)) found.push(m[1]);
    params = found.join(" ");
  } else {
    params = null;
  }
  context.insert(new _model.Node("code_block", { params: params }, [_model.Span.text(dom.textContent)]));
};

tags.ul = function (dom, context) {
  var cls = dom.getAttribute("class");
  var attrs = { bullet: /bullet_dash/.test(cls) ? "-" : /bullet_plus/.test(cls) ? "+" : "*",
    tight: /\btight\b/.test(dom.getAttribute("class")) };
  wrap(dom, context, new _model.Node("bullet_list", attrs));
};

tags.ol = function (dom, context) {
  var attrs = { order: dom.getAttribute("start") || 1,
    tight: /\btight\b/.test(dom.getAttribute("class")) };
  wrap(dom, context, new _model.Node("ordered_list", attrs));
};

tags.li = wrapAs("list_item");

tags.br = function (dom, context) {
  if (!dom.hasAttribute("pm-force-br")) context.insert(new _model.Span("hard_break", null, context.styles));
};

tags.a = function (dom, context) {
  return inline(dom, context, _model.style.link(dom.getAttribute("href"), dom.getAttribute("title")));
};

tags.b = tags.strong = function (dom, context) {
  return inline(dom, context, _model.style.strong);
};

tags.i = tags.em = function (dom, context) {
  return inline(dom, context, _model.style.em);
};

tags.code = function (dom, context) {
  return inline(dom, context, _model.style.code);
};

tags.img = function (dom, context) {
  var attrs = { src: dom.getAttribute("src"),
    title: dom.getAttribute("title") || null,
    alt: dom.getAttribute("alt") || null };
  context.insert(new _model.Span("image", attrs));
};

},{"../model":27,"./convert":1}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromText = fromText;

var _model = require("../model");

var _convert = require("./convert");

function fromText(text) {
  var blocks = text.trim().split("\n\n");
  var doc = new _model.Node("doc");
  for (var i = 0; i < blocks.length; i++) {
    var para = new _model.Node("paragraph");
    var parts = blocks[i].split("\n");
    for (var j = 0; j < parts.length; j++) {
      if (j) para.push(new _model.Span("hard_break"));
      para.push(_model.Span.text(parts[j]));
    }
    doc.push(para);
  }
  return doc;
}

(0, _convert.defineSource)("text", fromText);

},{"../model":27,"./convert":1}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toDOM = toDOM;
exports.toHTML = toHTML;
exports.renderNodeToDOM = renderNodeToDOM;

var _model = require("../model");

var _convert = require("./convert");

// FIXME un-export, define proper extension mechanism
var render = Object.create(null),
    renderStyle = Object.create(null);

exports.render = render;
exports.renderStyle = renderStyle;
var doc = null;

function toDOM(node, options) {
  doc = options.document;
  return renderNodes(node.content, options);
}

(0, _convert.defineTarget)("dom", toDOM);

function toHTML(node, options) {
  var wrap = options.document.createElement("div");
  wrap.appendChild(toDOM(node, options));
  return wrap.innerHTML;
}

(0, _convert.defineTarget)("html", toHTML);

function renderNodeToDOM(node, options, offset) {
  var dom = renderNode(node, options, offset);
  if (options.renderInlineFlat && node.type.type == "span") {
    dom = wrapInlineFlat(node, dom);
    dom = options.renderInlineFlat(node, dom, offset) || dom;
  }
  return dom;
}

function elt(name) {
  var dom = doc.createElement(name);

  for (var _len = arguments.length, children = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    children[_key - 1] = arguments[_key];
  }

  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    dom.appendChild(typeof child == "string" ? doc.createTextNode(child) : child);
  }
  return dom;
}

function wrap(node, options, type) {
  var dom = elt(type || node.type.name);
  if (node.type.contains != "span") renderNodesInto(node.content, dom, options);else if (options.renderInlineFlat) renderInlineContentFlat(node.content, dom, options);else renderInlineContent(node.content, dom, options);
  return dom;
}

function wrapIn(type) {
  return function (node, options) {
    return wrap(node, options, type);
  };
}

function renderNodes(nodes, options) {
  var frag = doc.createDocumentFragment();
  renderNodesInto(nodes, frag, options);
  return frag;
}

function renderNode(node, options, offset) {
  var dom = render[node.type.name](node, options);
  if (options.onRender) dom = options.onRender(node, dom, offset) || dom;
  return dom;
}

function renderNodesInto(nodes, where, options) {
  for (var i = 0; i < nodes.length; i++) {
    if (options.path) options.path.push(i);
    where.appendChild(renderNode(nodes[i], options, i));
    if (options.path) options.path.pop();
  }
}

function renderInlineContent(nodes, where, options) {
  var top = where;
  var active = [];
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i],
        styles = node.styles;
    var keep = 0;
    for (; keep < Math.min(active.length, styles.length); ++keep) if (!_model.style.same(active[keep], styles[keep])) break;
    while (keep < active.length) {
      active.pop();
      top = top.parentNode;
    }
    while (active.length < styles.length) {
      var add = styles[active.length];
      active.push(add);
      top = top.appendChild(renderStyle[add.type](add));
    }
    top.appendChild(renderNode(node, options, i));
  }
}

function wrapInlineFlat(node, dom) {
  var styles = node.styles;
  for (var i = styles.length - 1; i >= 0; i--) {
    var _wrap = renderStyle[styles[i].type](styles[i]);
    _wrap.appendChild(dom);
    dom = _wrap;
  }
  return dom;
}

function renderInlineContentFlat(nodes, where, options) {
  var offset = 0;
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var dom = wrapInlineFlat(node, renderNode(node, options, i));
    dom = options.renderInlineFlat(node, dom, offset) || dom;
    where.appendChild(dom);
    offset += node.size;
  }
  if (!nodes.length || nodes[nodes.length - 1].type.name == "hard_break") where.appendChild(elt("br")).setAttribute("pm-force-br", "true");
}

// Block nodes

render.blockquote = wrap;

render.code_block = function (node, options) {
  var code = wrap(node, options, "code");
  if (node.attrs.params != null) code.className = "fence " + node.attrs.params.replace(/(^|\s+)/g, "$&lang-");
  return elt("pre", code);
};

render.heading = function (node, options) {
  return wrap(node, options, "h" + node.attrs.level);
};

render.horizontal_rule = function (_node) {
  return elt("hr");
};

render.bullet_list = function (node, options) {
  var dom = wrap(node, options, "ul");
  var bul = node.attrs.bullet;
  dom.setAttribute("class", bul == "+" ? "bullet_plus" : bul == "-" ? "bullet_dash" : "bullet_star");
  if (node.attrs.tight) dom.setAttribute("class", "tight");
  return dom;
};

render.ordered_list = function (node, options) {
  var dom = wrap(node, options, "ol");
  if (node.attrs.order > 1) dom.setAttribute("start", node.attrs.order);
  if (node.attrs.tight) dom.setAttribute("class", "tight");
  return dom;
};

render.list_item = wrapIn("li");

render.paragraph = wrapIn("p");

render.html_block = function (node) {
  var dom = elt("div");
  dom.innerHTML = node.attrs.html;
  dom.setAttribute("pm-html", "html_block");
  return dom;
};

// Inline content

render.text = function (node) {
  return doc.createTextNode(node.text);
};

render.image = function (node) {
  var dom = elt("img");
  dom.setAttribute("src", node.attrs.src);
  if (node.attrs.title) dom.setAttribute("title", node.attrs.title);
  if (node.attrs.alt) dom.setAttribute("alt", node.attrs.alt);
  return dom;
};

render.hard_break = function (_node) {
  return elt("br");
};

render.html_tag = function (node) {
  var dom = elt("span");
  dom.innerHTML = node.attrs.html;
  dom.setAttribute("pm-html", "html_tag");
  return dom;
};

// Inline styles

renderStyle.em = function () {
  return elt("em");
};

renderStyle.strong = function () {
  return elt("strong");
};

renderStyle.code = function () {
  return elt("code");
};

renderStyle.link = function (style) {
  var dom = elt("a");
  dom.setAttribute("href", style.href);
  if (style.title) dom.setAttribute("title", style.title);
  return dom;
};

},{"../model":27,"./convert":1}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

exports.toMarkdown = toMarkdown;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _model = require("../model");

var _convert = require("./convert");

function toMarkdown(doc) {
  var state = new State();
  state.renderNodes(doc.content);
  return state.out;
}

(0, _convert.defineTarget)("markdown", toMarkdown);

function esc(str, startOfLine) {
  str = str.replace(/[`*\\~+\[\]]/g, "\\$&");
  if (startOfLine) str = str.replace(/^[:#-]/, "\\$&");
  return str;
}

function rep(str, n) {
  var out = "";
  for (var i = 0; i < n; i++) {
    out += str;
  }return out;
}

var State = (function () {
  function State() {
    _classCallCheck(this, State);

    this.delim = this.out = "";
    this.closed = false;
    this.inTightList = false;
  }

  _createClass(State, [{
    key: "closeBlock",
    value: function closeBlock(node) {
      this.closed = node;
    }
  }, {
    key: "flushClose",
    value: function flushClose(size) {
      if (this.closed) {
        if (!this.atBlank()) this.out += "\n";
        if (size == null) size = 2;
        if (size > 1) {
          var delimMin = this.delim;
          var trim = /\s+$/.exec(delimMin);
          if (trim) delimMin = delimMin.slice(0, delimMin.length - trim[0].length);
          for (var i = 1; i < size; i++) {
            this.out += delimMin + "\n";
          }
        }
        this.closed = false;
      }
    }
  }, {
    key: "wrapBlock",
    value: function wrapBlock(delim, firstDelim, node, f) {
      var old = this.delim;
      this.write(firstDelim || delim);
      this.delim += delim;
      f();
      this.delim = old;
      this.closeBlock(node);
    }
  }, {
    key: "atBlank",
    value: function atBlank() {
      return (/(^|\n)$/.test(this.out)
      );
    }
  }, {
    key: "write",
    value: function write(add) {
      this.flushClose();
      if (this.delim && this.atBlank()) this.out += this.delim;
      if (add) this.out += add;
    }
  }, {
    key: "text",
    value: function text(_text, escape) {
      var lines = _text.split("\n");
      for (var i = 0; i < lines.length; i++) {
        var startOfLine = this.atBlank() || this.closed;
        this.write();
        this.out += escape !== false ? esc(lines[i], startOfLine) : lines[i];
        if (i != lines.length - 1) this.out += "\n";
      }
    }
  }, {
    key: "ensureNewLine",
    value: function ensureNewLine() {
      if (!this.atBlank()) this.out += "\n";
    }
  }, {
    key: "render",
    value: (function (_render) {
      function render(_x) {
        return _render.apply(this, arguments);
      }

      render.toString = function () {
        return _render.toString();
      };

      return render;
    })(function (node) {
      render[node.type.name](this, node);
    })
  }, {
    key: "renderNodes",
    value: function renderNodes(nodes) {
      for (var i = 0; i < nodes.length; i++) {
        this.render(nodes[i]);
      }
    }
  }, {
    key: "renderInline",
    value: function renderInline(nodes) {
      var stack = [];
      for (var i = 0; i <= nodes.length; i++) {
        var node = nodes[i];
        var styles = node ? node.styles.slice() : [];
        if (stack.length && stack[stack.length - 1].type == "code" && (!styles.length || styles[styles.length - 1].type != "code")) {
          this.text("`", false);
          stack.pop();
        }
        for (var j = 0; j < stack.length; j++) {
          var cur = stack[j],
              found = false;
          for (var k = 0; k < styles.length; k++) {
            if (_model.style.same(stack[j], styles[k])) {
              styles.splice(k, 1);
              found = true;
              break;
            }
          }
          if (!found) {
            var closer = close_style[cur.type];
            this.text(typeof closer != "string" ? closer(cur) : closer, false);
            stack.splice(j--, 1);
          }
        }
        for (var j = 0; j < styles.length; j++) {
          var cur = styles[j];
          stack.push(cur);
          this.text(open_style[cur.type], false);
        }
        if (node) this.render(node);
      }
    }
  }, {
    key: "renderList",
    value: function renderList(node, delim, firstDelim) {
      var _this = this;

      if (this.closed && this.closed.type == node.type) this.flushClose(3);else if (this.inTightList) this.flushClose(1);

      var prevTight = this.inTightList;
      this.inTightList = node.attrs.tight;

      var _loop = function _loop(i) {
        if (i && node.attrs.tight) _this.flushClose(1);
        var item = node.content[i];
        _this.wrapBlock(delim, firstDelim(i), node, function () {
          return _this.render(item);
        });
      };

      for (var i = 0; i < node.content.length; i++) {
        _loop(i);
      }
      this.inTightList = prevTight;
    }
  }]);

  return State;
})();

var render = Object.create(null);

render.blockquote = function (state, node) {
  state.wrapBlock("> ", null, node, function () {
    return state.renderNodes(node.content);
  });
};

render.code_block = function (state, node) {
  if (node.attrs.params == null) {
    state.wrapBlock("    ", null, node, function () {
      return state.text(node.textContent, false);
    });
  } else {
    state.write("```" + node.attrs.params + "\n");
    state.text(node.textContent, false);
    state.ensureNewLine();
    state.write("```");
    state.closeBlock(node);
  }
};

render.heading = function (state, node) {
  state.write(rep("#", node.attrs.level) + " ");
  state.renderInline(node.content);
  state.closeBlock(node);
};

render.horizontal_rule = function (state, node) {
  state.write(node.attrs.markup || "---");
  state.closeBlock(node);
};

render.bullet_list = function (state, node) {
  state.renderList(node, "  ", function () {
    return node.attrs.bullet + " ";
  });
};

render.ordered_list = function (state, node) {
  var start = Number(node.attrs.order || 1);
  var maxW = String(start + node.content.length - 1).length;
  var space = rep(" ", maxW + 2);
  state.renderList(node, space, function (i) {
    var nStr = String(start + i);
    return rep(" ", maxW - nStr.length) + nStr + ". ";
  });
};

render.list_item = function (state, node) {
  return state.renderNodes(node.content);
};

render.html_block = function (state, node) {
  state.text(node.attrs.html, false);
  state.closeBlock(node);
};

render.paragraph = function (state, node) {
  state.renderInline(node.content);
  state.closeBlock(node);
};

// Inline nodes

render.image = function (state, node) {
  state.write("![" + esc(node.attrs.alt || "") + "](" + esc(node.attrs.src) + (node.attrs.title ? " " + esc(node.attrs.title) : "") + ")");
};

render.hard_break = function (state) {
  return state.write("\\\n");
};

render.text = function (state, node) {
  return state.text(node.text);
};

render.html_tag = function (state, node) {
  return state.text(node.attrs.html);
};

// Styles

function closeLink(style) {
  return "](" + esc(style.href) + (style.title ? " " + esc(style.title) : "") + ")";
}

var open_style = { link: "[", strong: "**", em: "*", code: "`" };
var close_style = { link: closeLink, strong: "**", em: "*", code: "`" };

},{"../model":27,"./convert":1}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toText = toText;

var _model = require("../model");

var _convert = require("./convert");

function toText(doc) {
  var out = "";
  function explore(node) {
    if (node.type.block) {
      var text = "";
      for (var i = 0; i < node.content.length; i++) {
        var child = node.content[i];
        if (child.type == _model.nodeTypes.text) text += child.text;else if (child.type == _model.nodeTypes.hard_break) text += "\n";
      }
      if (text) out += (out ? "\n\n" : "") + text;
    } else {
      node.content.forEach(explore);
    }
  }
  explore(doc);
  return out;
}

(0, _convert.defineTarget)("text", toText);

},{"../model":27,"./convert":1}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.elt = elt;
exports.requestAnimationFrame = requestAnimationFrame;
exports.rmClass = rmClass;
exports.addClass = addClass;
exports.contains = contains;

function elt(tag, attrs) {
  var result = document.createElement(tag);
  if (attrs) for (var _name in attrs) {
    if (_name == "style") result.style.cssText = attrs[_name];else if (attrs[_name] != null) result.setAttribute(_name, attrs[_name]);
  }

  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  for (var i = 0; i < args.length; i++) {
    add(args[i], result);
  }return result;
}

function add(value, target) {
  if (typeof value == "string") value = document.createTextNode(value);
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i++) {
      add(value[i], target);
    }
  } else {
    target.appendChild(value);
  }
}

var reqFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

function requestAnimationFrame(f) {
  if (reqFrame) reqFrame(f);else setTimeout(f, 10);
}

var ie_upto10 = /MSIE \d/.test(navigator.userAgent);
var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent);

var browser = {
  mac: /Mac/.test(navigator.platform),
  ie_upto10: ie_upto10,
  ie_11up: ie_11up,
  ie: ie_upto10 || ie_11up,
  gecko: /gecko\/\d/i.test(navigator.userAgent)
};

exports.browser = browser;
function classTest(cls) {
  return new RegExp("(^|\\s)" + cls + "(?:$|\\s)\\s*");
}

function rmClass(node, cls) {
  var current = node.className;
  var match = classTest(cls).exec(current);
  if (match) {
    var after = current.slice(match.index + match[0].length);
    node.className = current.slice(0, match.index) + (after ? match[1] + after : "");
  }
}

function addClass(node, cls) {
  var current = node.className;
  if (!classTest(cls).test(current)) node.className += (current ? " " : "") + cls;
}

function contains(parent, child) {
  // Android browser and IE will return false if child is a text node.
  if (child.nodeType != 1) child = child.parentNode;
  return child && parent.contains(child);
}

},{}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isWordChar = isWordChar;
exports.charCategory = charCategory;
var nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;

function isWordChar(ch) {
  return (/\w/.test(ch) || ch > "\x80" && (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch))
  );
}

function charCategory(ch) {
  return (/\s/.test(ch) ? "space" : isWordChar(ch) ? "word" : "other"
  );
}

},{}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerCommand = registerCommand;
exports.execCommand = execCommand;

var _model = require("../model");

var _transform = require("../transform");

var _char = require("./char");

var commands = Object.create(null);

function registerCommand(name, func) {
  commands[name] = func;
}

function execCommand(pm, name) {
  var ext = pm.input.commandExtensions[name];
  if (ext && ext.high) for (var i = 0; i < ext.high.length; i++) {
    if (ext.high[i](pm) !== false) return true;
  }if (ext && ext.normal) for (var i = 0; i < ext.normal.length; i++) {
    if (ext.normal[i](pm) !== false) return true;
  }var base = commands[name];
  if (base && base(pm) !== false) return true;
  if (ext && ext.low) for (var i = 0; i < ext.low.length; i++) {
    if (ext.low[i](pm) !== false) return true;
  }return false;
}

function clearSel(pm) {
  var sel = pm.selection,
      tr = pm.tr;
  if (!sel.empty) tr["delete"](sel.from, sel.to);
  return tr;
}

commands.insertHardBreak = function (pm) {
  pm.scrollIntoView();
  var tr = clearSel(pm),
      pos = pm.selection.from;
  if (pm.doc.path(pos.path).type == _model.nodeTypes.code_block) tr.insertText(pos, "\n");else tr.insert(pos, new _model.Span("hard_break"));
  return pm.apply(tr);
};

commands.setStrong = function (pm) {
  return pm.setInlineStyle(_model.style.strong, true);
};
commands.unsetStrong = function (pm) {
  return pm.setInlineStyle(_model.style.strong, false);
};
commands.toggleStrong = function (pm) {
  return pm.setInlineStyle(_model.style.strong, null);
};

commands.setEm = function (pm) {
  return pm.setInlineStyle(_model.style.em, true);
};
commands.unsetEm = function (pm) {
  return pm.setInlineStyle(_model.style.em, false);
};
commands.toggleEm = function (pm) {
  return pm.setInlineStyle(_model.style.em, null);
};

commands.setCode = function (pm) {
  return pm.setInlineStyle(_model.style.code, true);
};
commands.unsetCode = function (pm) {
  return pm.setInlineStyle(_model.style.code, false);
};
commands.toggleCode = function (pm) {
  return pm.setInlineStyle(_model.style.code, null);
};

function blockBefore(pos) {
  for (var i = pos.path.length - 1; i >= 0; i--) {
    var offset = pos.path[i] - 1;
    if (offset >= 0) return new _model.Pos(pos.path.slice(0, i), offset);
  }
}

function delBlockBackward(pm, tr, pos) {
  if (pos.depth == 1) {
    // Top level block, join with block above
    var iBefore = _model.Pos.before(pm.doc, new _model.Pos([], pos.path[0]));
    var bBefore = blockBefore(pos);
    if (iBefore && bBefore) {
      if (iBefore.cmp(bBefore) > 0) bBefore = null;else iBefore = null;
    }
    if (iBefore) {
      tr["delete"](iBefore, pos);
      var joinable = (0, _transform.joinPoint)(tr.doc, tr.map(pos).pos, 1);
      if (joinable) tr.join(joinable);
    } else if (bBefore) {
      tr["delete"](bBefore, bBefore.shift(1));
    }
  } else {
    var last = pos.depth - 1;
    var _parent = pm.doc.path(pos.path.slice(0, last));
    var offset = pos.path[last];
    // Top of list item below other list item
    // Join with the one above
    if (_parent.type == _model.nodeTypes.list_item && offset == 0 && pos.path[last - 1] > 0) {
      tr.join((0, _transform.joinPoint)(pm.doc, pos));
      // Any other nested block, lift up
    } else {
        tr.lift(pos, pos);
        var next = pos.depth - 2;
        // Split list item when we backspace back into it
        if (next > 0 && offset > 0 && pm.doc.path(pos.path.slice(0, next)).type == _model.nodeTypes.list_item) tr.split(new _model.Pos(pos.path.slice(0, next), pos.path[next] + 1));
      }
  }
}

function moveBackward(parent, offset, by) {
  if (by == "char") return offset - 1;
  if (by == "word") {
    var _spanAtOrBefore = (0, _model.spanAtOrBefore)(parent, offset);

    var nodeOffset = _spanAtOrBefore.offset;
    var innerOffset = _spanAtOrBefore.innerOffset;

    var cat = null,
        counted = 0;
    for (; nodeOffset >= 0; nodeOffset--, innerOffset = null) {
      var child = parent.content[nodeOffset],
          size = child.size;
      if (child.type != _model.nodeTypes.text) return cat ? offset : offset - 1;

      for (var i = innerOffset == null ? size : innerOffset; i > 0; i--) {
        var nextCharCat = (0, _char.charCategory)(child.text.charAt(i - 1));
        if (cat == null || counted == 1 && cat == "space") cat = nextCharCat;else if (cat != nextCharCat) return offset;
        offset--;
        counted++;
      }
    }
    return offset;
  }
  throw new Error("Unknown motion unit: " + by);
}

function delBackward(pm, by) {
  pm.scrollIntoView();

  var tr = pm.tr,
      sel = pm.selection,
      from = sel.from;
  if (!sel.empty) tr["delete"](from, sel.to);else if (from.offset == 0) delBlockBackward(pm, tr, from);else tr["delete"](new _model.Pos(from.path, moveBackward(pm.doc.path(from.path), from.offset, by)), from);
  return pm.apply(tr);
}

commands.delBackward = function (pm) {
  return delBackward(pm, "char");
};

commands.delWordBackward = function (pm) {
  return delBackward(pm, "word");
};

function blockAfter(doc, pos) {
  var path = pos.path;
  while (path.length > 0) {
    var end = path.length - 1;
    var offset = path[end] + 1;
    path = path.slice(0, end);
    var node = doc.path(path);
    if (offset < node.content.length) return new _model.Pos(path, offset);
  }
}

function delBlockForward(pm, tr, pos) {
  var lst = pos.depth - 1;
  var iAfter = _model.Pos.after(pm.doc, new _model.Pos(pos.path.slice(0, lst), pos.path[lst] + 1));
  var bAfter = blockAfter(pm.doc, pos);
  if (iAfter && bAfter) {
    if (iAfter.cmp(bAfter.shift(1)) < 0) bAfter = null;else iAfter = null;
  }

  if (iAfter) {
    tr["delete"](pos, iAfter);
    var joinable = (0, _transform.joinPoint)(tr.doc, tr.map(pos).pos, 1);
    if (joinable) tr.join(joinable);
  } else if (bAfter) {
    tr["delete"](bAfter, bAfter.shift(1));
  }
}

function moveForward(parent, offset, by) {
  if (by == "char") return offset + 1;
  if (by == "word") {
    var _spanAtOrBefore2 = (0, _model.spanAtOrBefore)(parent, offset);

    var nodeOffset = _spanAtOrBefore2.offset;
    var innerOffset = _spanAtOrBefore2.innerOffset;

    var cat = null,
        counted = 0;
    for (; nodeOffset < parent.content.length; nodeOffset++, innerOffset = 0) {
      var child = parent.content[nodeOffset],
          size = child.size;
      if (child.type != _model.nodeTypes.text) return cat ? offset : offset + 1;

      for (var i = innerOffset; i < size; i++) {
        var nextCharCat = (0, _char.charCategory)(child.text.charAt(i));
        if (cat == null || counted == 1 && cat == "space") cat = nextCharCat;else if (cat != nextCharCat) return offset;
        offset++;
        counted++;
      }
    }
    return offset;
  }
  throw new Error("Unknown motion unit: " + by);
}

function delForward(pm, by) {
  pm.scrollIntoView();
  var tr = pm.tr,
      sel = pm.selection,
      from = sel.from;
  if (!sel.empty) {
    tr["delete"](from, sel.to);
  } else {
    var _parent2 = pm.doc.path(from.path);
    if (from.offset == _parent2.size) delBlockForward(pm, tr, from);else tr["delete"](from, new _model.Pos(from.path, moveForward(_parent2, from.offset, by)));
  }
  return pm.apply(tr);
}

commands.delForward = function (pm) {
  return delForward(pm, "char");
};

commands.delWordForward = function (pm) {
  return delForward(pm, "word");
};

function scrollAnd(pm, value) {
  pm.scrollIntoView();
  return value;
}

commands.undo = function (pm) {
  return scrollAnd(pm, pm.history.undo());
};
commands.redo = function (pm) {
  return scrollAnd(pm, pm.history.redo());
};

commands.join = function (pm) {
  var point = (0, _transform.joinPoint)(pm.doc, pm.selection.head);
  if (!point) return false;
  return pm.apply(pm.tr.join(point));
};

commands.lift = function (pm) {
  var sel = pm.selection;
  var result = pm.apply(pm.tr.lift(sel.from, sel.to));
  if (result !== false) pm.scrollIntoView();
  return result;
};

function wrap(pm, type) {
  var sel = pm.selection;
  pm.scrollIntoView();
  return pm.apply(pm.tr.wrap(sel.from, sel.to, new _model.Node(type)));
}

commands.wrapBulletList = function (pm) {
  return wrap(pm, "bullet_list");
};
commands.wrapOrderedList = function (pm) {
  return wrap(pm, "ordered_list");
};
commands.wrapBlockquote = function (pm) {
  return wrap(pm, "blockquote");
};

commands.endBlock = function (pm) {
  pm.scrollIntoView();
  var pos = pm.selection.from;
  var tr = clearSel(pm);
  var block = pm.doc.path(pos.path);
  if (pos.depth > 1 && block.content.length == 0 && tr.lift(pos).steps.length) {
    // Lift
  } else if (block.type == _model.nodeTypes.code_block && pos.offset < block.size) {
      tr.insertText(pos, "\n");
    } else {
      var end = pos.depth - 1;
      var isList = end > 0 && pos.path[end] == 0 && pm.doc.path(pos.path.slice(0, end)).type == _model.nodeTypes.list_item;
      var type = pos.offset == block.size ? new _model.Node("paragraph") : null;
      tr.split(pos, isList ? 2 : 1, type);
    }
  return pm.apply(tr);
};

function setType(pm, type, attrs) {
  var sel = pm.selection;
  pm.scrollIntoView();
  return pm.apply(pm.tr.setBlockType(sel.from, sel.to, new _model.Node(type, attrs)));
}

commands.makeH1 = function (pm) {
  return setType(pm, "heading", { level: 1 });
};
commands.makeH2 = function (pm) {
  return setType(pm, "heading", { level: 2 });
};
commands.makeH3 = function (pm) {
  return setType(pm, "heading", { level: 3 });
};
commands.makeH4 = function (pm) {
  return setType(pm, "heading", { level: 4 });
};
commands.makeH5 = function (pm) {
  return setType(pm, "heading", { level: 5 });
};
commands.makeH6 = function (pm) {
  return setType(pm, "heading", { level: 6 });
};

commands.makeParagraph = function (pm) {
  return setType(pm, "paragraph");
};
commands.makeCodeBlock = function (pm) {
  return setType(pm, "code_block");
};

function insertOpaqueBlock(pm, type, attrs) {
  type = _model.nodeTypes[type];
  pm.scrollIntoView();
  var pos = pm.selection.from;
  var tr = clearSel(pm);
  var parent = tr.doc.path(pos.path);
  if (parent.type.type != type.type) return false;
  var off = 0;
  if (pos.offset) {
    tr.split(pos);
    off = 1;
  }
  return pm.apply(tr.insert(pos.shorten(null, off), new _model.Node(type, attrs)));
}

commands.insertRule = function (pm) {
  return insertOpaqueBlock(pm, "horizontal_rule");
};

},{"../model":27,"../transform":34,"./char":8}],10:[function(require,module,exports){
"use strict";

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { "default": obj };
}

var _insertCss = require("insert-css");

var _insertCss2 = _interopRequireDefault(_insertCss);

/*insertCSS(`

.ProseMirror {
  border: 1px solid silver;
  position: relative;
}

.ProseMirror-content {
  padding: 4px 8px 4px 14px;
  white-space: pre-wrap;
  line-height: 1.2;
}

.ProseMirror-content ul.tight p, .ProseMirror-content ol.tight p {
  margin: 0;
}

.ProseMirror-content ul, .ProseMirror-content ol {
  padding-left: 2em;
}

.ProseMirror-content blockquote {
  padding-left: 1em;
  border-left: 3px solid #eee;
  margin-left: 0; margin-right: 0;
}

.ProseMirror-content pre {
  white-space: pre-wrap;
}

.ProseMirror-content p:first-child,
.ProseMirror-content h1:first-child,
.ProseMirror-content h2:first-child,
.ProseMirror-content h3:first-child,
.ProseMirror-content h4:first-child,
.ProseMirror-content h5:first-child,
.ProseMirror-content h6:first-child {
  margin-top: .3em;
}

`)*/

},{"insert-css":43}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ref;

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }return obj;
}

var _keys = require("./keys");

var _dom = require("../dom");

var mod = _dom.browser.mac ? "Cmd-" : "Ctrl-";

var defaultKeymap = new _keys.Keymap((_ref = {
  "Enter": "endBlock"
}, _defineProperty(_ref, mod + "Enter", "insertHardBreak"), _defineProperty(_ref, "Shift-Enter", "insertHardBreak"), _defineProperty(_ref, "Backspace", "delBackward"), _defineProperty(_ref, "Delete", "delForward"), _defineProperty(_ref, mod + "B", "toggleStrong"), _defineProperty(_ref, mod + "I", "toggleEm"), _defineProperty(_ref, mod + "`", "toggleCode"), _defineProperty(_ref, mod + "Backspace", "delWordBackward"), _defineProperty(_ref, mod + "Delete", "delWordForward"), _defineProperty(_ref, mod + "Z", "undo"), _defineProperty(_ref, mod + "Y", "redo"), _defineProperty(_ref, "Shift-" + mod + "Z", "redo"), _defineProperty(_ref, "Alt-Up", "join"), _defineProperty(_ref, "Alt-Left", "lift"), _defineProperty(_ref, "Alt-Right '*'", "wrapBulletList"), _defineProperty(_ref, "Alt-Right '1'", "wrapOrderedList"), _defineProperty(_ref, "Alt-Right '>'", "wrapBlockquote"), _defineProperty(_ref, mod + "H '1'", "makeH1"), _defineProperty(_ref, mod + "H '2'", "makeH2"), _defineProperty(_ref, mod + "H '3'", "makeH3"), _defineProperty(_ref, mod + "H '4'", "makeH4"), _defineProperty(_ref, mod + "H '5'", "makeH5"), _defineProperty(_ref, mod + "H '6'", "makeH6"), _defineProperty(_ref, mod + "P", "makeParagraph"), _defineProperty(_ref, mod + "\\", "makeCodeBlock"), _defineProperty(_ref, mod + "Space", "insertRule"), _ref));

exports.defaultKeymap = defaultKeymap;
function add(key, val) {
  defaultKeymap.addBinding(key, val);
}

if (_dom.browser.mac) {
  add("Ctrl-D", "delForward");
  add("Ctrl-H", "delBackward");
  add("Ctrl-Alt-Backspace", "delWordForward");
  add("Alt-D", "delWordForward");
  add("Alt-Delete", "delWordForward");
  add("Alt-Backspace", "delWordBackward");
}

},{"../dom":7,"./keys":18}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyDOMChange = applyDOMChange;
exports.textContext = textContext;
exports.textInContext = textInContext;

var _model = require("../model");

var _convertFrom_dom = require("../convert/from_dom");

var _transformTree = require("../transform/tree");

var _selection = require("./selection");

function isAtEnd(node, pos, depth) {
  for (var i = depth || 0; i < pos.path.length; i++) {
    var n = pos.path[depth];
    if (n < node.content.length - 1) return false;
    node = node.content[n];
  }
  return pos.offset == node.maxOffset;
}
function isAtStart(pos, depth) {
  if (pos.offset > 0) return false;
  for (var i = depth || 0; i < pos.path.length; i++) {
    if (pos.path[depth] > 0) return false;
  }return true;
}

function parseNearSelection(pm) {
  var dom = pm.content,
      node = pm.doc;
  var from = pm.selection.from,
      to = pm.selection.to;
  for (var depth = 0;; depth++) {
    var toNode = node.content[to.path[depth]];
    var fromStart = isAtStart(from, depth + 1);
    var toEnd = isAtEnd(toNode, to, depth + 1);
    if (fromStart || toEnd || from.path[depth] != to.path[depth] || toNode.type.block) {
      var startOffset = depth == from.depth ? from.offset : from.path[depth];
      if (fromStart && startOffset > 0) startOffset--;
      var endOffset = depth == to.depth ? to.offset : to.path[depth] + 1;
      if (toEnd && endOffset < node.content.length - 1) endOffset++;
      var parsed = (0, _convertFrom_dom.fromDOM)(dom, { topNode: node.copy(), from: startOffset, to: dom.childNodes.length - (node.content.length - endOffset) });
      parsed.content = node.content.slice(0, startOffset).concat(parsed.content).concat(node.content.slice(endOffset));
      for (var i = depth - 1; i >= 0; i--) {
        var wrap = pm.doc.path(from.path.slice(0, i));
        var copy = wrap.copy(wrap.content.slice());
        copy.content[from.path[i]] = parsed;
        parsed = copy;
      }
      return parsed;
    }
    node = toNode;
    dom = (0, _selection.findByPath)(dom, from.path[depth], false);
  }
}

function applyDOMChange(pm) {
  var updated = parseNearSelection(pm);
  var changeStart = (0, _model.findDiffStart)(pm.doc, updated);
  if (changeStart) {
    var changeEnd = findDiffEndConstrained(pm.doc, updated, changeStart);
    pm.apply(pm.tr.replace(changeStart.a, changeEnd.a, updated, changeStart.b, changeEnd.b));
    pm.operation.fullRedraw = true;
    return true;
  } else {
    return false;
  }
}

function offsetBy(first, second, pos) {
  var same = (0, _transformTree.samePathDepth)(first, second);
  var firstEnd = same == first.depth,
      secondEnd = same == second.depth;
  var off = (secondEnd ? second.offset : second.path[same]) - (firstEnd ? first.offset : first.path[same]);
  var shorter = firstEnd ? pos.shift(off) : pos.shorten(same, off);
  if (secondEnd) return shorter;else return shorter.extend(new _model.Pos(second.path.slice(same), second.offset));
}

function findDiffEndConstrained(a, b, start) {
  var end = (0, _model.findDiffEnd)(a, b);
  if (!end) return end;
  if (end.a.cmp(start.a) < 0) return { a: start.a, b: offsetBy(end.a, start.a, end.b) };
  if (end.b.cmp(start.b) < 0) return { a: offsetBy(end.b, start.b, end.a), b: start.b };
  return end;
}

// Text-only queries for composition events

function textContext(data) {
  var range = getSelection().getRangeAt(0);
  var start = range.startContainer,
      end = range.endContainer;
  if (start == end && start.nodeType == 3) {
    var value = start.nodeValue,
        lead = range.startOffset,
        _end = range.endOffset;
    if (data && _end >= data.length && value.slice(_end - data.length, _end) == data) lead = _end - data.length;
    return { inside: start, lead: lead, trail: value.length - _end };
  }

  var sizeBefore = null,
      sizeAfter = null;
  var before = start.childNodes[range.startOffset - 1] || nodeBefore(start);
  while (before.lastChild) before = before.lastChild;
  if (before && before.nodeType == 3) {
    var value = before.nodeValue;
    sizeBefore = value.length;
    if (data && value.slice(value.length - data.length) == data) sizeBefore -= data.length;
  }
  var after = end.childNodes[range.endOffset] || nodeAfter(end);
  while (after.firstChild) after = after.firstChild;
  if (after && after.nodeType == 3) sizeAfter = after.nodeValue.length;

  return { before: before, sizeBefore: sizeBefore,
    after: after, sizeAfter: sizeAfter };
}

function textInContext(context, deflt) {
  if (context.inside) {
    var _val = context.inside.nodeValue;
    return _val.slice(context.lead, _val.length - context.trail);
  } else {
    var before = context.before,
        after = context.after,
        val = "";
    if (!before) return deflt;
    if (before.nodeType == 3) val = before.nodeValue.slice(context.sizeBefore);
    var scan = scanText(before, after);
    if (scan == null) return deflt;
    val += scan;
    if (after && after.nodeType == 3) {
      var valAfter = after.nodeValue;
      val += valAfter.slice(0, valAfter.length - context.sizeAfter);
    }
    return val;
  }
}

function nodeAfter(node) {
  for (;;) {
    var next = node.nextSibling;
    if (next) {
      while (next.firstChild) next = next.firstChild;
      return next;
    }
    if (!(node = node.parentElement)) return null;
  }
}

function nodeBefore(node) {
  for (;;) {
    var prev = node.previousSibling;
    if (prev) {
      while (prev.lastChild) prev = prev.lastChild;
      return prev;
    }
    if (!(node = node.parentElement)) return null;
  }
}

function scanText(start, end) {
  var text = "",
      cur = start;
  for (;;) {
    if (cur == end) return text;
    if (!cur) return null;
    if (cur.nodeType == 3) text += cur.nodeValue;
    cur = cur.firstChild || nodeAfter(cur);
  }
}

},{"../convert/from_dom":2,"../model":27,"../transform/tree":42,"./selection":23}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.draw = draw;
exports.redraw = redraw;

var _model = require("../model");

var _convertTo_dom = require("../convert/to_dom");

var _dom = require("../dom");

var nonEditable = { html_block: true, html_tag: true, horizontal_rule: true };

function options(path, ranges) {
  return {
    onRender: function onRender(node, dom, offset) {
      if (node.type.type != "span" && offset != null) dom.setAttribute("pm-path", offset);
      if (nonEditable.hasOwnProperty(node.type.name)) dom.contentEditable = false;
      return dom;
    },
    renderInlineFlat: function renderInlineFlat(node, dom, offset) {
      ranges.advanceTo(new _model.Pos(path, offset));
      var end = new _model.Pos(path, offset + node.size);
      var nextCut = ranges.nextChangeBefore(end);

      var inner = dom,
          wrapped = undefined;
      for (var i = 0; i < node.styles.length; i++) {
        inner = inner.firstChild;
      }if (dom.nodeType != 1) {
        dom = (0, _dom.elt)("span", null, dom);
        if (!nextCut) wrapped = dom;
      }
      if (!wrapped && (nextCut || ranges.current.length)) {
        wrapped = inner == dom ? dom = (0, _dom.elt)("span", null, inner) : inner.parentNode.appendChild((0, _dom.elt)("span", null, inner));
      }

      dom.setAttribute("pm-span", offset + "-" + end.offset);
      if (node.type != _model.nodeTypes.text) dom.setAttribute("pm-span-atom", "true");

      var inlineOffset = 0;
      while (nextCut) {
        var size = nextCut - offset;
        var split = splitSpan(wrapped, size);
        if (ranges.current.length) split.className = ranges.current.join(" ");
        split.setAttribute("pm-span-offset", inlineOffset);
        inlineOffset += size;
        offset += size;
        ranges.advanceTo(new _model.Pos(path, offset));
        if (!(nextCut = ranges.nextChangeBefore(end))) wrapped.setAttribute("pm-span-offset", inlineOffset);
      }

      if (ranges.current.length) wrapped.className = ranges.current.join(" ");
      return dom;
    },
    document: document,
    path: path
  };
}

function splitSpan(span, at) {
  var textNode = span.firstChild,
      text = textNode.nodeValue;
  var newNode = span.parentNode.insertBefore((0, _dom.elt)("span", null, text.slice(0, at)), span);
  textNode.nodeValue = text.slice(at);
  return newNode;
}

function draw(pm, doc) {
  pm.content.textContent = "";
  pm.content.appendChild((0, _convertTo_dom.toDOM)(doc, options([], pm.ranges.activeRangeTracker())));
}

function deleteNextNodes(parent, at, amount) {
  for (var i = 0; i < amount; i++) {
    var prev = at;
    at = at.nextSibling;
    parent.removeChild(prev);
  }
  return at;
}

function redraw(pm, dirty, doc, prev) {
  var ranges = pm.ranges.activeRangeTracker();
  var path = [];

  function scan(dom, node, prev) {
    var status = [],
        inPrev = [],
        inNode = [];
    for (var i = 0, _j = 0; i < prev.content.length && _j < node.content.length; i++) {
      var cur = prev.content[i],
          dirtyStatus = dirty.get(cur);
      status.push(dirtyStatus);
      var matching = dirtyStatus ? -1 : node.content.indexOf(cur, _j);
      if (matching > -1) {
        inNode[i] = matching;
        inPrev[matching] = i;
        _j = matching + 1;
      }
    }

    if (node.type.contains == "span") {
      var needsBR = node.content.length == 0 || node.content[node.content.length - 1].type == _model.nodeTypes.hard_break;
      var last = dom.lastChild,
          hasBR = last && last.nodeType == 1 && last.hasAttribute("pm-force-br");
      if (needsBR && !hasBR) dom.appendChild((0, _dom.elt)("br", { "pm-force-br": "true" }));else if (!needsBR && hasBR) dom.removeChild(last);
    }

    var domPos = dom.firstChild,
        j = 0;
    var block = node.type.block;
    for (var i = 0, offset = 0; i < node.content.length; i++) {
      var child = node.content[i];
      if (!block) path.push(i);
      var found = inPrev[i];
      var nodeLeft = true;
      if (found > -1) {
        domPos = deleteNextNodes(dom, domPos, found - j);
        j = found;
      } else if (!block && j < prev.content.length && inNode[j] == null && status[j] != 2 && child.sameMarkup(prev.content[j])) {
        scan(domPos, child, prev.content[j]);
      } else {
        dom.insertBefore((0, _convertTo_dom.renderNodeToDOM)(child, options(path, ranges), block ? offset : i), domPos);
        nodeLeft = false;
      }
      if (nodeLeft) {
        if (block) domPos.setAttribute("pm-span", offset + "-" + (offset + child.size));else domPos.setAttribute("pm-path", i);
        domPos = domPos.nextSibling;
        j++;
      }
      if (block) offset += child.size;else path.pop();
    }
    deleteNextNodes(dom, domPos, prev.content.length - j);
  }
  scan(pm.content, doc, prev);
}

},{"../convert/to_dom":4,"../dom":7,"../model":27}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addEventListener = addEventListener;
exports.removeEventListener = removeEventListener;
exports.signal = signal;
exports.hasHandler = hasHandler;
exports.eventMixin = eventMixin;

function addEventListener(emitter, type, f) {
  var map = emitter._handlers || (emitter._handlers = {});
  var arr = map[type] || (map[type] = []);
  arr.push(f);
}

function removeEventListener(emitter, type, f) {
  var arr = emitter._handlers && emitter._handlers[type];
  if (arr) for (var i = 0; i < arr.length; ++i) {
    if (arr[i] == f) {
      arr.splice(i, 1);break;
    }
  }
}

function signal(emitter, type) {
  var arr = emitter._handlers && emitter._handlers[type];

  for (var _len = arguments.length, values = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    values[_key - 2] = arguments[_key];
  }

  if (arr) for (var i = 0; i < arr.length; ++i) {
    arr[i].apply(arr, values);
  }
}

function hasHandler(emitter, type) {
  var arr = emitter._handlers && emitter._handlers[type];
  return arr && arr.length > 0;
}

// Add event-related methods to a constructor's prototype, to make
// registering events on such objects more convenient.

function eventMixin(ctor) {
  var proto = ctor.prototype;
  proto.on = proto.addEventListener = function (type, f) {
    addEventListener(this, type, f);
  };
  proto.off = proto.removeEventListener = function (type, f) {
    removeEventListener(this, type, f);
  };
  proto.signal = function (type) {
    for (var _len2 = arguments.length, values = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      values[_key2 - 1] = arguments[_key2];
    }

    signal.apply(undefined, [this, type].concat(values));
  };
}

},{}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _model = require("../model");

var _transform = require("../transform");

var InvertedStep = function InvertedStep(step, version, id) {
  _classCallCheck(this, InvertedStep);

  this.step = step;
  this.version = version;
  this.id = id;
};

var BranchRemapping = (function () {
  function BranchRemapping(branch) {
    _classCallCheck(this, BranchRemapping);

    this.branch = branch;
    this.remap = new _transform.Remapping();
    this.version = branch.version;
    this.mirrorBuffer = Object.create(null);
  }

  _createClass(BranchRemapping, [{
    key: "moveToVersion",
    value: function moveToVersion(version) {
      while (this.version > version) this.addNextMap();
    }
  }, {
    key: "addNextMap",
    value: function addNextMap() {
      var found = this.branch.mirror[this.version];
      var mapOffset = this.branch.maps.length - (this.branch.version - this.version) - 1;
      var id = this.remap.addToFront(this.branch.maps[mapOffset], this.mirrorBuffer[this.version]);
      --this.version;
      if (found != null) this.mirrorBuffer[found] = id;
      return id;
    }
  }, {
    key: "movePastStep",
    value: function movePastStep(result) {
      var id = this.addNextMap();
      if (result) this.remap.addToBack(result.map, id);
    }
  }]);

  return BranchRemapping;
})();

var workTime = 100,
    pauseTime = 150;

var CompressionWorker = (function () {
  function CompressionWorker(doc, branch, callback) {
    _classCallCheck(this, CompressionWorker);

    this.branch = branch;
    this.callback = callback;
    this.remap = new BranchRemapping(branch);

    this.doc = doc;
    this.events = [];
    this.maps = [];
    this.version = this.startVersion = branch.version;

    this.i = branch.events.length;
    this.timeout = null;
    this.aborted = false;
  }

  _createClass(CompressionWorker, [{
    key: "work",
    value: function work() {
      var _this = this;

      if (this.aborted) return;

      var endTime = Date.now() + workTime;

      for (;;) {
        if (this.i == 0) return this.finish();
        var _event = this.branch.events[--this.i],
            outEvent = [];
        for (var j = _event.length - 1; j >= 0; j--) {
          var _event$j = _event[j];
          var step = _event$j.step;
          var stepVersion = _event$j.version;
          var stepID = _event$j.id;

          this.remap.moveToVersion(stepVersion);

          var mappedStep = (0, _transform.mapStep)(step, this.remap.remap);
          if (mappedStep && isDelStep(step)) {
            var extra = 0,
                start = step.from;
            while (j > 0) {
              var next = _event[j - 1];
              if (next.version != stepVersion - 1 || !isDelStep(next.step) || start.cmp(next.step.to)) break;
              extra += next.step.to.offset - next.step.from.offset;
              start = next.step.from;
              stepVersion--;
              j--;
              this.remap.addNextMap();
            }
            if (extra > 0) {
              var _start = mappedStep.from.shift(-extra);
              mappedStep = new _transform.Step("replace", _start, mappedStep.to, _start, { nodes: [], openLeft: 0, openRight: 0 });
            }
          }
          var result = mappedStep && (0, _transform.applyStep)(this.doc, mappedStep);
          if (result) {
            this.doc = result.doc;
            this.maps.push(result.map.invert());
            outEvent.push(new InvertedStep(mappedStep, this.version, stepID));
            this.version--;
          }
          this.remap.movePastStep(result);
        }
        if (outEvent.length) {
          outEvent.reverse();
          this.events.push(outEvent);
        }
        if (Date.now() > endTime) {
          this.timeout = window.setTimeout(function () {
            return _this.work();
          }, pauseTime);
          return;
        }
      }
    }
  }, {
    key: "finish",
    value: function finish() {
      if (this.aborted) return;

      this.events.reverse();
      this.maps.reverse();
      this.callback(this.maps.concat(this.branch.maps.slice(this.branch.maps.length - (this.branch.version - this.startVersion))), this.events);
    }
  }, {
    key: "abort",
    value: function abort() {
      this.aborted = true;
      window.clearTimeout(this.timeout);
    }
  }]);

  return CompressionWorker;
})();

function isDelStep(step) {
  return step.name == "replace" && step.from.offset < step.to.offset && _model.Pos.samePath(step.from.path, step.to.path) && step.param.nodes.length == 0;
}

var compressStepCount = 150;

var Branch = (function () {
  function Branch(maxDepth) {
    _classCallCheck(this, Branch);

    this.maxDepth = maxDepth;
    this.version = 0;
    this.nextStepID = 1;

    this.maps = [];
    this.mirror = Object.create(null);
    this.events = [];

    this.stepsSinceCompress = 0;
    this.compressing = null;
    this.compressTimeout = null;
  }

  _createClass(Branch, [{
    key: "clear",
    value: function clear(force) {
      if (force || !this.empty()) {
        this.maps.length = this.events.length = this.stepsSinceCompress = 0;
        this.mirror = Object.create(null);
        this.abortCompression();
      }
    }
  }, {
    key: "newEvent",
    value: function newEvent() {
      this.abortCompression();
      this.events.push([]);
      while (this.events.length > this.maxDepth) this.events.shift();
    }
  }, {
    key: "addMap",
    value: function addMap(map) {
      if (!this.empty()) {
        this.maps.push(map);
        this.version++;
        this.stepsSinceCompress++;
        return true;
      }
    }
  }, {
    key: "empty",
    value: function empty() {
      return this.events.length == 0;
    }
  }, {
    key: "addStep",
    value: function addStep(step, map, id) {
      this.addMap(map);
      if (id == null) id = this.nextStepID++;
      this.events[this.events.length - 1].push(new InvertedStep(step, this.version, id));
    }
  }, {
    key: "addTransform",
    value: function addTransform(transform, ids) {
      this.abortCompression();
      for (var i = 0; i < transform.steps.length; i++) {
        var inverted = (0, _transform.invertStep)(transform.steps[i], transform.docs[i], transform.maps[i]);
        this.addStep(inverted, transform.maps[i], ids && ids[i]);
      }
    }
  }, {
    key: "popEvent",
    value: function popEvent(doc, allowCollapsing) {
      this.abortCompression();
      var event = this.events.pop();
      if (!event) return null;

      var remap = new BranchRemapping(this),
          collapsing = allowCollapsing;
      var tr = new _transform.Transform(doc);
      var ids = [];

      for (var i = event.length - 1; i >= 0; i--) {
        var invertedStep = event[i],
            step = invertedStep.step;
        if (!collapsing || invertedStep.version != remap.version) {
          collapsing = false;
          remap.moveToVersion(invertedStep.version);

          step = (0, _transform.mapStep)(step, remap.remap);
          var result = step && tr.step(step);
          if (result) {
            ids.push(invertedStep.id);
            if (this.addMap(result.map)) this.mirror[this.version] = invertedStep.version;
          }

          if (i > 0) remap.movePastStep(result);
        } else {
          this.version--;
          delete this.mirror[this.version];
          this.maps.pop();
          tr.step(step);
          ids.push(invertedStep.id);
          --remap.version;
        }
      }
      if (this.empty()) this.clear(true);
      return { transform: tr, ids: ids };
    }
  }, {
    key: "getVersion",
    value: function getVersion() {
      return { id: this.nextStepID, version: this.version };
    }
  }, {
    key: "findVersion",
    value: function findVersion(version) {
      for (var i = this.events.length - 1; i >= 0; i--) {
        var _event2 = this.events[i];
        for (var j = _event2.length - 1; j >= 0; j--) {
          var step = _event2[j];
          if (step.id == version.id) return { event: i, step: j };else if (step.id < version.id) return { event: i, step: j + 1 };
        }
      }
    }
  }, {
    key: "rebased",
    value: function rebased(newMaps, rebasedTransform, positions) {
      if (this.empty()) return;
      this.abortCompression();

      var startVersion = this.version - positions.length;

      // Update and clean up the events
      out: for (var i = this.events.length - 1; i >= 0; i--) {
        var _event3 = this.events[i];
        for (var j = _event3.length - 1; j >= 0; j--) {
          var step = _event3[j];
          if (step.version <= startVersion) break out;
          var off = positions[step.version - startVersion - 1];
          if (off == -1) {
            _event3.splice(j--, 1);
          } else {
            var inv = (0, _transform.invertStep)(rebasedTransform.steps[off], rebasedTransform.docs[off], rebasedTransform.maps[off]);
            _event3[j] = new InvertedStep(inv, startVersion + newMaps.length + off + 1, step.id);
          }
        }
      }

      // Sync the array of maps
      if (this.maps.length > positions.length) this.maps = this.maps.slice(0, this.maps.length - positions.length).concat(newMaps).concat(rebasedTransform.maps);else this.maps = rebasedTransform.maps.slice();

      this.version = startVersion + newMaps.length + rebasedTransform.maps.length;

      this.stepsSinceCompress += newMaps.length + rebasedTransform.steps.length - positions.length;
    }
  }, {
    key: "abortCompression",
    value: function abortCompression() {
      if (this.compressing) {
        this.compressing.abort();
        this.compressing = null;
      }
    }
  }, {
    key: "needsCompression",
    value: function needsCompression() {
      return this.stepsSinceCompress > compressStepCount && !this.compressing;
    }
  }, {
    key: "startCompression",
    value: function startCompression(doc) {
      var _this2 = this;

      this.compressing = new CompressionWorker(doc, this, function (maps, events) {
        _this2.maps = maps;
        _this2.events = events;
        _this2.mirror = Object.create(null);
        _this2.compressing = null;
        _this2.stepsSinceCompress = 0;
      });
      this.compressing.work();
    }
  }]);

  return Branch;
})();

var compressDelay = 750;

var History = (function () {
  function History(pm) {
    var _this3 = this;

    _classCallCheck(this, History);

    this.pm = pm;

    this.done = new Branch(pm.options.historyDepth);
    this.undone = new Branch(pm.options.historyDepth);

    this.lastAddedAt = 0;
    this.ignoreTransform = false;

    this.allowCollapsing = true;

    pm.on("transform", function (transform, options) {
      return _this3.recordTransform(transform, options);
    });
  }

  _createClass(History, [{
    key: "recordTransform",
    value: function recordTransform(transform, options) {
      if (this.ignoreTransform) return;

      if (options.addToHistory == false) {
        for (var i = 0; i < transform.maps.length; i++) {
          var map = transform.maps[i];
          this.done.addMap(map);
          this.undone.addMap(map);
        }
      } else {
        this.undone.clear();
        var now = Date.now();
        if (now > this.lastAddedAt + this.pm.options.historyEventDelay) this.done.newEvent();

        this.done.addTransform(transform);
        this.lastAddedAt = now;
      }
      this.maybeScheduleCompression();
    }
  }, {
    key: "undo",
    value: function undo() {
      return this.shift(this.done, this.undone);
    }
  }, {
    key: "redo",
    value: function redo() {
      return this.shift(this.undone, this.done);
    }
  }, {
    key: "canUndo",
    value: function canUndo() {
      return this.done.events.length > 0;
    }
  }, {
    key: "canRedo",
    value: function canRedo() {
      return this.undone.events.length > 0;
    }
  }, {
    key: "shift",
    value: function shift(from, to) {
      var event = from.popEvent(this.pm.doc, this.allowCollapsing);
      if (!event) return false;
      var transform = event.transform;
      var ids = event.ids;

      this.ignoreTransform = true;
      this.pm.apply(transform);
      this.ignoreTransform = false;

      if (!transform.steps.length) return this.shift(from, to);

      if (to) {
        to.newEvent();
        to.addTransform(transform, ids);
      }
      this.lastAddedAt = 0;

      return true;
    }
  }, {
    key: "getVersion",
    value: function getVersion() {
      return this.done.getVersion();
    }
  }, {
    key: "backToVersion",
    value: function backToVersion(version) {
      var found = this.done.findVersion(version);
      if (!found) return false;
      var event = this.done.events[found.event];
      var combined = this.done.events.slice(found.event + 1).reduce(function (comb, arr) {
        return comb.concat(arr);
      }, event.slice(found.step));
      this.done.events.length = found.event + ((event.length = found.step) ? 1 : 0);
      this.done.events.push(combined);

      this.shift(this.done);
    }
  }, {
    key: "rebased",
    value: function rebased(newMaps, rebasedTransform, positions) {
      this.done.rebased(newMaps, rebasedTransform, positions);
      this.undone.rebased(newMaps, rebasedTransform, positions);
      this.maybeScheduleCompression();
    }
  }, {
    key: "maybeScheduleCompression",
    value: function maybeScheduleCompression() {
      this.maybeScheduleCompressionForBranch(this.done);
      this.maybeScheduleCompressionForBranch(this.undone);
    }
  }, {
    key: "maybeScheduleCompressionForBranch",
    value: function maybeScheduleCompressionForBranch(branch) {
      var _this4 = this;

      window.clearTimeout(branch.compressTimeout);
      if (branch.needsCompression()) branch.compressTimeout = window.setTimeout(function () {
        if (branch.needsCompression()) branch.startCompression(_this4.pm.doc);
      }, compressDelay);
    }
  }]);

  return History;
})();

exports.History = History;

},{"../model":27,"../transform":34}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _main = require("./main");

Object.defineProperty(exports, "ProseMirror", {
  enumerable: true,
  get: function get() {
    return _main.ProseMirror;
  }
});

var _options = require("./options");

Object.defineProperty(exports, "defineOption", {
  enumerable: true,
  get: function get() {
    return _options.defineOption;
  }
});

var _selection = require("./selection");

Object.defineProperty(exports, "Range", {
  enumerable: true,
  get: function get() {
    return _selection.Range;
  }
});

var _event = require("./event");

Object.defineProperty(exports, "eventMixin", {
  enumerable: true,
  get: function get() {
    return _event.eventMixin;
  }
});

var _keys = require("./keys");

Object.defineProperty(exports, "Keymap", {
  enumerable: true,
  get: function get() {
    return _keys.Keymap;
  }
});

},{"./event":14,"./keys":18,"./main":19,"./options":21,"./selection":23}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

exports.dispatchKey = dispatchKey;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _model = require("../model");

var _convertFrom_dom = require("../convert/from_dom");

var _convertTo_dom = require("../convert/to_dom");

var _convertTo_text = require("../convert/to_text");

var _convertConvert = require("../convert/convert");

var _keys = require("./keys");

var _dom = require("../dom");

var _commands = require("./commands");

var _domchange = require("./domchange");

var _selection = require("./selection");

var stopSeq = null;
var handlers = {};

var Input = (function () {
  function Input(pm) {
    var _this = this;

    _classCallCheck(this, Input);

    this.pm = pm;

    this.keySeq = null;
    this.composing = null;
    this.shiftKey = this.updatingComposition = false;
    this.skipInput = 0;

    this.draggingFrom = false;

    this.keymaps = [];
    this.commandExtensions = Object.create(null);

    this.storedStyles = null;

    var _loop = function _loop(_event) {
      var handler = handlers[_event];
      pm.content.addEventListener(_event, function (e) {
        return handler(pm, e);
      });
    };

    for (var _event in handlers) {
      _loop(_event);
    }

    pm.on("selectionChange", function () {
      return _this.storedStyles = null;
    });
  }

  _createClass(Input, [{
    key: "extendCommand",
    value: function extendCommand(name, priority, f) {
      var obj = this.commandExtensions[name] || (this.commandExtensions[name] = { low: [], normal: [], high: [] });
      obj[priority].push(f);
    }
  }, {
    key: "unextendCommand",
    value: function unextendCommand(name, priority, f) {
      var obj = this.commandExtensions[name];
      var arr = obj && obj[priority];
      if (arr) for (var i = 0; i < arr.length; i++) {
        if (arr[i] == f) {
          arr.splice(i, 1);break;
        }
      }
    }
  }, {
    key: "maybeAbortComposition",
    value: function maybeAbortComposition() {
      if (this.composing && !this.updatingComposition) {
        if (this.composing.finished) {
          finishComposing(this.pm);
        } else {
          // Toggle selection to force end of composition
          this.composing = null;
          this.skipInput++;
          var sel = getSelection();
          if (sel.rangeCount) {
            var range = sel.getRangeAt(0);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
        return true;
      }
    }
  }]);

  return Input;
})();

exports.Input = Input;

function dispatchKey(pm, name, e) {
  var seq = pm.input.keySeq;
  if (seq) {
    if ((0, _keys.isModifierKey)(name)) return true;
    clearTimeout(stopSeq);
    stopSeq = setTimeout(function () {
      if (pm.input.keySeq == seq) pm.input.keySeq = null;
    }, 50);
    name = seq + " " + name;
  }

  var handle = function handle(bound) {
    var result = typeof bound == "string" ? (0, _commands.execCommand)(pm, bound) : bound(pm);
    return result !== false;
  };

  var result = undefined;
  for (var i = 0; !result && i < pm.input.keymaps.length; i++) {
    result = (0, _keys.lookupKey)(name, pm.input.keymaps[i], handle, pm);
  }if (!result) result = (0, _keys.lookupKey)(name, pm.options.extraKeymap, handle, pm) || (0, _keys.lookupKey)(name, pm.options.keymap, handle, pm);

  if (result == "multi") pm.input.keySeq = name;

  if (result == "handled" || result == "multi") e.preventDefault();

  if (seq && !result && /\'$/.test(name)) {
    e.preventDefault();
    return true;
  }
  return !!result;
}

handlers.keydown = function (pm, e) {
  if (e.keyCode == 16) pm.input.shiftKey = true;
  if (pm.input.composing) return;
  var name = (0, _keys.keyName)(e);
  if (name) dispatchKey(pm, name, e);
};

handlers.keyup = function (pm, e) {
  if (e.keyCode == 16) pm.input.shiftKey = false;
};

function inputText(pm, range, text) {
  if (range.empty && !text) return false;
  var styles = pm.input.storedStyles || (0, _model.spanStylesAt)(pm.doc, range.from);
  var tr = pm.tr;
  if (!range.empty) tr["delete"](range.from, range.to);
  pm.apply(tr.insert(range.from, _model.Span.text(text, styles)));
  pm.signal("textInput", text);
  pm.scrollIntoView();
}

handlers.keypress = function (pm, e) {
  if (pm.input.composing || !e.charCode || e.ctrlKey && !e.altKey || _dom.browser.mac && e.metaKey) return;
  var ch = String.fromCharCode(e.charCode);
  if (dispatchKey(pm, "'" + ch + "'", e)) return;
  inputText(pm, pm.selection, ch);
  e.preventDefault();
};

var Composing = function Composing(pm, data) {
  _classCallCheck(this, Composing);

  this.finished = false;
  this.context = (0, _domchange.textContext)(data);
  this.data = data;
  this.endData = null;
  var range = pm.selection;
  if (data) {
    var path = range.head.path,
        line = pm.doc.path(path).textContent;
    var found = line.indexOf(data, range.head.offset - data.length);
    if (found > -1 && found <= range.head.offset + data.length) range = new _selection.Range(new _model.Pos(path, found), new _model.Pos(path, found + data.length));
  }
  this.range = range;
};

handlers.compositionstart = function (pm, e) {
  if (pm.input.maybeAbortComposition()) return;

  pm.flush();
  pm.input.composing = new Composing(pm, e.data);
};

handlers.compositionupdate = function (pm, e) {
  var info = pm.input.composing;
  if (info && info.data != e.data) {
    info.data = e.data;
    pm.input.updatingComposition = true;
    inputText(pm, info.range, info.data);
    pm.input.updatingComposition = false;
    info.range = new _selection.Range(info.range.from, info.range.from.shift(info.data.length));
  }
};

handlers.compositionend = function (pm, e) {
  var info = pm.input.composing;
  if (info) {
    pm.input.composing.finished = true;
    pm.input.composing.endData = e.data;
    setTimeout(function () {
      if (pm.input.composing == info) finishComposing(pm);
    }, 20);
  }
};

function finishComposing(pm) {
  var info = pm.input.composing;
  var text = (0, _domchange.textInContext)(info.context, info.endData);
  if (text != info.data) pm.ensureOperation();
  pm.input.composing = null;
  if (text != info.data) inputText(pm, info.range, text);
}

handlers.input = function (pm) {
  if (pm.input.skipInput) return --pm.input.skipInput;

  if (pm.input.composing) {
    if (pm.input.composing.finished) finishComposing(pm);
    return;
  }

  pm.input.suppressPolling = true;
  (0, _domchange.applyDOMChange)(pm);
  pm.input.suppressPolling = false;
  pm.sel.poll(true);
  pm.scrollIntoView();
};

var lastCopied = null;

handlers.copy = handlers.cut = function (pm, e) {
  var sel = pm.selection;
  if (sel.empty) return;
  var fragment = pm.selectedDoc;
  lastCopied = { doc: pm.doc, from: sel.from, to: sel.to,
    html: (0, _convertTo_dom.toHTML)(fragment, { document: document }),
    text: (0, _convertTo_text.toText)(fragment) };

  if (e.clipboardData) {
    e.preventDefault();
    e.clipboardData.clearData();
    e.clipboardData.setData("text/html", lastCopied.html);
    e.clipboardData.setData("text/plain", lastCopied.text);
    if (e.type == "cut" && !sel.empty) pm.apply(pm.tr["delete"](sel.from, sel.to));
  }
};

handlers.paste = function (pm, e) {
  if (!e.clipboardData) return;
  var sel = pm.selection;
  var txt = e.clipboardData.getData("text/plain");
  var html = e.clipboardData.getData("text/html");
  if (html || txt) {
    e.preventDefault();
    var doc = undefined,
        from = undefined,
        to = undefined;
    if (pm.input.shiftKey && txt) {
      (function () {
        var paragraphs = txt.split(/[\r\n]+/);
        var styles = (0, _model.spanStylesAt)(pm.doc, sel.from);
        doc = new _model.Node("doc", null, paragraphs.map(function (s) {
          return new _model.Node("paragraph", null, [_model.Span.text(s, styles)]);
        }));
      })();
    } else if (lastCopied && (lastCopied.html == html || lastCopied.text == txt)) {
      ;var _lastCopied = lastCopied;
      doc = _lastCopied.doc;
      from = _lastCopied.from;
      to = _lastCopied.to;
    } else if (html) {
      doc = (0, _convertFrom_dom.fromHTML)(html, { document: document });
    } else {
      doc = (0, _convertConvert.convertFrom)(txt, (0, _convertConvert.knownSource)("markdown") ? "markdown" : "text");
    }
    pm.apply(pm.tr.replace(sel.from, sel.to, doc, from || _model.Pos.start(doc), to || _model.Pos.end(doc)));
    pm.scrollIntoView();
  }
};

handlers.dragstart = function (pm, e) {
  if (!e.dataTransfer) return;

  var fragment = pm.selectedDoc;

  e.dataTransfer.setData("text/html", (0, _convertTo_dom.toHTML)(fragment, { document: document }));
  e.dataTransfer.setData("text/plain", (0, _convertTo_text.toText)(fragment) + "??");
  pm.input.draggingFrom = true;
};

handlers.dragend = function (pm) {
  return window.setTimeout(function () {
    return pm.input.dragginFrom = false;
  }, 50);
};

handlers.dragover = handlers.dragenter = function (_, e) {
  return e.preventDefault();
};

handlers.drop = function (pm, e) {
  if (!e.dataTransfer) return;

  var html = undefined,
      txt = undefined,
      doc = undefined;
  if (html = e.dataTransfer.getData("text/html")) doc = (0, _convertFrom_dom.fromHTML)(html, { document: document });else if (txt = e.dataTransfer.getData("text/plain")) doc = (0, _convertConvert.convertFrom)(txt, (0, _convertConvert.knownSource)("markdown") ? "markdown" : "text");

  if (doc) {
    e.preventDefault();
    var insertPos = pm.posAtCoords({ left: e.clientX, top: e.clientY });
    var tr = pm.tr;
    if (pm.input.draggingFrom && !e.ctrlKey) {
      var sel = pm.selection;
      tr["delete"](sel.from, sel.to);
      insertPos = tr.map(insertPos).pos;
    }
    tr.replace(insertPos, insertPos, doc, _model.Pos.start(doc), _model.Pos.end(doc));
    pm.apply(tr);
    pm.setSelection(new _selection.Range(insertPos, tr.map(insertPos).pos));
    pm.focus();
  }
};

handlers.focus = function (pm) {
  (0, _dom.addClass)(pm.wrapper, "ProseMirror-focused");
  pm.signal("focus");
};

handlers.blur = function (pm) {
  (0, _dom.rmClass)(pm.wrapper, "ProseMirror-focused");
  pm.signal("blur");
};

},{"../convert/convert":1,"../convert/from_dom":2,"../convert/to_dom":4,"../convert/to_text":6,"../dom":7,"../model":27,"./commands":9,"./domchange":12,"./keys":18,"./selection":23}],18:[function(require,module,exports){
// From CodeMirror, should be factored into its own NPM module

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

exports.keyName = keyName;
exports.isModifierKey = isModifierKey;
exports.lookupKey = lookupKey;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var names = {
  3: "Enter", 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift", 17: "Ctrl", 18: "Alt",
  19: "Pause", 20: "CapsLock", 27: "Esc", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End",
  36: "Home", 37: "Left", 38: "Up", 39: "Right", 40: "Down", 44: "PrintScrn", 45: "Insert",
  46: "Delete", 59: ";", 61: "=", 91: "Mod", 92: "Mod", 93: "Mod", 107: "=", 109: "-", 127: "Delete",
  173: "-", 186: ";", 187: "=", 188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\",
  221: "]", 222: "'", 63232: "Up", 63233: "Down", 63234: "Left", 63235: "Right", 63272: "Delete",
  63273: "Home", 63275: "End", 63276: "PageUp", 63277: "PageDown", 63302: "Insert"
};

exports.names = names;
// Number keys
for (var i = 0; i < 10; i++) {
  names[i + 48] = names[i + 96] = String(i);
} // Alphabetic keys
for (var i = 65; i <= 90; i++) {
  names[i] = String.fromCharCode(i);
} // Function keys
for (var i = 1; i <= 12; i++) {
  names[i + 111] = names[i + 63235] = "F" + i;
}
function keyName(event, noShift) {
  var base = names[event.keyCode],
      name = base;
  if (name == null || event.altGraphKey) return false;

  if (event.altKey && base != "Alt") name = "Alt-" + name;
  if (event.ctrlKey && base != "Ctrl") name = "Ctrl-" + name;
  if (event.metaKey && base != "Cmd") name = "Cmd-" + name;
  if (!noShift && event.shiftKey && base != "Shift") name = "Shift-" + name;
  return name;
}

function isModifierKey(value) {
  var name = typeof value == "string" ? value : names[value.keyCode];
  return name == "Ctrl" || name == "Alt" || name == "Shift" || name == "Mod";
}

function normalizeKeyName(fullName) {
  var parts = fullName.split(/-(?!$)/),
      name = parts[parts.length - 1];
  var alt = undefined,
      ctrl = undefined,
      shift = undefined,
      cmd = undefined;
  for (var i = 0; i < parts.length - 1; i++) {
    var mod = parts[i];
    if (/^(cmd|meta|m)$/i.test(mod)) cmd = true;else if (/^a(lt)?$/i.test(mod)) alt = true;else if (/^(c|ctrl|control)$/i.test(mod)) ctrl = true;else if (/^s(hift)$/i.test(mod)) shift = true;else throw new Error("Unrecognized modifier name: " + mod);
  }
  if (alt) name = "Alt-" + name;
  if (ctrl) name = "Ctrl-" + name;
  if (cmd) name = "Cmd-" + name;
  if (shift) name = "Shift-" + name;
  return name;
}

var Keymap = (function () {
  function Keymap(keys, options) {
    _classCallCheck(this, Keymap);

    this.options = options || {};
    this.bindings = Object.create(null);
    if (keys) for (var keyname in keys) {
      if (Object.prototype.hasOwnProperty.call(keys, keyname)) this.addBinding(keyname, keys[keyname]);
    }
  }

  _createClass(Keymap, [{
    key: "addBinding",
    value: function addBinding(keyname, value) {
      var keys = keyname.split(" ").map(normalizeKeyName);
      for (var i = 0; i < keys.length; i++) {
        var _name = keys.slice(0, i + 1).join(" ");
        var val = i == keys.length - 1 ? value : "...";
        var prev = this.bindings[_name];
        if (!prev) this.bindings[_name] = val;else if (prev != val) throw new Error("Inconsistent bindings for " + _name);
      }
    }
  }, {
    key: "removeBinding",
    value: function removeBinding(keyname) {
      var keys = keyname.split(" ").map(normalizeKeyName);
      for (var i = keys.length - 1; i >= 0; i--) {
        var _name2 = keys.slice(0, i).join(" ");
        var val = this.bindings[_name2];
        if (val == "..." && !this.unusedMulti(_name2)) break;else if (val) delete this.bindings[_name2];
      }
    }
  }, {
    key: "unusedMulti",
    value: function unusedMulti(name) {
      for (var binding in this.bindings) {
        if (binding.length > name && binding.indexOf(name) == 0 && binding.charAt(name.length) == " ") return false;
      }return true;
    }
  }]);

  return Keymap;
})();

exports.Keymap = Keymap;

function lookupKey(_x, _x2, _x3, _x4) {
  var _again = true;

  _function: while (_again) {
    var key = _x,
        map = _x2,
        handle = _x3,
        context = _x4;
    found = fall = i = result = undefined;
    _again = false;

    var found = map.options.call ? map.options.call(key, context) : map.bindings[key];
    if (found === false) return "nothing";
    if (found === "...") return "multi";
    if (found != null && handle(found)) return "handled";

    var fall = map.options.fallthrough;
    if (fall) {
      if (!Array.isArray(fall)) {
        _x = key;
        _x2 = fall;
        _x3 = handle;
        _x4 = context;
        _again = true;
        continue _function;
      }
      for (var i = 0; i < fall.length; i++) {
        var result = lookupKey(key, fall[i], handle, context);
        if (result) return result;
      }
    }
  }
}

},{}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

require("./css");

var _model = require("../model");

var _transform = require("../transform");

var _options = require("./options");

var _selection = require("./selection");

var _dom = require("../dom");

var _draw = require("./draw");

var _input = require("./input");

var _history = require("./history");

var _event = require("./event");

var _convertTo_text = require("../convert/to_text");

require("../convert/from_text");

var _convertConvert = require("../convert/convert");

var _commands = require("./commands");

var _range = require("./range");

var ProseMirror = (function () {
  function ProseMirror(opts) {
    _classCallCheck(this, ProseMirror);

    opts = this.options = (0, _options.parseOptions)(opts);
    this.content = (0, _dom.elt)("div", { "class": "ProseMirror-content" });
    this.wrapper = (0, _dom.elt)("div", { "class": "ProseMirror" }, this.content);
    this.wrapper.ProseMirror = this;

    if (opts.place && opts.place.appendChild) opts.place.appendChild(this.wrapper);else if (opts.place) opts.place(this.wrapper);

    this.setDocInner(opts.docFormat ? (0, _convertConvert.convertFrom)(opts.doc, opts.docFormat, { document: document }) : opts.doc);
    (0, _draw.draw)(this, this.doc);
    this.content.contentEditable = true;

    this.mod = Object.create(null);
    this.operation = null;
    this.flushScheduled = false;

    this.sel = new _selection.Selection(this);
    this.input = new _input.Input(this);

    (0, _options.initOptions)(this);
  }

  _createClass(ProseMirror, [{
    key: "apply",
    value: function apply(transform) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? nullOptions : arguments[1];

      if (transform.doc == this.doc) return false;

      this.updateDoc(transform.doc, transform);
      this.signal("transform", transform, options);
      return transform;
    }
  }, {
    key: "setContent",
    value: function setContent(value, format) {
      if (format) value = (0, _convertConvert.convertFrom)(value, format, { document: document });
      this.setDoc(value);
    }
  }, {
    key: "getContent",
    value: function getContent(format) {
      return format ? (0, _convertConvert.convertTo)(this.doc, format, { document: document }) : this.doc;
    }
  }, {
    key: "setDocInner",
    value: function setDocInner(doc) {
      this.doc = doc;
      this.ranges = new _range.RangeStore(this);
      this.history = new _history.History(this);
    }
  }, {
    key: "setDoc",
    value: function setDoc(doc, sel) {
      if (!sel) {
        var start = _model.Pos.start(doc);
        sel = new _selection.Range(start, start);
      }
      this.signal("beforeSetDoc", doc, sel);
      this.ensureOperation();
      this.setDocInner(doc);
      this.sel.set(sel, true);
      this.signal("setDoc", doc, sel);
    }
  }, {
    key: "updateDoc",
    value: function updateDoc(doc, mapping) {
      this.ensureOperation();
      this.input.maybeAbortComposition();
      this.ranges.transform(mapping);
      this.doc = doc;
      var range = this.sel.range;
      this.sel.setAndSignal(new _selection.Range(mapping.map(range.anchor).pos, mapping.map(range.head).pos));
      this.signal("change");
    }
  }, {
    key: "checkPos",
    value: function checkPos(pos, block) {
      if (!this.doc.isValidPos(pos, block)) throw new Error("Position " + pos + " is not valid in current document");
    }
  }, {
    key: "setSelection",
    value: function setSelection(rangeOrAnchor, head) {
      var range = rangeOrAnchor;
      if (!(range instanceof _selection.Range)) range = new _selection.Range(rangeOrAnchor, head || rangeOrAnchor);
      this.checkPos(range.head, true);
      this.checkPos(range.anchor, true);
      this.ensureOperation();
      this.input.maybeAbortComposition();
      if (range.head.cmp(this.sel.range.head) || range.anchor.cmp(this.sel.range.anchor)) this.sel.setAndSignal(range);
    }
  }, {
    key: "ensureOperation",
    value: function ensureOperation() {
      var _this = this;

      if (!this.operation) {
        if (!this.input.suppressPolling) this.sel.poll();
        this.operation = new Operation(this);
      }
      if (!this.flushScheduled) {
        (0, _dom.requestAnimationFrame)(function () {
          _this.flushScheduled = false;
          _this.flush();
        });
        this.flushScheduled = true;
      }
      return this.operation;
    }
  }, {
    key: "flush",
    value: function flush() {
      var op = this.operation;
      if (!op || !document.body.contains(this.wrapper)) return;
      this.operation = null;

      var docChanged = op.doc != this.doc || this.ranges.dirty.size;
      if (docChanged && !this.input.composing) {
        if (op.fullRedraw) (0, _draw.draw)(this, this.doc); // FIXME only redraw target block composition
        else (0, _draw.redraw)(this, this.ranges.dirty, this.doc, op.doc);
        this.ranges.resetDirty();
      }
      if ((docChanged || op.sel.anchor.cmp(this.sel.range.anchor) || op.sel.head.cmp(this.sel.range.head)) && !this.input.composing) this.sel.toDOM(docChanged, op.focus);
      if (op.scrollIntoView !== false) (0, _selection.scrollIntoView)(this, op.scrollIntoView);
      if (docChanged) this.signal("draw");
      this.signal("flush");
    }
  }, {
    key: "setOption",
    value: function setOption(name, value) {
      (0, _options.setOption)(this, name, value);
    }
  }, {
    key: "getOption",
    value: function getOption(name) {
      return this.options[name];
    }
  }, {
    key: "addKeymap",
    value: function addKeymap(map, bottom) {
      this.input.keymaps[bottom ? "push" : "unshift"](map);
    }
  }, {
    key: "removeKeymap",
    value: function removeKeymap(map) {
      var maps = this.input.keymaps;
      for (var i = 0; i < maps.length; ++i) {
        if (maps[i] == map || maps[i].options.name == map) {
          maps.splice(i, 1);
          return true;
        }
      }
    }
  }, {
    key: "markRange",
    value: function markRange(from, to, options) {
      this.checkPos(from);
      this.checkPos(to);
      var range = new _range.MarkedRange(from, to, options);
      this.ranges.addRange(range);
      return range;
    }
  }, {
    key: "removeRange",
    value: function removeRange(range) {
      this.ranges.removeRange(range);
    }
  }, {
    key: "extendCommand",
    value: function extendCommand(name, priority, f) {
      if (f == null) {
        f = priority;priority = "normal";
      }
      if (!/^(normal|low|high)$/.test(priority)) throw new Error("Invalid priority: " + priority);
      this.input.extendCommand(name, priority, f);
    }
  }, {
    key: "unextendCommand",
    value: function unextendCommand(name, priority, f) {
      if (f == null) {
        f = priority;priority = "normal";
      }
      this.input.unextendCommand(name, priority, f);
    }
  }, {
    key: "setInlineStyle",
    value: function setInlineStyle(st, to, range) {
      if (!range) range = this.selection;
      if (!range.empty) {
        if (to == null) to = !(0, _model.rangeHasStyle)(this.doc, range.from, range.to, st.type);
        this.apply(this.tr[to ? "addStyle" : "removeStyle"](range.from, range.to, st));
      } else if (!this.doc.path(range.head.path).type.plainText && range == this.selection) {
        var styles = this.activeStyles();
        if (to == null) to = !_model.style.contains(styles, st);
        this.input.storedStyles = to ? _model.style.add(styles, st) : _model.style.remove(styles, st);
        this.signal("activeStyleChange");
      }
    }
  }, {
    key: "activeStyles",
    value: function activeStyles() {
      return this.input.storedStyles || (0, _model.spanStylesAt)(this.doc, this.selection.head);
    }
  }, {
    key: "focus",
    value: function focus() {
      if (this.operation) this.operation.focus = true;else this.sel.toDOM(false, true);
    }
  }, {
    key: "hasFocus",
    value: function hasFocus() {
      return (0, _selection.hasFocus)(this);
    }
  }, {
    key: "posAtCoords",
    value: function posAtCoords(coords) {
      return (0, _selection.posAtCoords)(this, coords);
    }
  }, {
    key: "coordsAtPos",
    value: function coordsAtPos(pos) {
      this.checkPos(pos);
      return (0, _selection.coordsAtPos)(this, pos);
    }
  }, {
    key: "scrollIntoView",
    value: function scrollIntoView() {
      var pos = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      if (pos) this.checkPos(pos);
      this.ensureOperation();
      this.operation.scrollIntoView = pos;
    }
  }, {
    key: "execCommand",
    value: function execCommand(name) {
      (0, _commands.execCommand)(this, name);
    }
  }, {
    key: "selection",
    get: function get() {
      this.ensureOperation();
      return this.sel.range;
    }
  }, {
    key: "selectedDoc",
    get: function get() {
      var sel = this.selection;
      return (0, _model.sliceBetween)(this.doc, sel.from, sel.to);
    }
  }, {
    key: "selectedText",
    get: function get() {
      return (0, _convertTo_text.toText)(this.selectedDoc);
    }
  }, {
    key: "tr",
    get: function get() {
      return new _transform.Transform(this.doc);
    }
  }]);

  return ProseMirror;
})();

exports.ProseMirror = ProseMirror;

var nullOptions = {};

(0, _event.eventMixin)(ProseMirror);

var Operation = function Operation(pm) {
  _classCallCheck(this, Operation);

  this.doc = pm.doc;
  this.sel = pm.sel.range;
  this.scrollIntoView = false;
  this.focus = false;
  this.fullRedraw = !!pm.input.composing;
};

},{"../convert/convert":1,"../convert/from_text":3,"../convert/to_text":6,"../dom":7,"../model":27,"../transform":34,"./commands":9,"./css":10,"./draw":13,"./event":14,"./history":15,"./input":17,"./options":21,"./range":22,"./selection":23}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Map = window.Map || (function () {
  function _class() {
    _classCallCheck(this, _class);

    this.content = [];
  }

  _createClass(_class, [{
    key: "set",
    value: function set(key, value) {
      var found = this.find(key);
      if (found > -1) this.content[found + 1] = value;else this.content.push(key, value);
    }
  }, {
    key: "get",
    value: function get(key) {
      var found = this.find(key);
      return found == -1 ? undefined : this.content[found + 1];
    }
  }, {
    key: "has",
    value: function has(key) {
      return this.find(key) > -1;
    }
  }, {
    key: "find",
    value: function find(key) {
      for (var i = 0; i < this.content.length; i += 2) {
        if (this.content[i] === key) return i;
      }
    }
  }, {
    key: "size",
    get: function get() {
      return this.content.length / 2;
    }
  }]);

  return _class;
})();
exports.Map = Map;

},{}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defineOption = defineOption;
exports.parseOptions = parseOptions;
exports.initOptions = initOptions;
exports.setOption = setOption;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _model = require("../model");

var _defaultkeymap = require("./defaultkeymap");

var _keys = require("./keys");

var Option = function Option(defaultValue, update, updateOnInit) {
  _classCallCheck(this, Option);

  this.defaultValue = defaultValue;
  this.update = update;
  this.updateOnInit = updateOnInit !== false;
};

var options = {
  __proto__: null,

  doc: new Option(new _model.Node("doc", null, [new _model.Node("paragraph")]), function (pm, value) {
    pm.setDoc(value);
  }, false),

  docFormat: new Option(null),

  place: new Option(null),

  keymap: new Option(_defaultkeymap.defaultKeymap),

  extraKeymap: new Option(new _keys.Keymap()),

  historyDepth: new Option(50),

  historyEventDelay: new Option(500)
};

function defineOption(name, defaultValue, update, updateOnInit) {
  options[name] = new Option(defaultValue, update, updateOnInit);
}

function parseOptions(obj) {
  var result = Object.create(null);
  var given = obj ? [obj].concat(obj.use || []) : [];
  outer: for (var opt in options) {
    for (var i = 0; i < given.length; i++) {
      if (opt in given[i]) {
        result[opt] = given[i][opt];
        continue outer;
      }
    }
    result[opt] = options[opt].defaultValue;
  }
  return result;
}

function initOptions(pm) {
  for (var opt in options) {
    var desc = options[opt];
    if (desc.update && desc.updateOnInit) desc.update(pm, pm.options[opt], null, true);
  }
}

function setOption(pm, name, value) {
  var old = pm.options[name];
  pm.options[name] = value;
  var desc = options[name];
  if (desc.update) desc.update(pm, value, old, false);
}

},{"../model":27,"./defaultkeymap":11,"./keys":18}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _map = require("./map");

var _event = require("./event");

var MarkedRange = (function () {
  function MarkedRange(from, to, options) {
    _classCallCheck(this, MarkedRange);

    this.options = options || {};
    this.from = from;
    this.to = to;
  }

  _createClass(MarkedRange, [{
    key: "clear",
    value: function clear() {
      this.signal("removed", this.from);
      this.from = this.to = null;
    }
  }]);

  return MarkedRange;
})();

exports.MarkedRange = MarkedRange;

(0, _event.eventMixin)(MarkedRange);

var RangeSorter = (function () {
  function RangeSorter() {
    _classCallCheck(this, RangeSorter);

    this.sorted = [];
  }

  _createClass(RangeSorter, [{
    key: "find",
    value: function find(at) {
      var min = 0,
          max = this.sorted.length;
      for (;;) {
        if (max < min + 10) {
          for (var i = min; i < max; i++) {
            if (this.sorted[i].at.cmp(at) >= 0) return i;
          }return max;
        }
        var mid = min + max >> 1;
        if (this.sorted[mid].at.cmp(at) > 0) max = mid;else min = mid;
      }
    }
  }, {
    key: "insert",
    value: function insert(obj) {
      this.sorted.splice(this.find(obj.at), 0, obj);
    }
  }, {
    key: "remove",
    value: function remove(at, range) {
      var pos = this.find(at);
      for (var dist = 0;; dist++) {
        var leftPos = pos - dist - 1,
            rightPos = pos + dist;
        if (leftPos >= 0 && this.sorted[leftPos].range == range) {
          this.sorted.splice(leftPos, 1);
          return;
        } else if (rightPos < this.sorted.length && this.sorted[rightPos].range == range) {
          this.sorted.splice(rightPos, 1);
          return;
        }
      }
    }
  }, {
    key: "resort",
    value: function resort() {
      for (var i = 0; i < this.sorted.length; i++) {
        var cur = this.sorted[i];
        var at = cur.at = cur.type == "open" ? cur.range.from : cur.range.to;
        var pos = i;
        while (pos > 0 && this.sorted[pos - 1].at.cmp(at) > 0) {
          this.sorted[pos] = this.sorted[pos - 1];
          this.sorted[--pos] = cur;
        }
      }
    }
  }]);

  return RangeSorter;
})();

var RangeStore = (function () {
  function RangeStore(pm) {
    _classCallCheck(this, RangeStore);

    this.pm = pm;
    this.ranges = [];
    this.sorted = new RangeSorter();
    this.resetDirty();
  }

  _createClass(RangeStore, [{
    key: "resetDirty",
    value: function resetDirty() {
      this.dirty = new _map.Map();
    }
  }, {
    key: "addRange",
    value: function addRange(range) {
      this.ranges.push(range);
      this.sorted.insert({ type: "open", at: range.from, range: range });
      this.sorted.insert({ type: "close", at: range.to, range: range });
      this.markDisplayDirty(range);
    }
  }, {
    key: "removeRange",
    value: function removeRange(range) {
      var found = this.ranges.indexOf(range);
      if (found > -1) {
        this.ranges.splice(found, 1);
        this.sorted.remove(range.from, range);
        this.sorted.remove(range.to, range);
        this.markDisplayDirty(range);
        range.clear();
      }
    }
  }, {
    key: "transform",
    value: function transform(mapping) {
      for (var i = 0; i < this.ranges.length; i++) {
        var range = this.ranges[i];
        range.from = mapping.map(range.from, range.options.inclusiveLeft ? -1 : 1).pos;
        range.to = mapping.map(range.to, range.options.inclusiveRight ? 1 : -1).pos;
        var diff = range.from.cmp(range.to);
        if (range.options.clearWhenEmpty !== false && diff >= 0) {
          this.removeRange(range);
          i--;
        } else if (diff > 0) {
          range.to = range.from;
        }
      }
      this.sorted.resort();
    }
  }, {
    key: "markDisplayDirty",
    value: function markDisplayDirty(range) {
      this.pm.ensureOperation();
      var dirty = this.dirty;
      var from = range.from,
          to = range.to;
      for (var depth = 0, node = this.pm.doc;; depth++) {
        var fromEnd = depth == from.depth,
            toEnd = depth == to.depth;
        if (!fromEnd && !toEnd && from.path[depth] == to.path[depth]) {
          var child = node.content[from.path[depth]];
          if (!dirty.has(child)) dirty.set(child, 1);
          node = child;
        } else {
          var start = fromEnd ? from.offset : from.path[depth];
          var end = toEnd ? to.offset : to.path[depth] + 1;
          if (node.type.block) {
            for (var offset = 0, i = 0; offset < end; i++) {
              var child = node.content[i];
              offset += child.size;
              if (offset > start) dirty.set(child, 2);
            }
          } else {
            for (var i = start; i < end; i++) {
              dirty.set(node.content[i], 2);
            }
          }
          break;
        }
      }
    }
  }, {
    key: "activeRangeTracker",
    value: function activeRangeTracker() {
      return new RangeTracker(this.sorted.sorted);
    }
  }]);

  return RangeStore;
})();

exports.RangeStore = RangeStore;

var RangeTracker = (function () {
  function RangeTracker(sorted) {
    _classCallCheck(this, RangeTracker);

    this.sorted = sorted;
    this.pos = 0;
    this.current = [];
  }

  _createClass(RangeTracker, [{
    key: "advanceTo",
    value: function advanceTo(pos) {
      var next = undefined;
      while (this.pos < this.sorted.length && (next = this.sorted[this.pos]).at.cmp(pos) <= 0) {
        var className = next.range.options.className;
        if (!className) continue;
        if (next.type == "open") this.current.push(className);else this.current.splice(this.current.indexOf(className), 1);
        this.pos++;
      }
    }
  }, {
    key: "nextChangeBefore",
    value: function nextChangeBefore(pos) {
      for (;;) {
        if (this.pos == this.sorted.length) return null;
        var next = this.sorted[this.pos];
        if (!next.range.options.className) this.pos++;else if (next.at.cmp(pos) >= 0) return null;else return next.at.offset;
      }
    }
  }]);

  return RangeTracker;
})();

},{"./event":14,"./map":20}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;_e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }return _arr;
  }return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
})();

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

exports.findByPath = findByPath;
exports.resolvePath = resolvePath;
exports.hasFocus = hasFocus;
exports.posAtCoords = posAtCoords;
exports.coordsAtPos = coordsAtPos;
exports.scrollIntoView = scrollIntoView;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _model = require("../model");

var _dom = require("../dom");

var Selection = (function () {
  function Selection(pm) {
    var _this = this;

    _classCallCheck(this, Selection);

    this.pm = pm;
    this.polling = null;
    this.lastAnchorNode = this.lastHeadNode = this.lastAnchorOffset = this.lastHeadOffset = null;
    var start = _model.Pos.start(pm.doc);
    this.range = new Range(start, start);
    pm.content.addEventListener("focus", function () {
      return _this.receivedFocus();
    });
  }

  _createClass(Selection, [{
    key: "setAndSignal",
    value: function setAndSignal(range, clearLast) {
      this.set(range, clearLast);
      this.pm.signal("selectionChange");
    }
  }, {
    key: "set",
    value: function set(range, clearLast) {
      this.range = range;
      if (clearLast !== false) this.lastAnchorNode = null;
    }
  }, {
    key: "poll",
    value: function poll(force) {
      if (this.pm.input.composing || !hasFocus(this.pm)) return;
      var sel = getSelection();
      if (force || sel.anchorNode != this.lastAnchorNode || sel.anchorOffset != this.lastAnchorOffset || sel.focusNode != this.lastHeadNode || sel.focusOffset != this.lastHeadOffset) {
        var _posFromDOM = posFromDOM(this.pm, sel.anchorNode, sel.anchorOffset, force);

        var anchor = _posFromDOM.pos;
        var anchorInline = _posFromDOM.inline;

        var _posFromDOM2 = posFromDOM(this.pm, sel.focusNode, sel.focusOffset, force);

        var head = _posFromDOM2.pos;
        var headInline = _posFromDOM2.inline;

        this.lastAnchorNode = sel.anchorNode;this.lastAnchorOffset = sel.anchorOffset;
        this.lastHeadNode = sel.focusNode;this.lastHeadOffset = sel.focusOffset;
        this.pm.sel.setAndSignal(new Range(anchorInline ? anchor : moveInline(this.pm.doc, anchor, this.range.anchor), headInline ? head : moveInline(this.pm.doc, head, this.range.head)), false);
        if (this.range.anchor.cmp(anchor) || this.range.head.cmp(head)) this.toDOM(true);
        return true;
      }
    }
  }, {
    key: "toDOM",
    value: function toDOM(force, takeFocus) {
      var sel = window.getSelection();
      if (!hasFocus(this.pm)) {
        if (!takeFocus) return;
        // See https://bugzilla.mozilla.org/show_bug.cgi?id=921444
        else if (_dom.browser.gecko) this.pm.content.focus();
      }
      if (!force && sel.anchorNode == this.lastAnchorNode && sel.anchorOffset == this.lastAnchorOffset && sel.focusNode == this.lastHeadNode && sel.focusOffset == this.lastHeadOffset) return;

      var range = document.createRange();
      var content = this.pm.content;
      var anchor = DOMFromPos(content, this.range.anchor);
      var head = DOMFromPos(content, this.range.head);

      if (sel.extend) {
        range.setEnd(anchor.node, anchor.offset);
        range.collapse();
      } else {
        if (this.range.anchor.cmp(this.range.head) > 0) {
          var tmp = anchor;anchor = head;head = tmp;
        }
        range.setEnd(head.node, head.offset);
        range.setStart(anchor.node, anchor.offset);
      }
      sel.removeAllRanges();
      sel.addRange(range);
      if (sel.extend) sel.extend(head.node, head.offset);

      this.lastAnchorNode = anchor.node;this.lastAnchorOffset = anchor.offset;
      this.lastHeadNode = head.node;this.lastHeadOffset = head.offset;
    }
  }, {
    key: "receivedFocus",
    value: function receivedFocus() {
      var _this2 = this;

      var poll = function poll() {
        if (document.activeElement == _this2.pm.content) {
          if (!_this2.pm.operation) _this2.poll();
          clearTimeout(_this2.polling);
          _this2.polling = setTimeout(poll, 50);
        }
      };
      this.polling = setTimeout(poll, 20);
    }
  }]);

  return Selection;
})();

exports.Selection = Selection;

function windowRect() {
  return { left: 0, right: window.innerWidth,
    top: 0, bottom: window.innerHeight };
}

var Range = (function () {
  function Range(anchor, head) {
    _classCallCheck(this, Range);

    this.anchor = anchor;
    this.head = head;
  }

  _createClass(Range, [{
    key: "inverted",
    get: function get() {
      return this.anchor.cmp(this.head) > 0;
    }
  }, {
    key: "from",
    get: function get() {
      return this.inverted ? this.head : this.anchor;
    }
  }, {
    key: "to",
    get: function get() {
      return this.inverted ? this.anchor : this.head;
    }
  }, {
    key: "empty",
    get: function get() {
      return this.anchor.cmp(this.head) == 0;
    }
  }]);

  return Range;
})();

exports.Range = Range;

function attr(node, name) {
  return node.nodeType == 1 && node.getAttribute(name);
}

function scanOffset(node, parent) {
  for (var scan = node ? node.previousSibling : parent.lastChild; scan; scan = scan.previousSibling) {
    var tag = undefined,
        range = undefined;
    if (tag = attr(scan, "pm-path")) return +tag + 1;else if (range = attr(scan, "pm-span")) return +/-(\d+)/.exec(range)[1];
  }
  return 0;
}

function posFromDOM(pm, node, domOffset, force) {
  if (!force && pm.operation && pm.doc != pm.operation.doc) throw new Error("Fetching a position from an outdated DOM structure");

  var path = [],
      inText = false,
      offset = null,
      inline = false,
      prev = undefined;

  if (node.nodeType == 3) {
    inText = true;
    prev = node;
    node = node.parentNode;
  } else {
    prev = node.childNodes[domOffset];
  }

  for (var cur = node; cur != pm.content; prev = cur, cur = cur.parentNode) {
    var tag = undefined,
        range = undefined;
    if (tag = cur.getAttribute("pm-path")) {
      path.unshift(+tag);
      if (offset == null) offset = scanOffset(prev, cur);
    } else if (range = cur.getAttribute("pm-span")) {
      var _dD$exec = /(\d+)-(\d+)/.exec(range);

      var _dD$exec2 = _slicedToArray(_dD$exec, 3);

      var _ = _dD$exec2[0];
      var from = _dD$exec2[1];
      var to = _dD$exec2[2];

      if (inText) offset = +from + domOffset;else offset = domOffset ? +to : +from;
      inline = true;
    } else if (inText && (tag = cur.getAttribute("pm-span-offset"))) {
      domOffset += +tag;
    }
  }
  if (offset == null) offset = scanOffset(prev, node);
  return { pos: new _model.Pos(path, offset), inline: inline };
}

function moveInline(doc, pos, from) {
  var dir = pos.cmp(from);
  var found = dir < 0 ? _model.Pos.before(doc, pos) : _model.Pos.after(doc, pos);
  if (!found) found = dir >= 0 ? _model.Pos.before(doc, pos) : _model.Pos.after(doc, pos);
  return found;
}

function findByPath(node, n, fromEnd) {
  for (var ch = fromEnd ? node.lastChild : node.firstChild; ch; ch = fromEnd ? ch.previousSibling : ch.nextSibling) {
    if (ch.nodeType != 1) continue;
    var path = ch.getAttribute("pm-path");
    if (!path) {
      var found = findByPath(ch, n);
      if (found) return found;
    } else if (+path == n) {
      return ch;
    }
  }
}

function resolvePath(parent, path) {
  var node = parent;
  for (var i = 0; i < path.length; i++) {
    node = findByPath(node, path[i]);
    if (!node) throw new Error("Failed to resolve path " + path.join("/"));
  }
  return node;
}

function findByOffset(node, offset) {
  function search(node, domOffset) {
    if (node.nodeType != 1) return;
    var range = node.getAttribute("pm-span");
    if (range) {
      var _dD$exec3 = /(\d+)-(\d+)/.exec(range);

      var _dD$exec32 = _slicedToArray(_dD$exec3, 3);

      var _ = _dD$exec32[0];
      var from = _dD$exec32[1];
      var to = _dD$exec32[2];

      if (+to >= offset) return { node: node, parent: node.parentNode, offset: domOffset,
        innerOffset: offset - +from };
    } else {
      for (var ch = node.firstChild, i = 0; ch; ch = ch.nextSibling, i++) {
        var result = search(ch, i);
        if (result) return result;
      }
    }
  }
  return search(node);
}

function leafAt(node, offset) {
  for (;;) {
    var child = node.firstChild;
    if (!child) return { node: node, offset: offset };
    if (child.nodeType != 1) return { node: child, offset: offset };
    if (child.hasAttribute("pm-span-offset")) {
      var nodeOffset = 0;
      for (;;) {
        var nextSib = child.nextSibling,
            nextOffset = undefined;
        if (!nextSib || (nextOffset = +nextSib.getAttribute("pm-span-offset")) >= offset) break;
        child = nextSib;
        nodeOffset = nextOffset;
      }
      offset -= nodeOffset;
    }
    node = child;
  }
}

function DOMFromPos(parent, pos) {
  var node = resolvePath(parent, pos.path);
  var found = findByOffset(node, pos.offset),
      inner = undefined;
  if (!found) return { node: node, offset: 0 };
  if (found.node.hasAttribute("pm-span-atom") || !(inner = leafAt(found.node, found.innerOffset))) return { node: found.parent, offset: found.offset + (found.innerOffset ? 1 : 0) };else return inner;
}

function hasFocus(pm) {
  var sel = window.getSelection();
  return sel.rangeCount && (0, _dom.contains)(pm.content, sel.anchorNode);
}

function posAtCoords(pm, coords) {
  var element = document.elementFromPoint(coords.left, coords.top + 1);
  if (!(0, _dom.contains)(pm.content, element)) return _model.Pos.start(pm.doc);

  var offset = undefined;
  if (element.childNodes.length == 1 && element.firstChild.nodeType == 3) {
    element = element.firstChild;
    offset = offsetInTextNode(element, coords);
  } else {
    offset = offsetInElement(element, coords);
  }

  var _posFromDOM3 = posFromDOM(pm, element, offset);

  var pos = _posFromDOM3.pos;
  var inline = _posFromDOM3.inline;

  return inline ? pos : moveInline(pm.doc, pos, pos);
}

function coordsAtPos(pm, pos) {
  var _DOMFromPos = DOMFromPos(pm.content, pos);

  var node = _DOMFromPos.node;
  var offset = _DOMFromPos.offset;

  var rect = undefined;
  if (node.nodeType == 3 && node.nodeValue) {
    var range = document.createRange();
    range.setEnd(node, offset ? offset : offset + 1);
    range.setStart(node, offset ? offset - 1 : offset);
    rect = range.getBoundingClientRect();
  } else if (node.nodeType == 1 && node.firstChild) {
    rect = node.childNodes[offset ? offset - 1 : offset].getBoundingClientRect();
    // BR nodes are likely to return a useless empty rectangle. Try
    // the node on the other side in that case.
    if (rect.left == rect.right && offset && offset < node.childNodes.length) {
      var otherRect = node.childNodes[offset].getBoundingClientRect();
      if (otherRect.left != otherRect.right) rect = { top: otherRect.top, bottom: otherRect.bottom, right: otherRect.left };
    }
  } else {
    rect = node.getBoundingClientRect();
  }
  var x = offset ? rect.right : rect.left;
  return { top: rect.top, bottom: rect.bottom, left: x, right: x };
}

var scrollMargin = 5;

function scrollIntoView(pm, pos) {
  if (!pos) pos = pm.sel.range.head;
  var coords = coordsAtPos(pm, pos);
  for (var _parent = pm.content;; _parent = _parent.parentNode) {
    var atBody = _parent == document.body;
    var rect = atBody ? windowRect() : _parent.getBoundingClientRect();
    if (coords.top < rect.top) _parent.scrollTop -= rect.top - coords.top + scrollMargin;else if (coords.bottom > rect.bottom) _parent.scrollTop += coords.bottom - rect.bottom + scrollMargin;
    if (coords.left < rect.left) _parent.scrollLeft -= rect.left - coords.left + scrollMargin;else if (coords.right > rect.right) _parent.scrollLeft += coords.right - rect.right + scrollMargin;
    if (atBody) break;
  }
}

function offsetInRects(coords, rects) {
  var y = coords.top;
  var x = coords.left;

  var minY = 1e5,
      minX = 1e5,
      offset = 0;
  for (var i = 0; i < rects.length; i++) {
    var rect = rects[i];
    if (!rect || rect.top == 0 && rect.bottom == 0) continue;
    var dY = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
    if (dY > minY) continue;
    if (dY < minY) {
      minY = dY;minX = 1e5;
    }
    var dX = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
    if (dX < minX) {
      minX = dX;
      offset = Math.abs(x - rect.left) < Math.abs(x - rect.right) ? i : i + 1;
    }
  }
  return offset;
}

function offsetInTextNode(text, coords) {
  var len = text.nodeValue.length;
  var range = document.createRange();
  var rects = [];
  for (var i = 0; i < len; i++) {
    range.setEnd(text, i + 1);
    range.setStart(text, i);
    rects.push(range.getBoundingClientRect());
  }
  return offsetInRects(coords, rects);
}

function offsetInElement(element, coords) {
  var rects = [];
  for (var child = element.firstChild; child; child = child.nextSibling) {
    rects.push(child.getBoundingClientRect());
  }return offsetInRects(coords, rects);
}

},{"../dom":7,"../model":27}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _model = require("../model");

var _edit = require("../edit");

var _inputrules = require("./inputrules");

(0, _edit.defineOption)("autoInput", false, function (pm, val, old) {
  if (val && !old) (0, _inputrules.addInputRules)(pm, rules);else if (!val && old) (0, _inputrules.removeInputRules)(pm, rules);
});

var rules = [new _inputrules.Rule("-", /--$/, "—"), new _inputrules.Rule('"', /\s(")$/, "“"), new _inputrules.Rule('"', /"$/, "”"), new _inputrules.Rule("'", /\s(')$/, "‘"), new _inputrules.Rule("'", /'$/, "’"), new _inputrules.Rule(" ", /^\s*> $/, function (pm, _, pos) {
  wrapAndJoin(pm, pos, "blockquote");
}), new _inputrules.Rule(" ", /^(\d+)\. $/, function (pm, match, pos) {
  var order = +match[1];
  wrapAndJoin(pm, pos, "ordered_list", { order: order || null, tight: true }, function (node) {
    return node.content.length + (node.attrs.order || 1) == order;
  });
}), new _inputrules.Rule(" ", /^\s*([-+*]) $/, function (pm, match, pos) {
  var bullet = match[1];
  wrapAndJoin(pm, pos, "bullet_list", { bullet: bullet, tight: true }, function (node) {
    return node.attrs.bullet == bullet;
  });
}), new _inputrules.Rule("`", /^```$/, function (pm, _, pos) {
  setAs(pm, pos, "code_block", { params: "" });
}), new _inputrules.Rule(" ", /^(#{1,6}) $/, function (pm, match, pos) {
  setAs(pm, pos, "heading", { level: match[1].length });
})];

exports.rules = rules;
function wrapAndJoin(pm, pos, type) {
  var attrs = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];
  var predicate = arguments.length <= 4 || arguments[4] === undefined ? null : arguments[4];

  var parentOffset = pos.path[pos.path.length - 1];
  var sibling = parentOffset > 0 && pm.doc.path(pos.shorten()).content[parentOffset - 1];
  var join = sibling && sibling.type.name == type && (!predicate || predicate(sibling));
  var tr = pm.tr.wrap(pos, pos, new _model.Node(type, attrs));
  var delPos = tr.map(pos).pos;
  tr["delete"](new _model.Pos(delPos.path, 0), delPos);
  if (join) tr.join(tr.map(pos, -1).pos);
  pm.apply(tr);
}

function setAs(pm, pos, type, attrs) {
  pm.apply(pm.tr.setBlockType(pos, pos, new _model.Node(type, attrs))["delete"](new _model.Pos(pos.path, 0), pos));
}

},{"../edit":16,"../model":27,"./inputrules":25}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

exports.addInputRules = addInputRules;
exports.removeInputRule = removeInputRule;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _model = require("../model");

function addInputRules(pm, rules) {
  if (!pm.mod.interpretInput) pm.mod.interpretInput = new InputRules(pm);
  pm.mod.interpretInput.addRules(rules);
}

function removeInputRule(pm, rules) {
  var ii = pm.mod.interpretInput;
  if (!ii) return;
  ii.removeRules(rules);
  if (ii.rules.length == 0) {
    ii.unregister();
    pm.mod.interpretInput = null;
  }
}

var Rule = function Rule(lastChar, match, handler) {
  _classCallCheck(this, Rule);

  this.lastChar = lastChar;
  this.match = match;
  this.handler = handler;
};

exports.Rule = Rule;

var InputRules = (function () {
  function InputRules(pm) {
    var _this = this;

    _classCallCheck(this, InputRules);

    this.pm = pm;
    this.rules = [];
    this.cancelVersion = null;

    pm.on("selectionChange", this.onSelChange = function () {
      return _this.cancelVersion = null;
    });
    pm.on("textInput", this.onTextInput = this.onTextInput.bind(this));
    pm.extendCommand("delBackward", "high", this.delBackward = this.delBackward.bind(this));
  }

  _createClass(InputRules, [{
    key: "unregister",
    value: function unregister() {
      this.pm.off("selectionChange", this.onSelChange);
      this.pm.off("textInput", this.onTextInput);
      this.pm.unextendCommand("delBackward", "high", this.delBackward);
    }
  }, {
    key: "addRules",
    value: function addRules(rules) {
      this.rules = this.rules.concat(rules);
    }
  }, {
    key: "removeRules",
    value: function removeRules(rules) {
      for (var i = 0; i < rules.length; i++) {
        var found = this.rules.indexOf(rules[i]);
        if (found > -1) this.rules.splice(found, 1);
      }
    }
  }, {
    key: "onTextInput",
    value: function onTextInput(text) {
      var pos = this.pm.selection.head;

      var textBefore = undefined,
          isCode = undefined;
      var lastCh = text[text.length - 1];

      for (var i = 0; i < this.rules.length; i++) {
        var rule = this.rules[i],
            match = undefined;
        if (rule.lastChar && rule.lastChar != lastCh) continue;
        if (textBefore == null) {
          ;
          var _getContext = getContext(this.pm.doc, pos);

          textBefore = _getContext.textBefore;
          isCode = _getContext.isCode;

          if (isCode) return;
        }
        if (match = rule.match.exec(textBefore)) {
          var startVersion = this.pm.history.getVersion();
          if (typeof rule.handler == "string") {
            var offset = pos.offset - (match[1] || match[0]).length;
            var start = new _model.Pos(pos.path, offset);
            var styles = (0, _model.spanStylesAt)(this.pm.doc, pos);
            this.pm.apply(this.pm.tr["delete"](start, pos).insert(start, _model.Span.text(rule.handler, styles)));
          } else {
            rule.handler(this.pm, match, pos);
          }
          this.cancelVersion = startVersion;
          return;
        }
      }
    }
  }, {
    key: "delBackward",
    value: function delBackward() {
      if (this.cancelVersion) {
        this.pm.history.backToVersion(this.cancelVersion);
        this.cancelVersion = null;
      } else {
        return false;
      }
    }
  }]);

  return InputRules;
})();

function getContext(doc, pos) {
  var parent = doc.path(pos.path);
  var isPlain = parent.type.plainText;
  var textBefore = "";
  for (var offset = 0, i = 0; offset < pos.offset;) {
    var child = parent.content[i++],
        size = child.size;
    textBefore += offset + size > pos.offset ? child.text.slice(0, pos.offset - offset) : child.text;
    if (offset + size >= pos.offset) {
      if (_model.style.contains(child.styles, _model.style.code)) isPlain = true;
      break;
    }
    offset += size;
  }
  return { textBefore: textBefore, isPlain: isPlain };
}

},{"../model":27}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findDiffStart = findDiffStart;
exports.findDiffEnd = findDiffEnd;

var _pos = require("./pos");

var _style = require("./style");

function findDiffStart(a, b) {
  var pathA = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
  var pathB = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

  var offset = 0;
  for (var i = 0;; i++) {
    if (i == a.content.length || i == b.content.length) {
      if (a.content.length == b.content.length) return null;
      break;
    }
    var childA = a.content[i],
        childB = b.content[i];
    if (childA == childB) {
      offset += a.type.block ? childA.text.length : 1;
      continue;
    }

    if (!childA.sameMarkup(childB)) break;

    if (a.type.block) {
      if (!(0, _style.sameSet)(childA.styles, childB.styles)) break;
      if (childA.text != childB.text) {
        for (var j = 0; childA.text[j] == childB.text[j]; j++) {
          offset++;
        }break;
      }
      offset += childA.text.length;
    } else {
      var inner = findDiffStart(childA, childB, pathA.concat(i), pathB.concat(i));
      if (inner) return inner;
      offset++;
    }
  }
  return { a: new _pos.Pos(pathA, offset), b: new _pos.Pos(pathB, offset) };
}

function findDiffEnd(a, b) {
  var pathA = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
  var pathB = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

  var iA = a.content.length,
      iB = b.content.length;
  var offset = 0;

  for (;; iA--, iB--) {
    if (iA == 0 || iB == 0) {
      if (iA == iB) return null;
      break;
    }
    var childA = a.content[iA - 1],
        childB = b.content[iB - 1];
    if (childA == childB) {
      offset += a.type.block ? childA.text.length : 1;
      continue;
    }

    if (!childA.sameMarkup(childB)) break;

    if (a.type.block) {
      if (!(0, _style.sameSet)(childA.styles, childB.styles)) break;

      if (childA.text != childB.text) {
        var same = 0,
            minSize = Math.min(childA.text.length, childB.text.length);
        while (same < minSize && childA.text[childA.text.length - same - 1] == childB.text[childB.text.length - same - 1]) {
          same++;
          offset++;
        }
        break;
      }
      offset += childA.text.length;
    } else {
      var inner = findDiffEnd(childA, childB, pathA.concat(iA - 1), pathB.concat(iB - 1));
      if (inner) return inner;
      offset++;
    }
  }
  return { a: new _pos.Pos(pathA, a.maxOffset - offset),
    b: new _pos.Pos(pathB, b.maxOffset - offset) };
}

},{"./pos":30,"./style":32}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
        value: true
});

function _interopRequireWildcard(obj) {
        if (obj && obj.__esModule) {
                return obj;
        } else {
                var newObj = {};if (obj != null) {
                        for (var key in obj) {
                                if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
                        }
                }newObj["default"] = obj;return newObj;
        }
}

var _style = require("./style");

var style = _interopRequireWildcard(_style);

var _node = require("./node");

Object.defineProperty(exports, "Node", {
        enumerable: true,
        get: function get() {
                return _node.Node;
        }
});
Object.defineProperty(exports, "Span", {
        enumerable: true,
        get: function get() {
                return _node.Span;
        }
});
Object.defineProperty(exports, "nodeTypes", {
        enumerable: true,
        get: function get() {
                return _node.nodeTypes;
        }
});
Object.defineProperty(exports, "NodeType", {
        enumerable: true,
        get: function get() {
                return _node.NodeType;
        }
});
Object.defineProperty(exports, "findConnection", {
        enumerable: true,
        get: function get() {
                return _node.findConnection;
        }
});

var _pos = require("./pos");

Object.defineProperty(exports, "Pos", {
        enumerable: true,
        get: function get() {
                return _pos.Pos;
        }
});
exports.style = style;

var _slice = require("./slice");

Object.defineProperty(exports, "sliceBefore", {
        enumerable: true,
        get: function get() {
                return _slice.sliceBefore;
        }
});
Object.defineProperty(exports, "sliceAfter", {
        enumerable: true,
        get: function get() {
                return _slice.sliceAfter;
        }
});
Object.defineProperty(exports, "sliceBetween", {
        enumerable: true,
        get: function get() {
                return _slice.sliceBetween;
        }
});

var _inline = require("./inline");

Object.defineProperty(exports, "stitchTextNodes", {
        enumerable: true,
        get: function get() {
                return _inline.stitchTextNodes;
        }
});
Object.defineProperty(exports, "clearMarkup", {
        enumerable: true,
        get: function get() {
                return _inline.clearMarkup;
        }
});
Object.defineProperty(exports, "spanAtOrBefore", {
        enumerable: true,
        get: function get() {
                return _inline.spanAtOrBefore;
        }
});
Object.defineProperty(exports, "getSpan", {
        enumerable: true,
        get: function get() {
                return _inline.getSpan;
        }
});
Object.defineProperty(exports, "spanStylesAt", {
        enumerable: true,
        get: function get() {
                return _inline.spanStylesAt;
        }
});
Object.defineProperty(exports, "rangeHasStyle", {
        enumerable: true,
        get: function get() {
                return _inline.rangeHasStyle;
        }
});
Object.defineProperty(exports, "splitSpansAt", {
        enumerable: true,
        get: function get() {
                return _inline.splitSpansAt;
        }
});

var _diff = require("./diff");

Object.defineProperty(exports, "findDiffStart", {
        enumerable: true,
        get: function get() {
                return _diff.findDiffStart;
        }
});
Object.defineProperty(exports, "findDiffEnd", {
        enumerable: true,
        get: function get() {
                return _diff.findDiffEnd;
        }
});

},{"./diff":26,"./inline":28,"./node":29,"./pos":30,"./slice":31,"./style":32}],28:[function(require,module,exports){
// Primitive operations on inline content

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stitchTextNodes = stitchTextNodes;
exports.clearMarkup = clearMarkup;
exports.getSpan = getSpan;
exports.spanAtOrBefore = spanAtOrBefore;
exports.spanStylesAt = spanStylesAt;
exports.rangeHasStyle = rangeHasStyle;
exports.splitSpansAt = splitSpansAt;

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj["default"] = obj;return newObj;
  }
}

var _node = require("./node");

var _style = require("./style");

var style = _interopRequireWildcard(_style);

function stitchTextNodes(node, at) {
  var before = undefined,
      after = undefined;
  if (at && node.content.length > at && (before = node.content[at - 1]).type == _node.nodeTypes.text && (after = node.content[at]).type == _node.nodeTypes.text && style.sameSet(before.styles, after.styles)) {
    var joined = _node.Span.text(before.text + after.text, before.styles);
    node.content.splice(at - 1, 2, joined);
    return true;
  }
}

function clearMarkup(node) {
  if (node.content.length > 1 || node.content[0].type != _node.nodeTypes.text || node.content[0].styles.length) {
    var text = "";
    for (var i = 0; i < node.content.length; i++) {
      var child = node.content[i];
      if (child.type == _node.nodeTypes.text) text += child.text;
    }
    node.content = [_node.Span.text(text)];
  }
}

function getSpan(doc, pos) {
  return spanAtOrBefore(doc.path(pos.path), pos.offset).node;
}

function spanAtOrBefore(parent, offset) {
  for (var i = 0; i < parent.content.length; i++) {
    var child = parent.content[i];
    offset -= child.size;
    if (offset <= 0) return { node: child, offset: i, innerOffset: offset + child.size };
  }
  return { node: null, offset: 0, innerOffset: 0 };
}

function spanStylesAt(doc, pos) {
  var _spanAtOrBefore = spanAtOrBefore(doc.path(pos.path), pos.offset);

  var node = _spanAtOrBefore.node;

  return node ? node.styles : _node.Node.empty;
}

function rangeHasStyle(doc, from, to, type) {
  function scan(_x, _x2, _x3, _x4, _x5) {
    var _left;

    var _again = true;

    _function: while (_again) {
      var node = _x,
          from = _x2,
          to = _x3,
          type = _x4,
          depth = _x5;
      start = end = i = offset = child = size = start = end = found = i = undefined;
      _again = false;

      if (node.type.block) {
        var start = from ? from.offset : 0;
        var end = to ? to.offset : 1e5;
        for (var i = 0, offset = 0; i < node.content.length; i++) {
          var child = node.content[i],
              size = child.text.length;
          if (offset < end && offset + size > start && style.containsType(child.styles, type)) return true;
          offset += size;
        }
      } else if (node.content.length) {
        var start = from ? from.path[depth] : 0;
        var end = to ? to.path[depth] : node.content.length - 1;
        if (start == end) {
          _x = node.content[start];
          _x2 = from;
          _x3 = to;
          _x4 = type;
          _x5 = depth + 1;
          _again = true;
          continue _function;
        } else {
          var found = scan(node.content[start], from, null, type, depth + 1);
          for (var i = start + 1; i < end && !found; i++) {
            found = scan(node.content[i], null, null, type, depth + 1);
          }
          if (_left = found) {
            return _left;
          }

          _x = node.content[end];
          _x2 = null;
          _x3 = to;
          _x4 = type;
          _x5 = depth + 1;
          _again = true;
          continue _function;
        }
      }
    }
  }
  return scan(doc, from, to, type, 0);
}

function splitSpansAt(parent, offset_) {
  var _spanAtOrBefore2 = spanAtOrBefore(parent, offset_);

  var node = _spanAtOrBefore2.node;
  var offset = _spanAtOrBefore2.offset;
  var innerOffset = _spanAtOrBefore2.innerOffset;

  if (innerOffset && innerOffset != node.size) {
    parent.content.splice(offset, 1, node.slice(0, innerOffset), node.slice(innerOffset));
    offset += 1;
  } else if (innerOffset) {
    offset += 1;
  }
  return { offset: offset, styles: node ? node.styles : _node.Node.empty };
}

},{"./node":29,"./style":32}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function get(_x6, _x7, _x8) {
  var _again = true;_function: while (_again) {
    var object = _x6,
        property = _x7,
        receiver = _x8;desc = parent = getter = undefined;_again = false;if (object === null) object = Function.prototype;var desc = Object.getOwnPropertyDescriptor(object, property);if (desc === undefined) {
      var parent = Object.getPrototypeOf(object);if (parent === null) {
        return undefined;
      } else {
        _x6 = parent;_x7 = property;_x8 = receiver;_again = true;continue _function;
      }
    } else if ("value" in desc) {
      return desc.value;
    } else {
      var getter = desc.get;if (getter === undefined) {
        return undefined;
      }return getter.call(receiver);
    }
  }
};

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

exports.findConnection = findConnection;

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Node = (function () {
  function Node(type, attrs, content) {
    if (attrs === undefined) attrs = null;

    _classCallCheck(this, Node);

    if (typeof type == "string") {
      var found = nodeTypes[type];
      if (!found) throw new Error("Unknown node type: " + type);
      type = found;
    }
    if (!(type instanceof NodeType)) throw new Error("Invalid node type: " + type);
    this.type = type;
    this.content = content || (type.contains ? [] : Node.empty);
    if (!attrs && !(attrs = type.defaultAttrs)) throw new Error("No default attributes for node type " + type.name);
    this.attrs = attrs || type.defaultAttrs;
  }

  _createClass(Node, [{
    key: "toString",
    value: function toString() {
      if (this.type.contains) return this.type.name + "(" + this.content.join(", ") + ")";else return this.type.name;
    }
  }, {
    key: "copy",
    value: function copy() {
      var content = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      return new Node(this.type, this.attrs, content);
    }
  }, {
    key: "push",
    value: function push(child) {
      if (this.type.contains != child.type.type) throw new Error("Can't insert " + child.type.name + " into " + this.type.name);
      this.content.push(child);
    }
  }, {
    key: "pushFrom",
    value: function pushFrom(other) {
      var start = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
      var end = arguments.length <= 2 || arguments[2] === undefined ? other.content.length : arguments[2];
      return (function () {
        for (var i = start; i < end; i++) {
          this.push(other.content[i]);
        }
      }).apply(this, arguments);
    }
  }, {
    key: "pushNodes",
    value: function pushNodes(array) {
      for (var i = 0; i < array.length; i++) {
        this.push(array[i]);
      }
    }
  }, {
    key: "slice",
    value: function slice(from) {
      var to = arguments.length <= 1 || arguments[1] === undefined ? this.maxOffset : arguments[1];

      if (from == to) return [];
      if (!this.type.block) return this.content.slice(from, to);
      var result = [];
      for (var i = 0, offset = 0;; i++) {
        var child = this.content[i],
            size = child.size,
            end = offset + size;
        if (offset + size > from) result.push(offset >= from && end <= to ? child : child.slice(Math.max(0, from - offset), Math.min(size, to - offset)));
        if (end >= to) return result;
        offset = end;
      }
    }
  }, {
    key: "remove",
    value: function remove(child) {
      var found = this.content.indexOf(child);
      if (found == -1) throw new Error("Child not found");
      this.content.splice(found, 1);
    }
  }, {
    key: "path",
    value: function path(_path) {
      for (var i = 0, node = this; i < _path.length; node = node.content[_path[i]], i++) {}
      return node;
    }
  }, {
    key: "isValidPos",
    value: function isValidPos(pos, requireInBlock) {
      for (var i = 0, node = this;; i++) {
        if (i == pos.path.length) {
          if (requireInBlock && !node.type.block) return false;
          return pos.offset <= node.maxOffset;
        } else {
          var n = pos.path[i];
          if (n >= node.content.length || node.type.block) return false;
          node = node.content[n];
        }
      }
    }
  }, {
    key: "pathNodes",
    value: function pathNodes(path) {
      var nodes = [];
      for (var i = 0, node = this;; i++) {
        nodes.push(node);
        if (i == path.length) break;
        node = node.content[path[i]];
      }
      return nodes;
    }
  }, {
    key: "sameMarkup",
    value: function sameMarkup(other) {
      return Node.compareMarkup(this.type, other.type, this.attrs, other.attrs);
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var obj = { type: this.type.name };
      if (this.content.length) obj.content = this.content.map(function (n) {
        return n.toJSON();
      });
      if (this.attrs != nullAttrs) obj.attrs = this.attrs;
      return obj;
    }
  }, {
    key: "size",
    get: function get() {
      var sum = 0;
      for (var i = 0; i < this.content.length; i++) {
        sum += this.content[i].size;
      }return sum;
    }
  }, {
    key: "maxOffset",
    get: function get() {
      return this.type.block ? this.size : this.content.length;
    }
  }, {
    key: "textContent",
    get: function get() {
      var text = "";
      for (var i = 0; i < this.content.length; i++) {
        text += this.content[i].textContent;
      }return text;
    }
  }], [{
    key: "compareMarkup",
    value: function compareMarkup(typeA, typeB, attrsA, attrsB) {
      if (typeA != typeB) return false;
      for (var prop in attrsA) if (attrsB[prop] !== attrsA[prop]) return false;
      return true;
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      var type = nodeTypes[json.type];
      if (type.type == "span") return Span.fromJSON(type, json);else return new Node(type, maybeNull(json.attrs), json.content ? json.content.map(function (n) {
        return Node.fromJSON(n);
      }) : Node.empty);
    }
  }]);

  return Node;
})();

exports.Node = Node;

Node.empty = []; // Reused empty array for collections that are guaranteed to remain empty

function maybeNull(obj) {
  if (!obj) return nullAttrs;
  for (var _prop in obj) {
    return obj;
  }return nullAttrs;
}

var Span = (function (_Node) {
  _inherits(Span, _Node);

  function Span(type, attrs, styles, text) {
    _classCallCheck(this, Span);

    _get(Object.getPrototypeOf(Span.prototype), "constructor", this).call(this, type, attrs);
    this.text = text == null ? "×" : text;
    this.styles = styles || Node.empty;
  }

  _createClass(Span, [{
    key: "toString",
    value: function toString() {
      if (this.type == nodeTypes.text) {
        var text = JSON.stringify(this.text);
        for (var i = 0; i < this.styles.length; i++) {
          text = this.styles[i].type + "(" + text + ")";
        }return text;
      } else {
        return _get(Object.getPrototypeOf(Span.prototype), "toString", this).call(this);
      }
    }
  }, {
    key: "slice",
    value: function slice(from) {
      var to = arguments.length <= 1 || arguments[1] === undefined ? this.text.length : arguments[1];

      return new Span(this.type, this.attrs, this.styles, this.text.slice(from, to));
    }
  }, {
    key: "copy",
    value: function copy() {
      throw new Error("Can't copy span nodes like this!");
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var obj = { type: this.type.name };
      if (this.attrs != nullAttrs) obj.attrs = this.attrs;
      if (this.text != "×") obj.text = this.text;
      if (this.styles.length) obj.styles = this.styles;
      return obj;
    }
  }, {
    key: "size",
    get: function get() {
      return this.text.length;
    }
  }, {
    key: "textContent",
    get: function get() {
      return this.text;
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(type, json) {
      return new Span(type, maybeNull(json.attrs), json.styles || Node.empty, json.text || "×");
    }
  }, {
    key: "text",
    value: function text(_text, styles) {
      return new Span(nodeTypes.text, null, styles, _text);
    }
  }]);

  return Span;
})(Node);

exports.Span = Span;

var nullAttrs = Node.nullAttrs = {};

var NodeType = function NodeType(options) {
  _classCallCheck(this, NodeType);

  this.name = options.name;
  this.type = options.type;
  this.contains = options.contains;
  this.block = this.contains == "span";
  this.defaultAttrs = options.defaultAttrs;
  if (this.defaultAttrs == null) this.defaultAttrs = nullAttrs;
  this.plainText = !!options.plainText;
};

exports.NodeType = NodeType;
var nodeTypes = {
  doc: new NodeType({ type: "doc", contains: "element" }),
  paragraph: new NodeType({ type: "element", contains: "span" }),
  blockquote: new NodeType({ type: "element", contains: "element" }),
  heading: new NodeType({ type: "element", contains: "span", defaultAttrs: false }),
  bullet_list: new NodeType({ type: "element", contains: "list_item", defaultAttrs: { bullet: "*", tight: true } }),
  ordered_list: new NodeType({ type: "element", contains: "list_item", defaultAttrs: { order: 1, tight: true } }),
  list_item: new NodeType({ type: "list_item", contains: "element" }),
  html_block: new NodeType({ type: "element", defaultAttrs: false }),
  code_block: new NodeType({ type: "element", contains: "span", defaultAttrs: { params: null }, plainText: true }),
  horizontal_rule: new NodeType({ type: "element" }),
  text: new NodeType({ type: "span" }),
  image: new NodeType({ type: "span", defaultAttrs: false }),
  hard_break: new NodeType({ type: "span" }),
  html_tag: new NodeType({ type: "span", defaultAttrs: false })
};

exports.nodeTypes = nodeTypes;
for (var _name in nodeTypes) {
  nodeTypes[_name].name = _name;
}
function findConnection(from, to) {
  if (from.contains == to.type) return [];

  var seen = Object.create(null);
  var active = [{ from: from, via: [] }];
  while (active.length) {
    var current = active.shift();
    for (var _name2 in nodeTypes) {
      var type = nodeTypes[_name2];
      if (current.from.contains == type.type && !(type.contains in seen)) {
        var via = current.via.concat(type);
        if (type.contains == to.type) return via;
        active.push({ from: type, via: via });
        seen[type.contains] = true;
      }
    }
  }
}

},{}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Pos = (function () {
  function Pos(path, offset) {
    _classCallCheck(this, Pos);

    this.path = path;
    this.offset = offset;
  }

  _createClass(Pos, [{
    key: "toString",
    value: function toString() {
      return this.path.join("/") + ":" + this.offset;
    }
  }, {
    key: "cmp",
    value: function cmp(other) {
      return Pos.cmp(this.path, this.offset, other.path, other.offset);
    }
  }, {
    key: "shorten",
    value: function shorten() {
      var to = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
      var offset = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      if (to == this.depth) return this;
      return Pos.shorten(this.path, to, offset);
    }
  }, {
    key: "shift",
    value: function shift(by) {
      return new Pos(this.path, this.offset + by);
    }
  }, {
    key: "offsetAt",
    value: function offsetAt(pos, offset) {
      var path = this.path.slice();
      path[pos] += offset;
      return new Pos(path, this.offset);
    }
  }, {
    key: "extend",
    value: function extend(pos) {
      var path = this.path.slice(),
          add = this.offset;
      for (var i = 0; i < pos.path.length; i++) {
        path.push(pos.path[i] + add);
        add = 0;
      }
      return new Pos(path, pos.offset + add);
    }
  }, {
    key: "depth",
    get: function get() {
      return this.path.length;
    }
  }], [{
    key: "cmp",
    value: function cmp(pathA, offsetA, pathB, offsetB) {
      var lenA = pathA.length,
          lenB = pathB.length;
      for (var i = 0, end = Math.min(lenA, lenB); i < end; i++) {
        var diff = pathA[i] - pathB[i];
        if (diff != 0) return diff;
      }
      if (lenA > lenB) return offsetB <= pathA[i] ? 1 : -1;else if (lenB > lenA) return offsetA <= pathB[i] ? -1 : 1;else return offsetA - offsetB;
    }
  }, {
    key: "samePath",
    value: function samePath(pathA, pathB) {
      if (pathA.length != pathB.length) return false;
      for (var i = 0; i < pathA.length; i++) {
        if (pathA[i] !== pathB[i]) return false;
      }return true;
    }
  }, {
    key: "shorten",
    value: function shorten(path) {
      var to = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
      var offset = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

      if (to == null) to = path.length - 1;
      return new Pos(path.slice(0, to), path[to] + offset);
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      return new Pos(json.path, json.offset);
    }
  }]);

  return Pos;
})();

exports.Pos = Pos;

function findLeft(node, path) {
  if (node.type.block) return new Pos(path, 0);
  for (var i = 0; i < node.content.length; i++) {
    path.push(i);
    var found = findLeft(node.content[i], path);
    if (found) return found;
    path.pop();
  }
}

function findAfter(node, pos, path) {
  if (node.type.block) return pos;
  var atEnd = path.length == pos.path.length;
  var start = atEnd ? pos.offset : pos.path[path.length];
  for (var i = start; i < node.content.length; i++) {
    path.push(i);
    var child = node.content[i];
    var found = i == start && !atEnd ? findAfter(child, pos, path) : findLeft(child, path);
    if (found) return found;
    path.pop();
  }
}

Pos.after = function (node, pos) {
  return findAfter(node, pos, []);
};
Pos.start = function (node) {
  return findLeft(node, []);
};

function findRight(node, path) {
  if (node.type.block) return new Pos(path, node.size);
  for (var i = node.content.length - 1; i >= 0; i--) {
    path.push(i);
    var found = findRight(node.content[i], path);
    if (found) return found;
    path.pop();
  }
}

function findBefore(node, pos, path) {
  if (node.type.block) return pos;
  var atEnd = pos.path.length == path.length;
  var end = atEnd ? pos.offset - 1 : pos.path[path.length];
  for (var i = end; i >= 0; i--) {
    path.push(i);
    var child = node.content[i];
    var found = i == end && !atEnd ? findBefore(child, pos, path) : findRight(child, path);
    if (found) return found;
    path.pop();
  }
}

Pos.before = function (node, pos) {
  return findBefore(node, pos, []);
};
Pos.end = function (node) {
  return findRight(node, []);
};

Pos.near = function (node, pos) {
  return Pos.after(node, pos) || Pos.before(node, pos);
};

},{}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sliceBefore = sliceBefore;
exports.sliceAfter = sliceAfter;
exports.sliceBetween = sliceBetween;

var _node = require("./node");

function copyInlineTo(node, offset, copy) {
  for (var left = offset, i = 0; left > 0; i++) {
    var chunk = node.content[i];
    if (chunk.text.length <= left) {
      left -= chunk.text.length;
      copy.push(chunk);
    } else {
      copy.push(chunk.slice(0, left));
      break;
    }
  }
}

function copyInlineFrom(node, offset, copy) {
  for (var before = offset, i = 0; i < node.content.length; i++) {
    var chunk = node.content[i];
    if (before == 0) {
      copy.push(chunk);
    } else if (chunk.text.length <= before) {
      before -= chunk.text.length;
    } else {
      copy.push(chunk.slice(before));
      before = 0;
    }
  }
}

function copyInlineBetween(node, from, to, copy) {
  if (from == to) return;

  for (var pos = 0, i = 0; pos < to; i++) {
    var chunk = node.content[i],
        size = chunk.text.length;
    if (pos < from) {
      if (pos + size > from) copy.push(chunk.slice(from - pos, Math.min(to - pos, size)));
    } else if (pos + size <= to) {
      copy.push(chunk);
    } else if (pos < to) {
      copy.push(chunk.slice(0, to - pos));
    }
    pos += size;
  }
}

function sliceBefore(node, pos) {
  var depth = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

  var copy = node.copy();
  if (depth < pos.depth) {
    var n = pos.path[depth];
    copy.pushFrom(node, 0, n);
    copy.push(sliceBefore(node.content[n], pos, depth + 1));
  } else if (node.type.contains != "span") {
    copy.pushFrom(node, 0, pos.offset);
  } else {
    copyInlineTo(node, pos.offset, copy);
  }
  return copy;
}

function sliceAfter(node, pos) {
  var depth = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

  var copy = node.copy();
  if (depth < pos.depth) {
    var n = pos.path[depth];
    copy.push(sliceAfter(node.content[n], pos, depth + 1));
    copy.pushFrom(node, n + 1);
  } else if (node.type.contains != "span") {
    copy.pushFrom(node, pos.offset);
  } else {
    copyInlineFrom(node, pos.offset, copy);
  }
  return copy;
}

function sliceBetween(node, from, to) {
  var collapse = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];
  var depth = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];

  if (depth < from.depth && depth < to.depth && from.path[depth] == to.path[depth]) {
    var inner = sliceBetween(node.content[from.path[depth]], from, to, collapse, depth + 1);
    if (!collapse) return node.copy([inner]);
    if (node.type.name != "doc") return inner;
    var conn = (0, _node.findConnection)(node.type, inner.type);
    for (var i = conn.length - 1; i >= 0; i--) {
      inner = new _node.Node(conn[i], null, [inner]);
    }return node.copy([inner]);
  } else {
    var copy = node.copy();
    if (depth == from.depth && depth == to.depth && node.type.block) {
      copyInlineBetween(node, from.offset, to.offset, copy);
    } else {
      var start = undefined;
      if (depth < from.depth) {
        start = from.path[depth] + 1;
        copy.push(sliceAfter(node.content[start - 1], from, depth + 1));
      } else {
        start = from.offset;
      }
      var end = depth < to.depth ? to.path[depth] : to.offset;
      copy.pushFrom(node, start, end);
      if (depth < to.depth) copy.push(sliceBefore(node.content[end], to, depth + 1));
    }
    return copy;
  }
}

},{"./node":29}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.link = link;
exports.add = add;
exports.remove = remove;
exports.removeType = removeType;
exports.sameSet = sameSet;
exports.same = same;
exports.contains = contains;
exports.containsType = containsType;
var code = { type: "code" };
exports.code = code;
var em = { type: "em" };
exports.em = em;
var strong = { type: "strong" };

exports.strong = strong;

function link(href, title) {
  return { type: "link", href: href, title: title || null };
}

var ordering = ["em", "strong", "link", "code"];

exports.ordering = ordering;

function add(styles, style) {
  var order = ordering.indexOf(style.type);
  for (var i = 0; i < styles.length; i++) {
    var other = styles[i];
    if (other.type == style.type) {
      if (same(other, style)) return styles;else return styles.slice(0, i).concat(style).concat(styles.slice(i + 1));
    }
    if (ordering.indexOf(other.type) > order) return styles.slice(0, i).concat(style).concat(styles.slice(i));
  }
  return styles.concat(style);
}

function remove(styles, style) {
  for (var i = 0; i < styles.length; i++) if (same(style, styles[i])) return styles.slice(0, i).concat(styles.slice(i + 1));
  return styles;
}

function removeType(styles, type) {
  for (var i = 0; i < styles.length; i++) if (styles[i].type == type) return styles.slice(0, i).concat(styles.slice(i + 1));
  return styles;
}

function sameSet(a, b) {
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (!same(a[i], b[i])) return false;
  }return true;
}

function same(a, b) {
  if (a == b) return true;
  for (var prop in a) {
    if (a[prop] != b[prop]) return false;
  }for (var prop in b) {
    if (a[prop] != b[prop]) return false;
  }return true;
}

function contains(set, style) {
  for (var i = 0; i < set.length; i++) {
    if (same(set[i], style)) return true;
  }return false;
}

function containsType(set, type) {
  for (var i = 0; i < set.length; i++) {
    if (set[i].type == type) return set[i];
  }return false;
}

},{}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.canLift = canLift;
exports.canWrap = canWrap;

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

var _tree = require("./tree");

var _map = require("./map");

(0, _step.defineStep)("ancestor", {
  apply: function apply(doc, step) {
    var from = step.from,
        to = step.to;
    if (!(0, _tree.isFlatRange)(from, to)) return null;
    var toParent = from.path,
        start = from.offset,
        end = to.offset;
    var depth = step.param.depth || 0,
        wrappers = step.param.wrappers || _model.Node.empty;
    if (!depth && wrappers.length == 0) return null;
    for (var i = 0; i < depth; i++) {
      if (start > 0 || end < doc.path(toParent).maxOffset || toParent.length == 0) return null;
      start = toParent[toParent.length - 1];
      end = start + 1;
      toParent = toParent.slice(0, toParent.length - 1);
    }
    var copy = (0, _tree.copyTo)(doc, toParent);
    var parent = copy.path(toParent),
        inner = copy.path(from.path);
    var parentSize = parent.content.length;
    if (wrappers.length) {
      var lastWrapper = wrappers[wrappers.length - 1];
      if (parent.type.contains != wrappers[0].type.type || lastWrapper.type.contains != inner.type.contains || lastWrapper.type.plainText && !(0, _tree.isPlainText)(inner)) return null;
      var node = null;
      for (var i = wrappers.length - 1; i >= 0; i--) {
        node = wrappers[i].copy(node ? [node] : inner.content.slice(from.offset, to.offset));
      }parent.content.splice(start, end - start, node);
    } else {
      if (parent.type.contains != inner.type.contains) return null;
      parent.content = parent.content.slice(0, start).concat(inner.content).concat(parent.content.slice(end));
    }

    var toInner = toParent.slice();
    for (var i = 0; i < wrappers.length; i++) {
      toInner.push(i ? 0 : start);
    }var startOfInner = new _model.Pos(toInner, wrappers.length ? 0 : start);
    var replaced = null;
    var insertedSize = wrappers.length ? 1 : to.offset - from.offset;
    if (depth != wrappers.length || depth > 1 || wrappers.length > 1) {
      var posBefore = new _model.Pos(toParent, start);
      var posAfter1 = new _model.Pos(toParent, end),
          posAfter2 = new _model.Pos(toParent, start + insertedSize);
      var endOfInner = new _model.Pos(toInner, startOfInner.offset + (to.offset - from.offset));
      replaced = [new _map.ReplacedRange(posBefore, from, posBefore, startOfInner), new _map.ReplacedRange(to, posAfter1, endOfInner, posAfter2, posAfter1, posAfter2)];
    }
    var moved = [new _map.MovedRange(from, to.offset - from.offset, startOfInner)];
    if (end - start != insertedSize) moved.push(new _map.MovedRange(new _model.Pos(toParent, end), parentSize - end, new _model.Pos(toParent, start + insertedSize)));
    return new _transform.TransformResult(copy, new _map.PosMap(moved, replaced));
  },
  invert: function invert(step, oldDoc, map) {
    var wrappers = [];
    if (step.param.depth) for (var i = 0; i < step.param.depth; i++) {
      var _parent = oldDoc.path(step.from.path.slice(0, step.from.path.length - i));
      wrappers.unshift(_parent.copy());
    }
    var newFrom = map.map(step.from).pos;
    var newTo = step.from.cmp(step.to) ? map.map(step.to, -1).pos : newFrom;
    return new _step.Step("ancestor", newFrom, newTo, null, { depth: step.param.wrappers ? step.param.wrappers.length : 0,
      wrappers: wrappers });
  },
  paramToJSON: function paramToJSON(param) {
    return { depth: param.depth,
      wrappers: param.wrappers && param.wrappers.map(function (n) {
        return n.toJSON();
      }) };
  },
  paramFromJSON: function paramFromJSON(json) {
    return { depth: json.depth,
      wrappers: json.wrappers && json.wrappers.map(_model.Node.fromJSON) };
  }
});

function canUnwrap(container, from, to) {
  var type = container.content[from].type.contains;
  for (var i = from + 1; i < to; i++) {
    if (container.content[i].type.contains != type) return false;
  }return type;
}

function canBeLifted(doc, range) {
  var container = doc.path(range.path);
  var parentDepth = undefined,
      unwrap = false,
      innerType = container.type.contains;
  for (;;) {
    parentDepth = -1;
    for (var node = doc, i = 0; i < range.path.length; i++) {
      if (node.type.contains == innerType) parentDepth = i;
      node = node.content[range.path[i]];
    }
    if (parentDepth > -1) return { path: range.path.slice(0, parentDepth),
      unwrap: unwrap };
    if (unwrap || !(innerType = canUnwrap(container, range.from, range.to))) return null;
    unwrap = true;
  }
}

function canLift(doc, from, to) {
  var range = (0, _tree.selectedSiblings)(doc, from, to || from);
  var found = canBeLifted(doc, range);
  if (found) return { found: found, range: range };
}

_transform.Transform.prototype.lift = function (from) {
  var to = arguments.length <= 1 || arguments[1] === undefined ? from : arguments[1];
  return (function () {
    var can = canLift(this.doc, from, to);
    if (!can) return this;
    var found = can.found;
    var range = can.range;

    var depth = range.path.length - found.path.length;
    var rangeNode = found.unwrap && this.doc.path(range.path);

    for (var d = 0, pos = new _model.Pos(range.path, range.to);; d++) {
      if (pos.offset < this.doc.path(pos.path).content.length) {
        this.split(pos, depth);
        break;
      }
      if (d == depth - 1) break;
      pos = pos.shorten(null, 1);
    }
    for (var d = 0, pos = new _model.Pos(range.path, range.from);; d++) {
      if (pos.offset > 0) {
        this.split(pos, depth - d);
        var cut = range.path.length - depth,
            path = pos.path.slice(0, cut).concat(pos.path[cut] + 1);
        while (path.length < range.path.length) path.push(0);
        range = { path: path, from: 0, to: range.to - range.from };
        break;
      }
      if (d == depth - 1) break;
      pos = pos.shorten();
    }
    if (found.unwrap) {
      for (var i = range.to - 1; i > range.from; i--) {
        this.join(new _model.Pos(range.path, i));
      }var size = 0;
      for (var i = range.from; i < range.to; i++) {
        size += rangeNode.content[i].content.length;
      }range = { path: range.path.concat(range.from), from: 0, to: size };
      ++depth;
    }
    this.step("ancestor", new _model.Pos(range.path, range.from), new _model.Pos(range.path, range.to), null, { depth: depth });
    return this;
  }).apply(this, arguments);
};

function canWrap(doc, from, to, node) {
  var range = (0, _tree.selectedSiblings)(doc, from, to || from);
  if (range.from == range.to) return null;
  var parent = doc.path(range.path);
  var around = (0, _model.findConnection)(parent.type, node.type);
  var inside = (0, _model.findConnection)(node.type, parent.content[range.from].type);
  if (around && inside) return { range: range, around: around, inside: inside };
}

_transform.Transform.prototype.wrap = function (from, to, node) {
  var can = canWrap(this.doc, from, to, node);
  if (!can) return this;
  var range = can.range;
  var around = can.around;
  var inside = can.inside;

  var wrappers = around.map(function (t) {
    return new _model.Node(t);
  }).concat(node).concat(inside.map(function (t) {
    return new _model.Node(t);
  }));
  this.step("ancestor", new _model.Pos(range.path, range.from), new _model.Pos(range.path, range.to), null, { wrappers: wrappers });
  if (inside.length) {
    var toInner = range.path.slice();
    for (var i = 0; i < around.length + inside.length + 1; i++) {
      toInner.push(i ? 0 : range.from);
    }for (var i = range.to - 1 - range.from; i > 0; i--) {
      this.split(new _model.Pos(toInner, i), inside.length);
    }
  }
  return this;
};

_transform.Transform.prototype.setBlockType = function (from, to, wrapNode) {
  var _this = this;

  (0, _tree.blocksBetween)(this.doc, from, to || from, function (node, path) {
    path = path.slice();
    if (wrapNode.type.plainText && !(0, _tree.isPlainText)(node)) _this.clearMarkup(new _model.Pos(path, 0), new _model.Pos(path, node.size));
    _this.step("ancestor", new _model.Pos(path, 0), new _model.Pos(path, node.size), null, { depth: 1, wrappers: [wrapNode] });
  });
  return this;
};

},{"../model":27,"./map":36,"./step":39,"./transform":41,"./tree":42}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

require("./style");

require("./split");

require("./replace");

var _transform = require("./transform");

Object.defineProperty(exports, "Result", {
  enumerable: true,
  get: function get() {
    return _transform.Result;
  }
});
Object.defineProperty(exports, "Transform", {
  enumerable: true,
  get: function get() {
    return _transform.Transform;
  }
});

var _step = require("./step");

Object.defineProperty(exports, "Step", {
  enumerable: true,
  get: function get() {
    return _step.Step;
  }
});
Object.defineProperty(exports, "applyStep", {
  enumerable: true,
  get: function get() {
    return _step.applyStep;
  }
});
Object.defineProperty(exports, "invertStep", {
  enumerable: true,
  get: function get() {
    return _step.invertStep;
  }
});

var _ancestor = require("./ancestor");

Object.defineProperty(exports, "canLift", {
  enumerable: true,
  get: function get() {
    return _ancestor.canLift;
  }
});
Object.defineProperty(exports, "canWrap", {
  enumerable: true,
  get: function get() {
    return _ancestor.canWrap;
  }
});

var _join = require("./join");

Object.defineProperty(exports, "joinPoint", {
  enumerable: true,
  get: function get() {
    return _join.joinPoint;
  }
});

var _map = require("./map");

Object.defineProperty(exports, "MapResult", {
  enumerable: true,
  get: function get() {
    return _map.MapResult;
  }
});
Object.defineProperty(exports, "mapStep", {
  enumerable: true,
  get: function get() {
    return _map.mapStep;
  }
});
Object.defineProperty(exports, "Remapping", {
  enumerable: true,
  get: function get() {
    return _map.Remapping;
  }
});

},{"./ancestor":33,"./join":35,"./map":36,"./replace":37,"./split":38,"./step":39,"./style":40,"./transform":41}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.joinPoint = joinPoint;

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

var _tree = require("./tree");

var _map = require("./map");

(0, _step.defineStep)("join", {
  apply: function apply(doc, step) {
    var before = doc.path(step.from.path);
    var after = doc.path(step.to.path);
    if (step.from.offset < before.maxOffset || step.to.offset > 0 || before.type.contains != after.type.contains) return null;
    var pFrom = step.from.path,
        pTo = step.to.path;
    var last = pFrom.length - 1,
        offset = pFrom[last] + 1;
    if (pFrom.length != pTo.length || pFrom.length == 0 || offset != pTo[last]) return null;
    for (var i = 0; i < last; i++) {
      if (pFrom[i] != pTo[i]) return null;
    }var targetPath = pFrom.slice(0, last);
    var copy = (0, _tree.copyTo)(doc, targetPath);
    var target = copy.path(targetPath),
        oldSize = target.content.length;
    var joined = new _model.Node(before.type, before.attrs, before.content.concat(after.content));
    if (joined.type.block) (0, _model.stitchTextNodes)(joined, before.content.length);
    target.content.splice(offset - 1, 2, joined);

    var map = new _map.PosMap([new _map.MovedRange(step.to, after.maxOffset, step.from), new _map.MovedRange(new _model.Pos(targetPath, offset + 1), oldSize - offset - 1, new _model.Pos(targetPath, offset))], [new _map.ReplacedRange(step.from, step.to, step.from, step.from, step.to.shorten())]);
    return new _transform.TransformResult(copy, map);
  },
  invert: function invert(step, oldDoc) {
    return new _step.Step("split", null, null, step.from, oldDoc.path(step.to.path).copy());
  }
});

function joinPoint(doc, pos) {
  var dir = arguments.length <= 2 || arguments[2] === undefined ? -1 : arguments[2];

  var joinDepth = -1;
  for (var i = 0, _parent = doc; i < pos.path.length; i++) {
    var index = pos.path[i];
    var type = _parent.content[index].type;
    if (!type.block && (dir == -1 ? index > 0 && _parent.content[index - 1].type == type : index < _parent.content.length - 1 && _parent.content[index + 1].type == type)) joinDepth = i;
    _parent = _parent.content[index];
  }
  if (joinDepth > -1) return pos.shorten(joinDepth, dir == -1 ? 0 : 1);
}

_transform.Transform.prototype.join = function (at) {
  var parent = this.doc.path(at.path);
  if (at.offset == 0 || at.offset == parent.content.length || parent.type.block) return this;
  this.step("join", new _model.Pos(at.path.concat(at.offset - 1), parent.content[at.offset - 1].maxOffset), new _model.Pos(at.path.concat(at.offset), 0));
  return this;
};

},{"../model":27,"./map":36,"./step":39,"./transform":41,"./tree":42}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

exports.mapStep = mapStep;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _model = require("../model");

var _step = require("./step");

var MovedRange = (function () {
  function MovedRange(start, size) {
    var dest = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

    _classCallCheck(this, MovedRange);

    this.start = start;
    this.size = size;
    this.dest = dest;
  }

  _createClass(MovedRange, [{
    key: "toString",
    value: function toString() {
      return "[moved " + this.start + "+" + this.size + " to " + this.dest + "]";
    }
  }, {
    key: "end",
    get: function get() {
      return new _model.Pos(this.start.path, this.start.offset + this.size);
    }
  }]);

  return MovedRange;
})();

exports.MovedRange = MovedRange;

var Side = function Side(from, to, ref) {
  _classCallCheck(this, Side);

  this.from = from;
  this.to = to;
  this.ref = ref;
};

var ReplacedRange = (function () {
  function ReplacedRange(from, to, newFrom, newTo) {
    var ref = arguments.length <= 4 || arguments[4] === undefined ? from : arguments[4];
    var newRef = arguments.length <= 5 || arguments[5] === undefined ? newFrom : arguments[5];
    return (function () {
      _classCallCheck(this, ReplacedRange);

      this.before = new Side(from, to, ref);
      this.after = new Side(newFrom, newTo, newRef);
    }).apply(this, arguments);
  }

  _createClass(ReplacedRange, [{
    key: "toString",
    value: function toString() {
      return "[replaced " + this.before.from + "-" + this.before.to + " with " + this.after.from + "-" + this.after.to + "]";
    }
  }]);

  return ReplacedRange;
})();

exports.ReplacedRange = ReplacedRange;

var empty = [];

var MapResult = function MapResult(pos) {
  var deleted = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
  var recover = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  _classCallCheck(this, MapResult);

  this.pos = pos;
  this.deleted = deleted;
  this.recover = recover;
};

exports.MapResult = MapResult;

function offsetFrom(base, pos) {
  if (pos.path.length > base.path.length) {
    var path = [pos.path[base.path.length] - base.offset];
    for (var i = base.path.length + 1; i < pos.path.length; i++) {
      path.push(pos.path[i]);
    }return new _model.Pos(path, pos.offset);
  } else {
    return new _model.Pos([], pos.offset - base.offset);
  }
}

function mapThrough(map, pos, bias, back) {
  if (bias === undefined) bias = 1;

  for (var i = 0; i < map.replaced.length; i++) {
    var range = map.replaced[i],
        side = back ? range.after : range.before;
    var left = undefined,
        right = undefined;
    if ((left = pos.cmp(side.from)) >= 0 && (right = pos.cmp(side.to)) <= 0) {
      var other = back ? range.before : range.after;
      return new MapResult(bias < 0 ? other.from : other.to, !!(left && right), { rangeID: i, offset: offsetFrom(side.ref, pos) });
    }
  }

  for (var i = 0; i < map.moved.length; i++) {
    var range = map.moved[i];
    var start = back ? range.dest : range.start;
    if (pos.cmp(start) >= 0 && _model.Pos.cmp(pos.path, pos.offset, start.path, start.offset + range.size) <= 0) {
      var dest = back ? range.start : range.dest;
      var depth = start.depth;
      if (pos.depth > depth) {
        var offset = dest.offset + (pos.path[depth] - start.offset);
        return new MapResult(new _model.Pos(dest.path.concat(offset).concat(pos.path.slice(depth + 1)), pos.offset));
      } else {
        return new MapResult(new _model.Pos(dest.path, dest.offset + (pos.offset - start.offset)));
      }
    }
  }

  return new MapResult(pos);
}

var PosMap = (function () {
  function PosMap(moved, replaced) {
    _classCallCheck(this, PosMap);

    this.moved = moved || empty;
    this.replaced = replaced || empty;
  }

  _createClass(PosMap, [{
    key: "recover",
    value: function recover(offset) {
      return this.replaced[offset.rangeID].after.ref.extend(offset.offset);
    }
  }, {
    key: "map",
    value: function map(pos, bias) {
      return mapThrough(this, pos, bias, false);
    }
  }, {
    key: "invert",
    value: function invert() {
      return new InvertedPosMap(this);
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.moved.concat(this.replaced).join(" ");
    }
  }]);

  return PosMap;
})();

exports.PosMap = PosMap;

var InvertedPosMap = (function () {
  function InvertedPosMap(map) {
    _classCallCheck(this, InvertedPosMap);

    this.inner = map;
  }

  _createClass(InvertedPosMap, [{
    key: "recover",
    value: function recover(offset) {
      return this.inner.replaced[offset.rangeID].before.ref.extend(offset.offset);
    }
  }, {
    key: "map",
    value: function map(pos, bias) {
      return mapThrough(this.inner, pos, bias, true);
    }
  }, {
    key: "invert",
    value: function invert() {
      return this.inner;
    }
  }, {
    key: "toString",
    value: function toString() {
      return "-" + this.inner;
    }
  }]);

  return InvertedPosMap;
})();

var nullMap = new PosMap();

exports.nullMap = nullMap;

var Remapping = (function () {
  function Remapping() {
    var head = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
    var tail = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
    var mirror = arguments.length <= 2 || arguments[2] === undefined ? Object.create(null) : arguments[2];

    _classCallCheck(this, Remapping);

    this.head = head;
    this.tail = tail;
    this.mirror = mirror;
  }

  _createClass(Remapping, [{
    key: "addToFront",
    value: function addToFront(map, corr) {
      this.head.push(map);
      var id = -this.head.length;
      if (corr != null) this.mirror[id] = corr;
      return id;
    }
  }, {
    key: "addToBack",
    value: function addToBack(map, corr) {
      this.tail.push(map);
      var id = this.tail.length - 1;
      if (corr != null) this.mirror[corr] = id;
      return id;
    }
  }, {
    key: "get",
    value: function get(id) {
      return id < 0 ? this.head[-id - 1] : this.tail[id];
    }
  }, {
    key: "map",
    value: function map(pos, bias) {
      var deleted = false;

      for (var i = -this.head.length; i < this.tail.length; i++) {
        var map = this.get(i);
        var result = map.map(pos, bias);
        if (result.recover) {
          var corr = this.mirror[i];
          if (corr != null) {
            i = corr;
            pos = this.get(corr).recover(result.recover);
            continue;
          }
        }
        if (result.deleted) deleted = true;
        pos = result.pos;
      }

      return new MapResult(pos, deleted);
    }
  }]);

  return Remapping;
})();

exports.Remapping = Remapping;

function maxPos(a, b) {
  return a.cmp(b) > 0 ? a : b;
}

function mapStep(step, remapping) {
  var allDeleted = true;
  var from = null,
      to = null,
      pos = null;

  if (step.from) {
    var result = remapping.map(step.from, 1);
    from = result.pos;
    if (!result.deleted) allDeleted = false;
  }
  if (step.to) {
    if (step.to.cmp(step.from) == 0) {
      to = from;
    } else {
      var result = remapping.map(step.to, -1);
      to = maxPos(result.pos, from);
      if (!result.deleted) allDeleted = false;
    }
  }
  if (step.pos) {
    if (from && step.pos.cmp(step.from) == 0) {
      pos = from;
    } else if (to && step.pos.cmp(step.to) == 0) {
      pos = to;
    } else {
      var result = remapping.map(step.pos, 1);
      pos = result.pos;
      if (!result.deleted) allDeleted = false;
    }
  }
  if (!allDeleted) return new _step.Step(step.name, from, to, pos, step.param);
}

},{"../model":27,"./step":39}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.replace = replace;

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

var _map = require("./map");

var _tree = require("./tree");

function sizeBefore(node, at) {
  if (node.type.block) {
    var size = 0;
    for (var i = 0; i < at; i++) {
      size += node.content[i].size;
    }return size;
  } else {
    return at;
  }
}

function replace(doc, from, to, root, repl) {
  var origParent = doc.path(root);
  if (repl.nodes.length && repl.nodes[0].type.type != origParent.type.contains) return null;

  var copy = (0, _tree.copyTo)(doc, root);
  var parent = copy.path(root);
  parent.content.length = 0;
  var depth = root.length;

  var fromEnd = depth == from.depth;
  var start = fromEnd ? from.offset : from.path[depth];
  parent.pushNodes(origParent.slice(0, start));
  if (!fromEnd) {
    parent.push((0, _model.sliceBefore)(origParent.content[start], from, depth + 1));
    ++start;
  } else {
    start = parent.content.length;
  }
  parent.pushNodes(repl.nodes);
  var end = undefined;
  if (depth == to.depth) {
    end = to.offset;
  } else {
    var n = to.path[depth];
    parent.push((0, _model.sliceAfter)(origParent.content[n], to, depth + 1));
    end = n + 1;
  }
  parent.pushNodes(origParent.slice(end));

  var moved = [];

  var rightEdge = start + repl.nodes.length,
      startLen = parent.content.length;
  if (repl.nodes.length) mendLeft(parent, start, depth, repl.openLeft);
  mendRight(parent, rightEdge + (parent.content.length - startLen), root, repl.nodes.length ? repl.openRight : from.depth - depth);

  function mendLeft(node, at, depth, open) {
    if (node.type.block) return (0, _model.stitchTextNodes)(node, at);

    if (open == 0 || depth == from.depth || at == 0 || at == node.content.length) return;

    var before = node.content[at - 1],
        after = node.content[at];
    if (before.sameMarkup(after)) {
      var oldSize = before.content.length;
      before.pushFrom(after);
      node.content.splice(at, 1);
      mendLeft(before, oldSize, depth + 1, open - 1);
    }
  }

  function addMoved(start, size, dest) {
    if (start.cmp(dest)) moved.push(new _map.MovedRange(start, size, dest));
  }

  function mendRight(node, at, path, open) {
    var toEnd = path.length == to.depth;
    var after = node.content[at],
        before = undefined;

    var sBefore = toEnd ? sizeBefore(node, at) : at + 1;
    var movedStart = toEnd ? to : to.shorten(path.length, 1);
    var movedSize = node.maxOffset - sBefore;

    if (!toEnd && open > 0 && (before = node.content[at - 1]).sameMarkup(after)) {
      after.content = before.content.concat(after.content);
      node.content.splice(at - 1, 1);
      addMoved(movedStart, movedSize, new _model.Pos(path, sBefore - 1));
      mendRight(after, before.content.length, path.concat(at - 1), open - 1);
    } else {
      if (node.type.block) (0, _model.stitchTextNodes)(node, at);
      addMoved(movedStart, movedSize, new _model.Pos(path, sBefore));
      if (!toEnd) mendRight(after, 0, path.concat(at), 0);
    }
  }

  return { doc: copy, moved: moved };
}

var nullRepl = { nodes: [], openLeft: 0, openRight: 0 };

(0, _step.defineStep)("replace", {
  apply: function apply(doc, step) {
    var rootPos = step.pos,
        root = rootPos.path;
    if (step.from.depth < root.length || step.to.depth < root.length) return null;
    for (var i = 0; i < root.length; i++) {
      if (step.from.path[i] != root[i] || step.to.path[i] != root[i]) return null;
    }var result = replace(doc, step.from, step.to, rootPos.path, step.param || nullRepl);
    if (!result) return null;
    var out = result.doc;
    var moved = result.moved;

    var end = moved.length ? moved[moved.length - 1].dest : step.to;
    var replaced = new _map.ReplacedRange(step.from, step.to, step.from, end, rootPos, rootPos);
    return new _transform.TransformResult(out, new _map.PosMap(moved, [replaced]));
  },
  invert: function invert(step, oldDoc, map) {
    var depth = step.pos.depth;
    var between = (0, _model.sliceBetween)(oldDoc, step.from, step.to, false);
    for (var i = 0; i < depth; i++) {
      between = between.content[0];
    }return new _step.Step("replace", step.from, map.map(step.to).pos, step.from.shorten(depth), {
      nodes: between.content,
      openLeft: step.from.depth - depth,
      openRight: step.to.depth - depth
    });
  },
  paramToJSON: function paramToJSON(param) {
    return param && { nodes: param.nodes && param.nodes.map(function (n) {
        return n.toJSON();
      }),
      openLeft: param.openLeft, openRight: param.openRight };
  },
  paramFromJSON: function paramFromJSON(json) {
    return json && { nodes: json.nodes && json.nodes.map(_model.Node.fromJSON),
      openLeft: json.openLeft, openRight: json.openRight };
  }
});

function buildInserted(nodesLeft, source, start, end) {
  var sliced = (0, _model.sliceBetween)(source, start, end, false);
  var nodesRight = [];
  for (var node = sliced, i = 0; i <= start.path.length; i++, node = node.content[0]) {
    nodesRight.push(node);
  }var same = (0, _tree.samePathDepth)(start, end);
  var searchLeft = nodesLeft.length - 1,
      searchRight = nodesRight.length - 1;
  var result = null;

  var inner = nodesRight[searchRight];
  if (inner.type.block && inner.size && nodesLeft[searchLeft].type.block) {
    result = nodesLeft[searchLeft--].copy(inner.content);
    nodesRight[--searchRight].content.shift();
  }

  for (;;) {
    var node = nodesRight[searchRight],
        type = node.type,
        matched = null;
    var outside = searchRight <= same;
    for (var i = searchLeft; i >= 0; i--) {
      var left = nodesLeft[i];
      if (outside ? left.type.contains == type.contains : left.type == type) {
        matched = i;
        break;
      }
    }
    if (matched != null) {
      if (!result) {
        result = nodesLeft[matched].copy(node.content);
        searchLeft = matched - 1;
      } else {
        while (searchLeft >= matched) result = nodesLeft[searchLeft--].copy([result]);
        result.pushFrom(node);
      }
    }
    if (matched != null || node.content.length == 0) {
      if (outside) break;
      if (searchRight) nodesRight[searchRight - 1].content.shift();
    }
    searchRight--;
  }

  var repl = { nodes: result ? result.content : [],
    openLeft: start.depth - searchRight,
    openRight: end.depth - searchRight };
  return { repl: repl, depth: searchLeft + 1 };
}

function moveText(tr, doc, before, after) {
  var root = (0, _tree.samePathDepth)(before, after);
  var cutAt = after.shorten(null, 1);
  while (cutAt.path.length > root && doc.path(cutAt.path).content.length == 1) cutAt = cutAt.shorten(null, 1);
  tr.split(cutAt, cutAt.path.length - root);
  var start = after,
      end = new _model.Pos(start.path, doc.path(start.path).maxOffset);
  var parent = doc.path(start.path.slice(0, root));
  var wanted = parent.pathNodes(before.path.slice(root));
  var existing = parent.pathNodes(start.path.slice(root));
  while (wanted.length && existing.length && wanted[0].sameMarkup(existing[0])) {
    wanted.shift();
    existing.shift();
  }
  if (existing.length || wanted.length) tr.step("ancestor", start, end, null, {
    depth: existing.length,
    wrappers: wanted.map(function (n) {
      return n.copy();
    })
  });
  for (var i = root; i < before.path.length; i++) {
    tr.join(before.shorten(i, 1));
  }
}

_transform.Transform.prototype["delete"] = function (from, to) {
  return this.replace(from, to);
};

_transform.Transform.prototype.replace = function (from, to, source, start, end) {
  var repl = undefined,
      depth = undefined,
      doc = this.doc,
      maxDepth = (0, _tree.samePathDepth)(from, to);
  if (source) {
    ;
    var _buildInserted = buildInserted(doc.pathNodes(from.path), source, start, end);

    repl = _buildInserted.repl;
    depth = _buildInserted.depth;

    while (depth > maxDepth) {
      if (repl.nodes.length) repl = { nodes: [doc.path(from.path.slice(0, depth)).copy(repl.nodes)],
        openLeft: repl.openLeft + 1, openRight: repl.openRight + 1 };
      depth--;
    }
  } else {
    repl = nullRepl;
    depth = maxDepth;
  }
  var root = from.shorten(depth),
      docAfter = doc,
      after = to;
  if (repl.nodes.length || (0, _tree.replaceHasEffect)(doc, from, to)) {
    var result = this.step("replace", from, to, root, repl);
    docAfter = result.doc;
    after = result.map.map(to).pos;
  }

  // If no text nodes before or after end of replacement, don't glue text
  if (!doc.path(to.path).type.block) return this;
  if (!(repl.nodes.length ? source.path(end.path).type.block : doc.path(from.path).type.block)) return this;

  var nodesAfter = doc.path(root.path).pathNodes(to.path.slice(depth)).slice(1);
  var nodesBefore = undefined;
  if (repl.nodes.length) {
    var inserted = repl.nodes;
    nodesBefore = [];
    for (var i = 0; i < repl.openRight; i++) {
      var last = inserted[inserted.length - 1];
      nodesBefore.push(last);
      inserted = last.content;
    }
  } else {
    nodesBefore = doc.path(root.path).pathNodes(from.path.slice(depth)).slice(1);
  }
  if (nodesAfter.length != nodesBefore.length || !nodesAfter.every(function (n, i) {
    return n.sameMarkup(nodesBefore[i]);
  })) {
    var before = _model.Pos.before(docAfter, after.shorten(null, 0));
    moveText(this, docAfter, before, after);
  }
  return this;
};

_transform.Transform.prototype.insert = function (pos, nodes) {
  if (!Array.isArray(nodes)) nodes = [nodes];
  this.step("replace", pos, pos, pos, { nodes: nodes, openLeft: 0, openRight: 0 });
  return this;
};

_transform.Transform.prototype.insertInline = function (pos, nodes) {
  if (!Array.isArray(nodes)) nodes = [nodes];
  var styles = (0, _model.spanStylesAt)(this.doc, pos);
  nodes = nodes.map(function (n) {
    return new _model.Span(n.type, n.attrs, styles, n.text);
  });
  return this.insert(pos, nodes);
};

_transform.Transform.prototype.insertText = function (pos, text) {
  return this.insertInline(pos, _model.Span.text(text));
};

},{"../model":27,"./map":36,"./step":39,"./transform":41,"./tree":42}],38:[function(require,module,exports){
"use strict";

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

var _tree = require("./tree");

var _map = require("./map");

(0, _step.defineStep)("split", {
  apply: function apply(doc, step) {
    var pos = step.pos;
    if (pos.depth == 0) return null;
    var copy = (0, _tree.copyTo)(doc, pos.path);
    var last = pos.depth - 1,
        parentPath = pos.path.slice(0, last);
    var offset = pos.path[last],
        parent = copy.path(parentPath);
    var target = parent.content[offset],
        targetSize = target.maxOffset;
    var splitAt = pos.offset;
    if (target.type.block) splitAt = (0, _model.splitSpansAt)(target, pos.offset).offset;
    var after = (step.param || target).copy(target.content.slice(splitAt));
    target.content.length = splitAt;
    parent.content.splice(offset + 1, 0, after);

    var dest = new _model.Pos(parentPath.concat(offset + 1), 0);
    var map = new _map.PosMap([new _map.MovedRange(pos, targetSize - pos.offset, dest), new _map.MovedRange(new _model.Pos(parentPath, offset + 1), parent.content.length - 2 - offset, new _model.Pos(parentPath, offset + 2))], [new _map.ReplacedRange(pos, pos, pos, dest, pos, pos.shorten(null, 1))]);
    return new _transform.TransformResult(copy, map);
  },
  invert: function invert(step, _oldDoc, map) {
    return new _step.Step("join", step.pos, map.map(step.pos).pos);
  },
  paramToJSON: function paramToJSON(param) {
    return param && param.toJSON();
  },
  paramFromJSON: function paramFromJSON(json) {
    return json && _model.Node.fromJSON(json);
  }
});

_transform.Transform.prototype.split = function (pos) {
  var depth = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
  var nodeAfter = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  if (depth == 0) return this;
  for (var i = 0;; i++) {
    this.step("split", null, null, pos, nodeAfter);
    if (i == depth - 1) return this;
    nodeAfter = null;
    pos = pos.shorten(null, 1);
  }
};

},{"../model":27,"./map":36,"./step":39,"./transform":41,"./tree":42}],39:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

exports.defineStep = defineStep;
exports.applyStep = applyStep;
exports.invertStep = invertStep;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _model = require("../model");

var Step = (function () {
  function Step(name, from, to, pos) {
    var param = arguments.length <= 4 || arguments[4] === undefined ? null : arguments[4];

    _classCallCheck(this, Step);

    if (!(name in steps)) throw new Error("Unknown step type: " + name);
    this.name = name;
    this.from = from;
    this.to = to;
    this.pos = pos;
    this.param = param;
  }

  _createClass(Step, [{
    key: "toJSON",
    value: function toJSON() {
      var impl = steps[this.name];
      return {
        name: this.name,
        from: this.from,
        to: this.to,
        pos: this.pos,
        param: impl.paramToJSON ? impl.paramToJSON(this.param) : this.param
      };
    }
  }], [{
    key: "fromJSON",
    value: function fromJSON(json) {
      var impl = steps[json.name];
      return new Step(json.name, json.from && _model.Pos.fromJSON(json.from), json.to && _model.Pos.fromJSON(json.to), json.pos && _model.Pos.fromJSON(json.pos), impl.paramFromJSON ? impl.paramFromJSON(json.param) : json.param);
    }
  }]);

  return Step;
})();

exports.Step = Step;

var steps = Object.create(null);

function defineStep(name, impl) {
  steps[name] = impl;
}

function applyStep(doc, step) {
  if (!(step.name in steps)) throw new Error("Undefined transform " + step.name);

  return steps[step.name].apply(doc, step);
}

function invertStep(step, oldDoc, map) {
  return steps[step.name].invert(step, oldDoc, map);
}

},{"../model":27}],40:[function(require,module,exports){
"use strict";

var _model = require("../model");

var _transform = require("./transform");

var _step = require("./step");

var _tree = require("./tree");

(0, _step.defineStep)("addStyle", {
  apply: function apply(doc, step) {
    return new _transform.TransformResult((0, _tree.copyStructure)(doc, step.from, step.to, function (node, from, to) {
      if (node.type.plainText) return node;
      return (0, _tree.copyInline)(node, from, to, function (node) {
        return new _model.Span(node.type, node.attrs, _model.style.add(node.styles, step.param), node.text);
      });
    }));
  },
  invert: function invert(step, _oldDoc, map) {
    return new _step.Step("removeStyle", step.from, map.map(step.to).pos, null, step.param);
  }
});

_transform.Transform.prototype.addStyle = function (from, to, st) {
  var _this = this;

  var removed = [],
      added = [],
      removing = null,
      adding = null;
  (0, _tree.forSpansBetween)(this.doc, from, to, function (span, path, start, end) {
    if (_model.style.contains(span.styles, st)) {
      adding = removing = null;
    } else {
      path = path.slice();
      var rm = _model.style.containsType(span.styles, st.type);
      if (rm) {
        if (removing && _model.style.same(removing.param, rm)) {
          removing.to = new _model.Pos(path, end);
        } else {
          removing = new _step.Step("removeStyle", new _model.Pos(path, start), new _model.Pos(path, end), null, rm);
          removed.push(removing);
        }
      } else if (removing) {
        removing = null;
      }
      if (adding) {
        adding.to = new _model.Pos(path, end);
      } else {
        adding = new _step.Step("addStyle", new _model.Pos(path, start), new _model.Pos(path, end), null, st);
        added.push(adding);
      }
    }
  });
  removed.forEach(function (s) {
    return _this.step(s);
  });
  added.forEach(function (s) {
    return _this.step(s);
  });
  return this;
};

(0, _step.defineStep)("removeStyle", {
  apply: function apply(doc, step) {
    return new _transform.TransformResult((0, _tree.copyStructure)(doc, step.from, step.to, function (node, from, to) {
      return (0, _tree.copyInline)(node, from, to, function (node) {
        var styles = _model.style.remove(node.styles, step.param);
        return new _model.Span(node.type, node.attrs, styles, node.text);
      });
    }));
  },
  invert: function invert(step, _oldDoc, map) {
    return new _step.Step("addStyle", step.from, map.map(step.to).pos, null, step.param);
  }
});

_transform.Transform.prototype.removeStyle = function (from, to) {
  var _this2 = this;

  var st = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var matched = [],
      step = 0;
  (0, _tree.forSpansBetween)(this.doc, from, to, function (span, path, start, end) {
    step++;
    var toRemove = null;
    if (typeof st == "string") {
      var found = _model.style.containsType(span.styles, st);
      if (found) toRemove = [found];
    } else if (st) {
      if (_model.style.contains(span.styles, st)) toRemove = [st];
    } else {
      toRemove = span.styles;
    }
    if (toRemove && toRemove.length) {
      path = path.slice();
      for (var i = 0; i < toRemove.length; i++) {
        var rm = toRemove[i],
            found = undefined;
        for (var j = 0; j < matched.length; j++) {
          var m = matched[j];
          if (m.step == step - 1 && _model.style.same(rm, matched[j].style)) found = m;
        }
        if (found) {
          found.to = new _model.Pos(path, end);
          found.step = step;
        } else {
          matched.push({ style: rm, from: new _model.Pos(path, start), to: new _model.Pos(path, end), step: step });
        }
      }
    }
  });
  matched.forEach(function (m) {
    return _this2.step("removeStyle", m.from, m.to, null, m.style);
  });
  return this;
};

_transform.Transform.prototype.clearMarkup = function (from, to) {
  var _this3 = this;

  var steps = [];
  (0, _tree.forSpansBetween)(this.doc, from, to, function (span, path, start, end) {
    if (span.type != _model.nodeTypes.text) {
      path = path.slice();
      var _from = new _model.Pos(path, start);
      steps.unshift(new _step.Step("replace", _from, new _model.Pos(path, end), _from));
    }
  });
  this.removeStyle(from.to);
  steps.forEach(function (s) {
    return _this3.step(s);
  });
  return this;
};

},{"../model":27,"./step":39,"./transform":41,"./tree":42}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
})();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _step2 = require("./step");

var _map = require("./map");

var TransformResult = function TransformResult(doc) {
  var map = arguments.length <= 1 || arguments[1] === undefined ? _map.nullMap : arguments[1];

  _classCallCheck(this, TransformResult);

  this.doc = doc;
  this.map = map;
};

exports.TransformResult = TransformResult;

var Transform = (function () {
  function Transform(doc) {
    _classCallCheck(this, Transform);

    this.docs = [doc];
    this.steps = [];
    this.maps = [];
  }

  _createClass(Transform, [{
    key: "step",
    value: function step(_step, from, to, pos, param) {
      if (typeof _step == "string") _step = new _step2.Step(_step, from, to, pos, param);
      var result = (0, _step2.applyStep)(this.doc, _step);
      if (result) {
        this.steps.push(_step);
        this.maps.push(result.map);
        this.docs.push(result.doc);
      }
      return result;
    }
  }, {
    key: "map",
    value: function map(pos, bias) {
      var deleted = false;
      for (var i = 0; i < this.maps.length; i++) {
        var result = this.maps[i].map(pos, bias);
        pos = result.pos;
        if (result.deleted) deleted = true;
      }
      return new _map.MapResult(pos, deleted);
    }
  }, {
    key: "doc",
    get: function get() {
      return this.docs[this.docs.length - 1];
    }
  }, {
    key: "before",
    get: function get() {
      return this.docs[0];
    }
  }]);

  return Transform;
})();

exports.Transform = Transform;

},{"./map":36,"./step":39}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.copyStructure = copyStructure;
exports.copyInline = copyInline;
exports.forSpansBetween = forSpansBetween;
exports.copyTo = copyTo;
exports.isFlatRange = isFlatRange;
exports.selectedSiblings = selectedSiblings;
exports.blocksBetween = blocksBetween;
exports.isPlainText = isPlainText;
exports.replaceHasEffect = replaceHasEffect;
exports.samePathDepth = samePathDepth;

var _model = require("../model");

function copyStructure(node, from, to, f) {
  var depth = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];

  if (node.type.block) {
    return f(node, from, to);
  } else {
    var copy = node.copy();
    if (node.content.length == 0) return copy;
    var start = from ? from.path[depth] : 0;
    var end = to ? to.path[depth] : node.content.length - 1;
    copy.pushFrom(node, 0, start);
    if (start == end) {
      copy.push(copyStructure(node.content[start], from, to, f, depth + 1));
    } else {
      copy.push(copyStructure(node.content[start], from, null, f, depth + 1));
      for (var i = start + 1; i < end; i++) {
        copy.push(copyStructure(node.content[i], null, null, f, depth + 1));
      }copy.push(copyStructure(node.content[end], null, to, f, depth + 1));
    }
    copy.pushFrom(node, end + 1);
    return copy;
  }
}

function copyInline(node, from, to, f) {
  var start = from ? from.offset : 0;
  var end = to ? to.offset : node.size;
  var copy = node.copy(node.slice(0, start).concat(node.slice(start, end).map(f)).concat(node.slice(end)));
  for (var i = copy.content.length - 1; i > 0; i--) {
    (0, _model.stitchTextNodes)(copy, i);
  }return copy;
}

function forSpansBetween(doc, from, to, f) {
  var path = [];
  function scan(node, from, to) {
    if (node.type.block) {
      var startOffset = from ? from.offset : 0;
      var endOffset = to ? to.offset : node.size;
      for (var i = 0, offset = 0; offset < endOffset; i++) {
        var child = node.content[i],
            size = child.size;
        offset += size;
        if (offset > startOffset) f(child, path, Math.max(offset - child.size, startOffset), Math.min(offset, endOffset));
      }
    } else if (node.content.length) {
      var start = from ? from.path[path.length] : 0;
      var end = to ? to.path[path.length] + 1 : node.content.length;
      for (var i = start; i < end; i++) {
        path.push(i);
        scan(node.content[i], i == start && from, i == end - 1 && to);
        path.pop();
      }
    }
  }
  scan(doc, from, to);
}

function copyTo(node, path) {
  var depth = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

  if (depth == path.length) return node.copy(node.content.slice());

  var copy = node.copy();
  var n = path[depth];
  copy.pushFrom(node, 0, n);
  copy.push(copyTo(node.content[n], path, depth + 1));
  copy.pushFrom(node, n + 1);
  return copy;
}

function isFlatRange(from, to) {
  if (from.path.length != to.path.length) return false;
  for (var i = 0; i < from.path.length; i++) {
    if (from.path[i] != to.path[i]) return false;
  }return from.offset <= to.offset;
}

function selectedSiblings(doc, from, to) {
  for (var i = 0, node = doc;; i++) {
    if (node.type.block) return { path: from.path.slice(0, i - 1), from: from.path[i - 1], to: from.path[i - 1] + 1 };
    var fromEnd = i == from.path.length,
        toEnd = i == to.path.length;
    var left = fromEnd ? from.offset : from.path[i];
    var right = toEnd ? to.offset : to.path[i];
    if (fromEnd || toEnd || left != right) return { path: from.path.slice(0, i), from: left, to: right + (toEnd ? 0 : 1) };
    node = node.content[left];
  }
}

function blocksBetween(doc, from, to, f) {
  var path = [];
  function scan(node, from, to) {
    if (node.type.block) {
      f(node, path);
    } else {
      var fromMore = from && from.path.length > path.length;
      var toMore = to && to.path.length > path.length;
      var start = !from ? 0 : fromMore ? from.path[path.length] : from.offset;
      var end = !to ? node.content.length : toMore ? to.path[path.length] + 1 : to.offset;
      for (var i = start; i < end; i++) {
        path.push(i);
        scan(node.content[i], fromMore && i == start ? from : null, toMore && i == end - 1 ? to : null);
        path.pop();
      }
    }
  }
  scan(doc, from, to);
}

function isPlainText(node) {
  if (node.content.length == 0) return true;
  var child = node.content[0];
  return node.content.length == 1 && child.type == _model.nodeTypes.text && child.styles.length == 0;
}

function canBeJoined(node, offset, depth) {
  if (!depth || offset == 0 || offset == node.content.length) return false;
  var left = node.content[offset - 1],
      right = node.content[offset];
  return left.sameMarkup(right);
}

function replaceHasEffect(doc, from, to) {
  for (var depth = 0, node = doc;; depth++) {
    var fromEnd = depth == from.depth,
        toEnd = depth == to.depth;
    if (fromEnd || toEnd || from.path[depth] != to.path[depth]) {
      var gapStart = undefined,
          gapEnd = undefined;
      if (fromEnd) {
        gapStart = from.offset;
      } else {
        gapStart = from.path[depth] + 1;
        for (var i = depth + 1, n = node.content[gapStart - 1]; i <= from.path.length; i++) {
          if (i == from.path.length) {
            if (from.offset < n.maxOffset) return true;
          } else {
            if (from.path[i] + 1 < n.maxOffset) return true;
            n = n.content[from.path[i]];
          }
        }
      }
      if (toEnd) {
        gapEnd = to.offset;
      } else {
        gapEnd = to.path[depth];
        for (var i = depth + 1; i <= to.path.length; i++) {
          if ((i == to.path.length ? to.offset : to.path[i]) > 0) return true;
        }
      }
      if (gapStart != gapEnd) return true;
      return canBeJoined(node, gapStart, Math.min(from.depth, to.depth) - depth);
    } else {
      node = node.content[from.path[depth]];
    }
  }
}

function samePathDepth(a, b) {
  for (var i = 0;; i++) {
    if (i == a.path.length || i == b.path.length || a.path[i] != b.path[i]) return i;
  }
}

},{"../model":27}],43:[function(require,module,exports){
var inserted = {};

module.exports = function (css, options) {
    if (inserted[css]) return;
    inserted[css] = true;
    
    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
      elem.textContent = css;
    } else {
      elem.styleSheet.cssText = css;
    }
    
    var head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
        head.insertBefore(elem, head.childNodes[0]);
    } else {
        head.appendChild(elem);
    }
};

},{}],44:[function(require,module,exports){
"use strict";

var _prosemirrorDistEdit = require("./prosemirror-dist/edit");

var _prosemirrorDistModel = require("./prosemirror-dist/model");

var _prosemirrorDistInputrulesInputrules = require("./prosemirror-dist/inputrules/inputrules");

require("./prosemirror-dist/inputrules/autoinput");

require("./prosemirror-dist/convert/to_markdown");

function wrapInline(pm, match, pos, style) {
	var start = pos.shift(-match[0].length);
	var text = match[0].substring(1, match[0].length - 1);
	var span = _prosemirrorDistModel.Span.text(text, [style]);
	pm.apply(pm.tr["delete"](start, pos).insert(start, span));
	pm.setInlineStyle(style);
}

var additionalRules = [new _prosemirrorDistInputrulesInputrules.Rule("`", /\`\w+(?: \w+)*\`/, function (pm, match, pos) {
	return wrapInline(pm, match, pos, _prosemirrorDistModel.style.code);
}), new _prosemirrorDistInputrulesInputrules.Rule("*", /\*\w+(?: \w+)*\*/, function (pm, match, pos) {
	return wrapInline(pm, match, pos, _prosemirrorDistModel.style.em);
}), new _prosemirrorDistInputrulesInputrules.Rule("_", /_\w+(?: \w+)*_/, function (pm, match, pos) {
	return wrapInline(pm, match, pos, _prosemirrorDistModel.style.em);
})];

var _ = window.ProseMirror = function (options) {
	var pm = new _prosemirrorDistEdit.ProseMirror(options);
	(0, _prosemirrorDistInputrulesInputrules.addInputRules)(pm, additionalRules);
	return pm;
};

},{"./prosemirror-dist/convert/to_markdown":5,"./prosemirror-dist/edit":16,"./prosemirror-dist/inputrules/autoinput":24,"./prosemirror-dist/inputrules/inputrules":25,"./prosemirror-dist/model":27}]},{},[44]);
