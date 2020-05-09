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

  async function setLocations() {
    if (!location.hash || location.hash === "#/inicio") {
      const results = [];

      const callback = async (index) => {
        const country = await getGeoCode(api[index].lat, api[index].lng);
        api[index].country = country;
        const card = document.getElementById(`${api[index].id}`);
        card.getElementsByClassName(
          "label"
        )[0].textContent = `${api[index].property_type}: ${api[index].country}`;
      };

      for (let index = 0; index < api.length; index += 1) {
        results.push(callback(index));
      }

      await Promise.all(results);
    }
  }

  async function getGeoCode(lat, long) {
    const url = `https://weather.ls.hereapi.com/weather/1.0/report.json?product=observation&latitude=${parseFloat(
      lat
    )}&longitude=${parseFloat(
      long
    )}&oneobservation=true&apiKey=Z8XI6rnlOwnA9AzyT2_MS_bT5GcrPiVJABQzRehLxW4`;
    const result = await (await fetch(url)).json();

    return result.observations["location"][0]["country"];
  }

  window.onhashchange = (e) => {
    e.preventDefault();
    navegarViaAjax(location.hash);
  };

  configurarLinks();
  await navegacaoInicial();
  await setLocations();
})();
