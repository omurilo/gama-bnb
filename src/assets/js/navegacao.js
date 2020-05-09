(async function () {
  const api = await (await fetch("assets/data/api.json")).json();

  function filtrarLocais({ page, max, filter }) {
    let locais = [];
    if (filter) {
      api.filter((local) => {
        if (
          local.property_type.toLowerCase().indexOf(filter.toLowerCase()) !==
            -1 ||
          (local.country &&
            local.country.toLowerCase().indexOf(filter.toLowerCase()) !== -1)
        ) {
          locais.push(local);
        }
        return true;
      });
    } else if (page && max) {
      for (let index = 0; index < max; index += 1) {
        locais.push(api[(page - 1) * max + index]);
      }
    } else {
      locais = api;
    }

    return locais;
  }

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
    const html = await (await fetch(url)).text();

    destino.innerHTML = html;
    marcarLinkComoSelecionado(hash);

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
      await navegarViaAjax(location.hash);
    } else {
      const primeiroLink = document.querySelector("[wm-link]");
      await navegarViaAjax(primeiroLink.hash);
    }
  }

  async function popularInicio(data) {
    const url = "paginas/card.html";
    const card = await (await fetch(url)).text();

    const container = document.querySelector(".linha.container");

    if (data) {
      locais = data;
      container.innerHTML = "";
    } else {
      locais = filtrarLocais({});
    }

    if (locais.length === 0) {
      container.innerHTML = '<h1 class="erro">Nenhum local encontrado...</h1>';
    }

    locais.map((local) => {
      const markup = card
        .replace(/\{\{ id \}\}/gi, local.id)
        .replace(/\{\{ imageSrc \}\}/gi, local.photo)
        .replace(
          /\{\{ imageAlt \}\}/gi,
          transformarPrimeiraLetraMaiscula(local.name)
        )
        .replace(
          /\{\{ label \}\}/gi,
          local.country
            ? `${local.property_type}: ${local.country}`
            : local.property_type
        )
        .replace(
          /\{\{ title \}\}/gi,
          transformarPrimeiraLetraMaiscula(local.name)
        )
        .replace(/\{\{ price \}\}/gi, `${local.priceCurrency}${local.price}`);

      container.innerHTML = `${container.innerHTML}${markup}`;
    });
  }

  async function setarLocalizacao() {
    if (!location.hash || location.hash === "#/inicio") {
      const results = [];
      const locais = filtrarLocais({});

      const callback = async (index) => {
        const country = await pegarGeoLocalizacao(
          locais[index].lat,
          locais[index].lng
        );
        locais[index].country = country;
        const card = document.getElementById(`${locais[index].id}`);
        card.getElementsByClassName(
          "label"
        )[0].textContent = `${locais[index].property_type}: ${locais[index].country}`;
      };

      for (let index = 0; index < locais.length; index += 1) {
        results.push(callback(index));
      }

      await Promise.all(results);
    }
  }

  async function pegarGeoLocalizacao(lat, long) {
    const url = `https://weather.ls.hereapi.com/weather/1.0/report.json?product=observation&latitude=${parseFloat(
      lat
    )}&longitude=${parseFloat(
      long
    )}&oneobservation=true&apiKey=Z8XI6rnlOwnA9AzyT2_MS_bT5GcrPiVJABQzRehLxW4`;
    const result = await (await fetch(url)).json();

    return result.observations["location"][0]["country"];
  }

  function transformarPrimeiraLetraMaiscula(text) {
    return text
      .toLowerCase()
      .replace(/^\w/gi, (primeiraLetra) => primeiraLetra.toUpperCase());
  }

  function addListenerFiltrar() {
    const searchInput = document.getElementById("search");
    searchInput.removeAttribute("disabled");
    searchInput.setAttribute('placeholder', 'Busque por Tipo ou País, ex: `Apartamento`');

    searchInput.addEventListener("keyup", () => {
      const locais = filtrarLocais({ filter: searchInput.value });

      popularInicio(locais);
    });
  }

  window.onhashchange = (event) => {
    event.preventDefault();
    navegarViaAjax(location.hash);
  };

  window.onload = async () => {
    configurarLinks();
    await navegacaoInicial();
    await setarLocalizacao();
    addListenerFiltrar();
  };
})();
