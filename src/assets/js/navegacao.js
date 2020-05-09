(async function () {
  const api = require("../data/api.json");

  function marcarLinkComoSelecionado(hash) {
    const links = document.querySelectorAll(`[wm-link]`);
    links.forEach((link) => link.classList.remove("selecionado"));

    const link = document.querySelector(`[wm-link='${hash}']`);
    link.classList.add("selecionado");
  }

  async function navegarViaAjax(hash) {
    if (!hash) return;

    const destino = document.querySelector("[wm-link-destino]");

    const url = `paginas/${hash.substring(1)}.html`;
    fetch(url)
      .then((resp) => resp.text())
      .then((html) => {
        destino.innerHTML = html;
        marcarLinkComoSelecionado(hash);
      });

    if (!location.hash || location.hash === "#/inicio") {
      await popularInicio();
    }
  }

  function configurarLinks() {
    document.querySelectorAll("[wm-link]").forEach((link) => {
      link.href = link.attributes["wm-link"].value;
    });
  }

  async function navegacaoInicial() {
    if (location.hash) {
      navegarViaAjax(location.hash);
    } else {
      const primeiroLink = document.querySelector("[wm-link]");
      navegarViaAjax(primeiroLink.hash);
    }
  }

  async function popularInicio() {
    const url = "paginas/card.html";
    const card = await (await fetch(url)).text();

    const container = document.querySelector(".linha.container");

    api.map((local) => {
      const markup = card
        .replace(/\{\{ id \}\}/gi, local.id)
        .replace(/\{\{ imageSrc \}\}/gi, local.photo)
        .replace(/\{\{ imageAlt \}\}/gi, local.name)
        .replace(/\{\{ label \}\}/gi, local.property_type)
        .replace(/\{\{ title \}\}/gi, local.name)
        .replace(/\{\{ price \}\}/gi, `${local.priceCurrency}${local.price}`);

      // container.appendChild(markup);
      container.innerHTML = `${container.innerHTML}${markup}`;
    });
  }

  

  window.onhashchange = (e) => {
    e.preventDefault();
    navegarViaAjax(location.hash);
  };

  configurarLinks();
  await navegacaoInicial();
})();
