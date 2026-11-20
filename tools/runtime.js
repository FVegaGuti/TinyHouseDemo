(function () {
  var tplEl = document.getElementById('tpl');
  var app = document.getElementById('app');
  var handlers = [];
  var comp = null;
  var VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, source: 1, track: 1, wbr: 1 };
  var RE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var escText = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  function get(scope, path) {
    path = (path || '').trim();
    if (!path) return undefined;
    if (path === 'true') return true;
    if (path === 'false') return false;
    var parts = path.split('.'), v;
    for (var i = scope.length - 1; i >= 0; i--) {
      if (scope[i] && Object.prototype.hasOwnProperty.call(scope[i], parts[0])) { v = scope[i][parts[0]]; break; }
    }
    for (var k = 1; k < parts.length; k++) { if (v == null) return undefined; v = v[parts[k]]; }
    return v;
  }
  function interp(str, scope) { return str.replace(RE, function (_, p) { var v = get(scope, p); return v == null ? '' : String(v); }); }
  function single(str) { var m = (str || '').match(/^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/); return m ? m[1] : null; }
  function ser(node, scope) {
    var out = '';
    var kids = node.childNodes;
    for (var i = 0; i < kids.length; i++) {
      var n = kids[i];
      if (n.nodeType === 3) { out += escText(interp(n.nodeValue, scope)); continue; }
      if (n.nodeType !== 1) continue;
      var tag = n.localName;
      if (tag === 'sc-if') { if (get(scope, single(n.getAttribute('value')))) out += ser(n, scope); continue; }
      if (tag === 'sc-for') {
        var list = get(scope, single(n.getAttribute('list'))) || [];
        var as = n.getAttribute('as');
        for (var j = 0; j < list.length; j++) { var o = {}; o[as] = list[j]; out += ser(n, scope.concat([o])); }
        continue;
      }
      var attrs = '';
      for (var a = 0; a < n.attributes.length; a++) {
        var at = n.attributes[a], name = at.name;
        if (name.indexOf('hint-') === 0) continue;
        var p = single(at.value);
        if (name.indexOf('on') === 0 && name.length > 2) {
          var fn = p && get(scope, p);
          if (typeof fn === 'function') { var id = handlers.push(fn) - 1; attrs += ' data-ev-' + name.slice(2).toLowerCase() + '="' + id + '"'; }
          continue;
        }
        if (p !== null) {
          var v = get(scope, p);
          if (typeof v === 'boolean') { if (v) attrs += ' ' + name + '=""'; continue; }
          if (v == null) continue;
          attrs += ' ' + name + '="' + esc(v) + '"';
          continue;
        }
        attrs += ' ' + name + '="' + esc(interp(at.value, scope)) + '"';
      }
      out += '<' + tag + attrs + '>';
      if (VOID[tag]) continue;
      out += tag === 'textarea' ? escText(n.textContent) : ser(n, scope);
      out += '</' + tag + '>';
    }
    return out;
  }
  function patch(parent, next) {
    var a = Array.prototype.slice.call(parent.childNodes);
    var b = Array.prototype.slice.call(next.childNodes);
    for (var i = 0; i < b.length; i++) {
      var o = a[i], n = b[i];
      if (!o) { parent.appendChild(n); continue; }
      if (o.nodeType !== n.nodeType || o.nodeName !== n.nodeName) { parent.replaceChild(n, o); continue; }
      if (o.nodeType !== 1) { if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue; continue; }
      var oa = Array.prototype.slice.call(o.attributes);
      for (var x = 0; x < oa.length; x++) if (!n.hasAttribute(oa[x].name)) o.removeAttribute(oa[x].name);
      var na = n.attributes;
      for (var y = 0; y < na.length; y++) if (o.getAttribute(na[y].name) !== na[y].value) o.setAttribute(na[y].name, na[y].value);
      if (o.tagName === 'INPUT' || o.tagName === 'TEXTAREA') {
        if (n.hasAttribute('value') && document.activeElement !== o && o.value !== n.getAttribute('value')) o.value = n.getAttribute('value');
        if (o.tagName === 'TEXTAREA') continue;
      }
      if (o.tagName === 'BUTTON') o.disabled = n.hasAttribute('disabled');
      patch(o, n);
    }
    for (var r = a.length - 1; r >= b.length; r--) parent.removeChild(a[r]);
  }
  function render() {
    handlers = [];
    var html = ser(tplEl.content, [comp.renderVals()]);
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    patch(app, tmp);
  }
  function DCLogic() { this.state = {}; }
  DCLogic.prototype.setState = function (p, cb) {
    this.state = Object.assign({}, this.state, typeof p === 'function' ? p(this.state) : p);
    render();
    if (cb) cb();
  };
  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-ev-click]');
    if (el && app.contains(el) && !el.disabled) { var fn = handlers[+el.getAttribute('data-ev-click')]; if (fn) fn(e); }
  });
  app.addEventListener('input', function (e) {
    var el = e.target.closest('[data-ev-change]');
    if (el) { var fn = handlers[+el.getAttribute('data-ev-change')]; if (fn) fn(e); }
  });
  window.DCLogic = DCLogic;
  window.__dcBoot = function (C) { comp = new C(); render(); };
})();
