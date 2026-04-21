(function () {
  var hide = function () {
    var s = document.getElementById('vansh-splash');
    if (!s || s.dataset.hiding) return;
    s.dataset.hiding = '1';
    s.classList.add('hide');
    setTimeout(function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    }, 350);
  };
  window.__hideVanshSplash = hide;
  var root = document.getElementById('root');
  if (root) {
    var obs = new MutationObserver(function () {
      if (root.children.length > 0) {
        obs.disconnect();
        hide();
      }
    });
    obs.observe(root, { childList: true });
  }
  setTimeout(hide, 3000);
})();
