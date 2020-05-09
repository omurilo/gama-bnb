(async function () {
  const api = await (await fetch("assets/data/api.json")).json();

  let pagina = 1;
  const maximo = 8;
  const totalItens = api.length;

  function filtrarLocais({ page = pagina, max = maximo, filter }) {
    let locais = [];

    if (filter) {
      api.filter((local) => {
        if (
          local.property_type.toLowerCase().includes(filter.toLowerCase()) ||
          (local.country &&
            local.country.toLowerCase().includes(filter.toLowerCase()))
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
      container.innerHTML =
        '<h1 class="erro">Desculpe, não foi encontrado nenhum local com o termo utilizado, tente novamente!</h1>';
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

      const callback = async (index) => {
        const country = await pegarGeoLocalizacao(
          api[index].lat,
          api[index].lng
        );
        api[index].country = country;
        const card = document.getElementById(`${api[index].id}`);
        if (card) {
          const label = card.getElementsByClassName("label")[0];
          label.textContent = `${api[index].property_type}: ${api[index].country}`;
        }
      };

      for (let index = 0; index < api.length; index += 1) {
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
    searchInput.setAttribute(
      "placeholder",
      "Busque por Tipo ou País, ex: `Apartamento`"
    );

    searchInput.addEventListener("keyup", () => {
      const locais = filtrarLocais({ filter: searchInput.value });

      popularInicio(locais);
    });
  }

  function selecionaItemPaginacao(numero) {
    const proximoElemento = document.querySelector(
      `[data-page-number="${numero}"]`
    );
    const elementoAtual = document.querySelector(".pagina-selecionada");
    elementoAtual.classList.remove("pagina-selecionada");
    proximoElemento.classList.add("pagina-selecionada");
  }

  function irParaPagina(pagina) {
    const container = document.querySelector(".linha.container");
    const paginaAtual = parseInt(container.getAttribute("data-page"), 10);
    if (pagina !== paginaAtual) {
      container.setAttribute("data-page", pagina);
      const locais = filtrarLocais({ page: pagina });
      popularInicio(locais);
      selecionaItemPaginacao(pagina);
    }
  }

  /**
   * Navega entre as páginas (próxima página, página anterior)
   * @param {number} direcao - (-1) ou (1), utilizado na soma ou subtração da página atual
   *
   */

  function navegarPagina(direcao) {
    const container = document.querySelector(".linha.container");
    const paginaAtual = parseInt(container.getAttribute("data-page"), 10);
    const numeroDePaginas = totalItens / maximo;

    const pagina = paginaAtual + direcao;

    if (pagina > 0 && pagina < numeroDePaginas + 1) {
      const locais = filtrarLocais({ page: pagina });
      popularInicio(locais);

      selecionaItemPaginacao(pagina);

      container.setAttribute("data-page", pagina);
    }
  }

  function adicionarNavegacao() {
    const numeroDePaginas = totalItens / maximo;
    const paginaAtual = parseInt(
      document.querySelector(".linha.container").getAttribute("data-page"),
      10
    );

    const paginacaoContainer = document.querySelector(".linha.paginacao");

    const lista = document.createElement("ul");
    const anterior = document.createElement("li");
    anterior.addEventListener("click", () => navegarPagina(-1));
    anterior.classList.add("pagina-anterior");
    const proximo = document.createElement("li");
    proximo.addEventListener("click", () => navegarPagina(1));
    proximo.classList.add("pagina-proximo");

    lista.appendChild(anterior);

    for (let item = 1; item < numeroDePaginas + 1; item += 1) {
      const pagina = document.createElement("li");
      pagina.addEventListener("click", () => irParaPagina(item));
      pagina.setAttribute("data-page-number", item);
      pagina.classList.add("pagina-navegar");
      if (paginaAtual === item) {
        pagina.classList.add("pagina-selecionada");
      }

      lista.appendChild(pagina);
    }

    lista.appendChild(proximo);

    paginacaoContainer.appendChild(lista);
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
    adicionarNavegacao();
  };
})();
