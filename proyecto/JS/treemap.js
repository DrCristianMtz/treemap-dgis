// treemap.js

// BLOQUE 1: CONFIGURACIÓN Y UTILIDADES DE COLOR
const ROOT = "Morbilidad - Carga Global de Enfermedad";
const COLOR_NEUTRO = "#CCCCCC";
const MIN_F = 0.3;
const PALETTE = [
  "#e41a1c", "#377eb8", "#4daf4a", "#984ea3",
  "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"
];
let allNodes = [];
let autoCompleteInstance = null;
let labelToNodeId = {};

// Funciones para convertir entre hexadecimal y RGB
function hexToRgb(h) {
  h = h.replace("#", "");
  return [
    parseInt(h.substr(0, 2), 16),
    parseInt(h.substr(2, 2), 16),
    parseInt(h.substr(4, 2), 16)
  ];
}
function rgbToHex(rgb) {
  return "#" + rgb.map(c => c.toString(16).padStart(2, "0")).join("");
}
function adjustColor(base, factor) {
  factor = Math.max(0, Math.min(1, factor));
  const adj = MIN_F + (1 - MIN_F) * factor;
  return rgbToHex(hexToRgb(base).map(c => Math.round(255 * (1 - adj) + c * adj)));
}

// BLOQUE 2: CARGA DEL DICCIONARIO Y LECTURA DEL EXCEL
let mapping = {};
let excelDataGlobal = [];

async function loadMapping() {
  try {
    const response = await fetch("diccionario.json");
    if (!response.ok) {
      throw new Error("Error al cargar diccionario.json: " + response.statusText);
    }
    mapping = await response.json();
    console.log("Diccionario cargado:", mapping);
  } catch (error) {
    console.error("Error al cargar el diccionario:", error);
  }
}
loadMapping();

function leerExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const buf = new Uint8Array(e.target.result),
            wb = XLSX.read(buf, { type: "array" }),
            ws = wb.Sheets[wb.SheetNames[0]],
            json = XLSX.utils.sheet_to_json(ws, { defval: "" });
      // Verificar columnas obligatorias
      ["ANIO", "MODULO", "VARIABLE", "CATEGORIA", "TOTAL_REGISTROS"].forEach(col => {
        if (!json[0] || !json[0].hasOwnProperty(col)) {
          reject(new Error("Falta columna " + col));
        }
      });
      json.forEach(r => {
        r.TOTAL_REGISTROS = Number(r.TOTAL_REGISTROS) || 0;
      });
      resolve(json);
    };
    reader.readAsArrayBuffer(file);
  });
}

// BLOQUE 3: FILTROS
function populateFilters(data) {
  const anioSet = new Set();
  const moduloSet = new Set();
  const variableSet = new Set();
  data.forEach(row => {
    if (row["ANIO"]) anioSet.add(row["ANIO"].toString().trim());
    if (row["MODULO"]) moduloSet.add(row["MODULO"].toString().trim());
    if (row["VARIABLE"]) variableSet.add(row["VARIABLE"].toString().trim());
  });
  function populateSelect(selectId, setValues) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Todos</option>';
    Array.from(setValues).sort().forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }
  populateSelect("filterAnio", anioSet);
  populateSelect("filterModulo", moduloSet);
  populateSelect("filterVariable", variableSet);
}

function filterExcelData(data) {
  const selectedAnio = document.getElementById("filterAnio").value;
  const selectedModulo = document.getElementById("filterModulo").value;
  const selectedVariable = document.getElementById("filterVariable").value;
  return data.filter(row => {
    const anio = row["ANIO"] ? row["ANIO"].toString().trim() : "";
    const modulo = row["MODULO"] ? row["MODULO"].toString().trim() : "";
    const variable = row["VARIABLE"] ? row["VARIABLE"].toString().trim() : "";
    return ((selectedAnio === "" || anio === selectedAnio) &&
            (selectedModulo === "" || modulo === selectedModulo) &&
            (selectedVariable === "" || variable === selectedVariable));
  });
}

// Función helper para normalizar cadenas
function normalize(val) {
  return (!val || val.trim() === "" || val.trim() === "-") ?
         "Sin Información" :
         val.trim();
}

// BLOQUE 4: CONSTRUCCIÓN DE LA JERARQUÍA DE NODOS
// Cada nodo tendrá un arreglo "details" para usarse en el modal (transferido luego como "codes")
function construirNodos(rows) {
  let nodes = [];
  let tree = {
    id: ROOT,
    label: ROOT,
    directValue: 0,
    totalValue: 0,
    children: {},
    details: []
  };

  function addDetail(node, code, value, description) {
    if (!node.details) {
      node.details = [];
    }
    let existing = node.details.find(item => item.code === code);
    if (existing) {
      existing.cases += value;
    } else {
      node.details.push({ code, description, cases: value });
    }
  }

  rows.forEach(row => {
    const codeRaw = row["CATEGORIA"];
    const code = codeRaw ? codeRaw.toString().trim().toUpperCase() : "";
    const valor = Number(row.TOTAL_REGISTROS) || 0;
    if (!code) return;
    
    // Si no existe en el diccionario o su categoría es "Sin Información", lo omitimos del árbol
    if (!mapping[code] || normalize(mapping[code].categoria) === "Sin Información") {
      // Se consideran para los no considerados y no se agregan al árbol
      return;
    }
    const rec = mapping[code];
    const description = 
          ((rec.descripcion && rec.descripcion.trim()) ||
           (rec.DESCRIPCION && rec.DESCRIPCION.trim()) ||
           (rec.desc && rec.desc.trim())) || "Sin descripción";
    const cat = normalize(rec.categoria);
    const sub = normalize(rec.subcategoria);
    const grp = normalize(rec.grupo);
    const sgrp = normalize(rec.subgrupo);

    if (!tree.children[cat]) {
      tree.children[cat] = {
        id: ROOT + "|" + cat,
        label: cat,
        directValue: 0,
        totalValue: 0,
        color: null,
        children: {},
        details: []
      };
    }
    addDetail(tree.children[cat], code, valor, description);
    if (sub === "Sin Información") {
      tree.children[cat].directValue += valor;
    }
    
    let subNode = null;
    if (sub !== "Sin Información") {
      if (!tree.children[cat].children[sub]) {
        tree.children[cat].children[sub] = {
          id: tree.children[cat].id + "|" + sub,
          label: sub,
          directValue: 0,
          totalValue: 0,
          children: {},
          details: []
        };
      }
      subNode = tree.children[cat].children[sub];
      addDetail(subNode, code, valor, description);
      if (grp === "Sin Información") {
        subNode.directValue += valor;
      }
    }
    
    let parentForGroup = subNode || tree.children[cat];
    let groupNode = null;
    if (grp !== "Sin Información") {
      if (!parentForGroup.children[grp]) {
        parentForGroup.children[grp] = {
          id: parentForGroup.id + "|" + grp,
          label: grp,
          directValue: 0,
          totalValue: 0,
          children: {},
          details: []
        };
      }
      groupNode = parentForGroup.children[grp];
      addDetail(groupNode, code, valor, description);
      if (sgrp === "Sin Información") {
        groupNode.directValue += valor;
      }
    }
    
    if (groupNode && sgrp !== "Sin Información") {
      if (!groupNode.children[sgrp]) {
        groupNode.children[sgrp] = {
          id: groupNode.id + "|" + sgrp,
          label: sgrp,
          directValue: 0,
          totalValue: 0,
          details: []
        };
      }
      groupNode.children[sgrp].directValue += valor;
      addDetail(groupNode.children[sgrp], code, valor, description);
    }
  });

  // Recálculo de totales y asignación de colores
  function recalcularValores(node) {
    let sumChildren = 0;
    if (node.children) {
      for (const key in node.children) {
        sumChildren += recalcularValores(node.children[key]);
      }
    }
    node.totalValue = node.directValue + sumChildren;
    return node.totalValue;
  }
  recalcularValores(tree);
  tree.color = COLOR_NEUTRO;
  
  function assignChildColors(node) {
    if (node.children) {
      for (const key in node.children) {
        let child = node.children[key];
        let frac = node.totalValue ? (child.totalValue / node.totalValue) : 0;
        child.color = adjustColor(node.color, frac);
        assignChildColors(child);
      }
    }
  }
  let catIndex = 0;
  for (const cat in tree.children) {
    tree.children[cat].color = PALETTE[catIndex % PALETTE.length];
    assignChildColors(tree.children[cat]);
    catIndex++;
  }
  
  function traverse(node, parentId) {
    const parts = node.id.split("|");
    const categoria = parts[1] || "";
    const subcategoria = parts[2] || "";
    const grupo = parts[3] || "";
    const subgrupo = parts[4] || "";
    nodes.push({
      id: node.id,
      label: node.label,
      parent: parentId,
      value: node.totalValue,
      color: node.color || "#CCCCFF",
      categoria,
      subcategoria,
      grupo,
      subgrupo,
      codes: node.details // Transferimos "details" a "codes" para usar en el modal
    });
    if (node.children) {
      for (const key in node.children) {
        traverse(node.children[key], node.id);
      }
    }
  }
  traverse(tree, "");
  return nodes;
}

// BLOQUE 5: PREPARAR TOOLTIP
function hoverText(n) {
  const lines = [];
  if (n.id === ROOT) lines.push(ROOT);
  if (n.categoria) lines.push("Categoría: " + n.categoria);
  if (n.subcategoria) lines.push("Subcategoría: " + n.subcategoria);
  if (n.grupo) lines.push("Grupo: " + n.grupo);
  if (n.subgrupo) lines.push("Subgrupo: " + n.subgrupo);
  lines.push("Valor: " + n.value.toLocaleString());
  return lines.join("<br>");
}

// BLOQUE 6: RENDERIZAR TREEMAP CON PLOTLY
// Actualiza prepHover para generar una propiedad customText en cada nodo para ver los códios CIE-10
function prepHover(nodes) {
    const tot = nodes[0]?.value || 0;
    return nodes.map(n => {
        // Si el nodo tiene un valor > 0, mostrar el texto
        // Además, permitir que el ROOT tenga acceso a todos los códigos
        n.verTexto = (n.value > 0 || n.id === ROOT) 
            ? "Ver Códigos CIE-10 (ctrl+click)" 
            : "";
        // Generar el contenido del hover
        const base = hoverText(n);
        const pct = tot ? ((n.value / tot * 100).toFixed(2) + "%") : "0%";
        n.hover = base + "<br>Porcentaje: " + pct;

        return n;
    });
}

// Actualiza renderTreemap para usar customdata con objetos y mostrar el customText en la celda
function renderTreemap(nodes) {
  nodes = prepHover(nodes);
  const options = nodes.map(n => {
    labelToNodeId[n.label] = n.id;
    return { label: n.label, value: n.id };
  });
  const inputSearch = document.getElementById("search");
  if (!autoCompleteInstance) {
    autoCompleteInstance = new Awesomplete(inputSearch, {
      list: options,
      minChars: 0,
      autoFirst: true,
      maxItems: 10,
      item: function(item) {
        const li = document.createElement("li");
        li.innerHTML = item.label;
        return li;
      },
      filter: Awesomplete.FILTER_CONTAINS,
      replace: function(suggestion) { this.input.value = suggestion.label; }
    });
  } else {
    autoCompleteInstance.list = options;
  }
  inputSearch.disabled = false;
  document.getElementById("resetBtn").disabled = false;

  // Creamos un arreglo de objetos que contenga tanto el hover como el texto custom para cada nodo.
  const customDataArray = nodes.map(n => ({
    hover: n.hover,
    verTexto: n.verTexto
  }));

  const trace = {
    type: "treemap",
    ids: nodes.map(n => n.id),
    labels: nodes.map(n => n.label),
    parents: nodes.map(n => n.parent),
    values: nodes.map(n => n.value),
    branchvalues: "total",
    customdata: customDataArray,
    hovertemplate: "%{customdata.hover}<extra></extra>",
    marker: { colors: nodes.map(n => n.color) },
    // Se utiliza el customText del objeto para mostrar la etiqueta + valor + mensaje (si existe).
    // Si el nodo no tiene códigos, custom será solo "Label<br>Value"
    texttemplate: "%{label}<br>%{value:,}<br><span style='font-size:12px;color:#611232'>%{customdata.verTexto}</span>",
    textinfo: "none",  // Se oculta la info por defecto porque usamos texttemplate
    textfont: { size: 14, color: "black" },
    textposition: "middle center",
    pathbar: { visible: true },
    root: { id: ROOT },
    maxdepth: null
  };
  const layout = {
    responsive: true,
    autosize: true,
    margin: { t: 30, l: 0, r: 0, b: 0 },
    pathbar: { visible: true, textfont: { size: 14, color: "black" } }
  };
  Plotly.newPlot("chart", [trace], layout, { responsive: true });

  // Event listener para drill-down (se mantiene igual)
  const chartDiv = document.getElementById("chart");
  Plotly.newPlot(chartDiv, [trace], layout, { responsive: true });

  // En lugar de plotly_click, usamos plotly_treemapclick
  chartDiv.on("plotly_treemapclick", (data) => {
    // Solo nos interesa el ctrl+click
    if (!data.event.ctrlKey) return;

    // Abrimos tu modal
    const pt   = data.points[0];
    const node = allNodes.find(n => n.id === pt.id);
    if (node && node.codes && node.codes.length) {
      verDrillModal(node);
    }

    // Retornando false evitamos el drill-down de Plotly
    return false;
  });
}

function verDrillModal(node) {
  if (!node || !Array.isArray(node.codes)) {
    console.error("Error: el nodo no tiene códigos.", node);
    return;
  }

  // Para debug: confirma que node trae las propiedades
  console.log("🔍 Drill-modal para nodo:", node);

  // Extraemos los códigos
  const codeDetails = node.codes;

  // Construimos el título dinámico
  const title = 
  node.subgrupo   ||
  node.grupo      ||
  node.subcategoria ||
  node.categoria;

  let totalCasos = 0;
  let rowsHtml = "";
  codeDetails.forEach((detail, index) => {
    totalCasos += detail.cases;
    const rowColor = index % 2 === 0 ? "#f9f1e4" : "#fff";
    rowsHtml += `<tr style="background: ${rowColor};">
      <td style="padding: 10px; text-align: center;">${detail.code}</td>
      <td style="padding: 10px;">${detail.description}</td>
      <td style="padding: 10px; text-align: right;">${detail.cases.toLocaleString()}</td>
    </tr>`;
  });

  const html = `
    <div id="drillModalOverlay" style="
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1100;
    ">
      <div id="drillModalContent" style="
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.3);
          width: 800px;
          height: 600px;
          display: flex;
          flex-direction: column;
          font-family: 'Montserrat', sans-serif;
      ">
        <!-- Encabezado del modal -->
        <div style="
          background: linear-gradient(135deg, #611232, #7F1530);
          padding: 20px;
          border-top-left-radius: 10px;
          border-top-right-radius: 10px;
          text-align: center;
        ">
          <span style="color:#fff; font-size:22px; font-weight:600;">
            ${title}
          </span>
        </div>
        <!-- Zona de búsqueda -->
        <div style="padding: 12px 16px;">
          <input type="text" id="searchDrill" placeholder="Buscar..." style="
            width: 100%;
            padding: 10px;
            margin-bottom: 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
          ">
        </div>
        <!-- Contenedor de la tabla (sin padding para no interferir con el sticky) -->
        <div id="drillTableContainer" style="
            flex-grow: 1;
            overflow-y: auto;
            position: relative;
            margin: 0 16px;
            padding: 0;
        ">
          <table id="drillTable" style="
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
          ">
            <thead style="
                position: sticky;
                top: 0;
                background: #ecf0f1;
                z-index: 2;
              ">
              <tr style="cursor: pointer;">
                <th style="padding: 10px;">Código</th>
                <th style="padding: 10px;">Descripción</th>
                <th style="padding: 10px;">Casos</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot style="
                position: sticky;
                bottom: 0;
                background: #34495e;
                color: white;
                z-index: 2;
              ">
              <tr style="font-weight: bold;">
                <td colspan="2" style="padding: 12px;">Total de Casos</td>
                <td style="padding: 12px; text-align: right;">${totalCasos.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", html);

  // Helper para aplicar sombreado alternado al cuerpo de la tabla
  function aplicarSombreadoDrill() {
    const rows = Array.from(document.querySelectorAll("#drillTable tbody tr"))
                      .filter(r => r.style.display !== "none");
    rows.forEach((row, i) => {
      row.style.background = i % 2 === 0 ? "#f9f1e4" : "#fff";
    });
  }

  // Helper para hacer scroll arriba en el contenedor de la tabla
  function scrollArribaDrill() {
    document.getElementById("drillTableContainer").scrollTop = 0;
  }

  // Ordenamiento con toggle en la tabla de drill-down
  document.querySelectorAll("#drillTable th").forEach((header, index) => {
    header.addEventListener("click", function() {
      const table = document.getElementById("drillTable");
      const tbody = table.querySelector("tbody");
      const rows = Array.from(tbody.rows);
      const isNumeric = header.innerText.toLowerCase().includes("casos");
      let sortOrder = header.getAttribute("data-sort-order") === "asc" ? "desc" : "asc";
      header.setAttribute("data-sort-order", sortOrder);
      rows.sort((a, b) => {
        let aText = a.cells[index].innerText.trim();
        let bText = b.cells[index].innerText.trim();
        if (isNumeric) {
          const aNum = parseFloat(aText.replace(/,/g, "")) || 0;
          const bNum = parseFloat(bText.replace(/,/g, "")) || 0;
          return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
        } else {
          return sortOrder === "asc"
            ? aText.localeCompare(bText, undefined, { numeric: true })
            : bText.localeCompare(aText, undefined, { numeric: true });
        }
      });
      rows.forEach(row => tbody.appendChild(row));
      aplicarSombreadoDrill();
      scrollArribaDrill();
    });
  });

  // Filtro en la tabla de drill-down
  document.getElementById("searchDrill").addEventListener("keyup", function() {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#drillTable tbody tr");
    rows.forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
    aplicarSombreadoDrill();
    scrollArribaDrill();
  });

  // Cerrar el modal al hacer click fuera del contenido
  document.getElementById("drillModalOverlay").addEventListener("click", function(e) {
    if (e.target.id === "drillModalOverlay") {
      this.remove();
    }
  });

  // Cerrar modal con ESC
  document.addEventListener("keydown", function escListener(e) {
    if (e.key === "Escape") {
      const overlay = document.getElementById("drillModalOverlay");
      overlay?.remove();
      document.removeEventListener("keydown", escListener);
    }
  })

  // Ordenamiento por defecto: se fuerza que la columna "Casos" se ordene de mayor a menor
  const headerCasos = document.querySelectorAll("#drillTable th")[2];
  headerCasos.setAttribute("data-sort-order", "asc");
  headerCasos.click();
}

// BLOQUE EXTRA: Modal para códigos no considerados
function verNonConsideredModal(codesArray) {
  let totalCasos = 0;
  let rowsHtml = "";

  // Generar filas y sumar casos
  codesArray.forEach((item, index) => {
    totalCasos += item.cases;
    const rowColor = index % 2 === 0 ? "#f9f1e4" : "#fff";
    rowsHtml += `
      <tr style="background: ${rowColor};">
        <td style="padding: 10px; text-align: center;">${item.code}</td>
        <td style="padding: 10px;">${item.description}</td>
        <td style="padding: 10px; text-align: right;">${item.cases.toLocaleString()}</td>
      </tr>`;
  });

  // HTML del modal
  const html = `
    <div id="nonConsModalOverlay" style="
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.6);
      display: flex; justify-content: center; align-items: center;
      z-index: 1100;
    ">
      <div id="nonConsModalContent" role="dialog" aria-labelledby="nonConsModalTitle" style="
        background: #fff; border-radius: 10px; box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        width: 800px; height: 600px;
        display: flex; flex-direction: column;
        font-family: 'Montserrat', sans-serif;
      ">
        <div id="nonConsModalTitle" style="
          background: linear-gradient(135deg, #611232, #7F1530);
          padding: 20px; border-top-left-radius: 10px; border-top-right-radius: 10px;
          text-align: center;
        ">
          <span style="color:#fff; font-size:22px; font-weight:600;">
            Códigos no considerados en la GBD
          </span>
        </div>
        <div style="padding: 12px 16px;">
          <input type="text" id="searchNonCons" placeholder="Buscar..." style="
            width: 100%; padding: 10px; margin-bottom: 12px;
            border: 1px solid #ccc; border-radius: 4px; font-size: 14px;
          ">
        </div>
        <div id="nonConsTableContainer" style="
          flex-grow: 1; overflow-y: auto; position: relative;
          margin: 0 16px; padding: 0;
        ">
          <table id="nonConsTable" style="
            width: 100%; border-collapse: collapse; font-size: 12px;
          ">
            <thead style="position: sticky; top: 0; background: #ecf0f1; z-index: 2;">
              <tr style="cursor: pointer;">
                <th style="padding: 10px;">Código</th>
                <th style="padding: 10px;">Descripción</th>
                <th style="padding: 10px;">Casos</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot style="position: sticky; bottom: 0; background: #34495e; color: white; z-index: 2;">
              <tr style="font-weight: bold;">
                <td colspan="2" style="padding: 12px;">Total de Casos</td>
                <td style="padding: 12px; text-align: right;">
                  ${totalCasos.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>`;

  // Añadir el modal al DOM
  document.body.insertAdjacentHTML("beforeend", html);

  // Helpers de sombreado alternado y scroll top
  function aplicarSombreadoNonCons() {
    const rows = Array.from(
      document.querySelectorAll("#nonConsTable tbody tr")
    ).filter(r => r.style.display !== "none");
    rows.forEach((row, i) => {
      row.style.background = i % 2 === 0 ? "#f9f1e4" : "#fff";
    });
  }
  function scrollArribaNonCons() {
    document.getElementById("nonConsTableContainer").scrollTop = 0;
  }

  // Ordenamiento con toggle
  document.querySelectorAll("#nonConsTable th").forEach((header, index) => {
    header.addEventListener("click", () => {
      const table = document.getElementById("nonConsTable");
      const tbody = table.querySelector("tbody");
      const rows = Array.from(tbody.rows);
      const isNumeric = header.innerText.toLowerCase().includes("casos");
      let sortOrder = header.getAttribute("data-sort-order") === "asc" ? "desc" : "asc";
      header.setAttribute("data-sort-order", sortOrder);

      rows.sort((a, b) => {
        let aText = a.cells[index].innerText.trim();
        let bText = b.cells[index].innerText.trim();
        if (isNumeric) {
          const aNum = parseFloat(aText.replace(/,/g, "")) || 0;
          const bNum = parseFloat(bText.replace(/,/g, "")) || 0;
          return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
        } else {
          return sortOrder === "asc"
            ? aText.localeCompare(bText, undefined, { numeric: true })
            : bText.localeCompare(aText, undefined, { numeric: true });
        }
      });

      rows.forEach(row => tbody.appendChild(row));
      aplicarSombreadoNonCons();
      scrollArribaNonCons();
    });
  });

  // Búsqueda en la tabla
  document.getElementById("searchNonCons").addEventListener("keyup", function () {
    const filter = this.value.toLowerCase();
    document.querySelectorAll("#nonConsTable tbody tr").forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
    aplicarSombreadoNonCons();
    scrollArribaNonCons();
  });

  // Cerrar modal al hacer click fuera
  document.getElementById("nonConsModalOverlay").addEventListener("click", function (e) {
    if (e.target.id === "nonConsModalOverlay") this.remove();
  });

  // Cerrar modal con ESC
  document.addEventListener("keydown", function escListener(e) {
    if (e.key === "Escape") {
      const overlay = document.getElementById("nonConsModalOverlay");
      overlay?.remove();
      document.removeEventListener("keydown", escListener);
    }
  });

  // Ordenamiento por defecto: Casos de mayor a menor
  const headerCasos = document.querySelectorAll("#nonConsTable th")[2];
  headerCasos.setAttribute("data-sort-order", "asc");
  headerCasos.click();
}

// BLOQUE 7: Drill-down (simulación de clics en nodos)
function simulateSliceClick(nodeId) {
  const slices = document.querySelectorAll("#chart g.slice");
  console.log("Número de slices encontrados:", slices.length);
  for (const slice of slices) {
    let candidate = slice.__data__ ? (slice.__data__.data || slice.__data__) : null;
    if (candidate && candidate.id) {
      if (candidate.id.toLowerCase() === nodeId.toLowerCase() ||
          candidate.id.toLowerCase().includes(nodeId.toLowerCase())) {
        console.log("Slice encontrado para nodo:", candidate.id);
        slice.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        return;
      }
    }
  }
  console.log("No se encontró slice para nodo:", nodeId);
}
function drillToNode(nodeId) {
  renderTreemap(allNodes);
  const parts = nodeId.split("|");
  const sequence = [];
  let current = parts[0];
  for (let i = 1; i < parts.length; i++) {
    current += "|" + parts[i];
    sequence.push(current);
  }
  console.log("Secuencia para drill-down:", sequence);
  function step() {
    if (sequence.length === 0) {
      console.log("Drill-down completado.");
      return;
    }
    const nextId = sequence.shift();
    console.log("Simulando clic para nodo:", nextId);
    simulateSliceClick(nextId);
    setTimeout(step, 800);
  }
  setTimeout(step, 500);
}

// BLOQUE 8: Inicialización y asignación de eventos
document.addEventListener("DOMContentLoaded", () => {
  // Configuración de botones toggle del panel lateral.
  const toggleButtons = document.querySelectorAll(".toggle-btn");
  toggleButtons.forEach(button => {
    const targetId = button.getAttribute("data-target");
    const targetSection = document.getElementById(targetId);
    targetSection.style.display = "block";
    button.textContent = "−";
    button.addEventListener("click", function () {
      if (targetSection.style.display === "none") {
        targetSection.style.display = "block";
        this.textContent = "−";
      } else {
        targetSection.style.display = "none";
        this.textContent = "+";
      }
    });
  });
  const fileInput = document.getElementById("fileInput");
  const generateBtn = document.getElementById("generateBtn");
  const resetBtn = document.getElementById("resetBtn");
  const searchInput = document.getElementById("search");
  const clearButton = document.querySelector(".clear-button");
  const dropdownButton = document.querySelector(".dropdown-button");
  const levelDropdown = document.getElementById("levelDropdown");
  const loadingIndicator = document.getElementById("loadingIndicator");
  
  // Asegúrate de tener en tu HTML elementos con id "codelabel" y "totalCasosLabel"
  
const display = document.getElementById("fileName");

fileInput.addEventListener("change", async () => {
  if (!fileInput.files.length) return;

  display.textContent = fileInput.files[0].name;

  try {
    const data = await leerExcel(fileInput.files[0]);
    excelDataGlobal = data;
    populateFilters(data);
    generateBtn.disabled = false;
    searchInput.disabled = false;
    resetBtn.disabled = false;

    // Contraer la sección "Cargar Excel"
    $('#collapseExcel').collapse('hide');

    // Expandir "Generar Treemap" con una breve pausa para evitar conflictos de transición
    setTimeout(() => {
      $('#collapseGenerate').collapse('show');
    }, 200); // Esperamos 500ms para que el colapso termine antes de expandir
    setTimeout(() => {
      $('#collapseNavegacion').collapse('show');
    }, 200); // Esperamos 500ms para que el colapso termine antes de expandir

  } catch (err) {
    console.error("Error al leer el archivo Excel:", err);
    alert("Error al leer el archivo Excel: " + err.message);
  }
});
  
  generateBtn.addEventListener("click", async () => {
    if (Object.keys(mapping).length === 0) {
      await loadMapping();
    }
    if (!excelDataGlobal.length) {
      alert("No hay datos cargados.");
      return;
    }
    loadingIndicator.style.display = "block";
    setTimeout(() => {
      const filteredData = filterExcelData(excelDataGlobal);
      if (!filteredData.length) {
        alert("No se encontraron registros que coincidan con los filtros seleccionados.");
        loadingIndicator.style.display = "none";
        return;
      }
      // Separamos los registros en dos grupos:
      // 1. Los que tienen categoría (normal) y se mostrarán en el treemap.
      // 2. Los que tienen categoría igual a "Sin Información" o no aparecen en el diccionario,
      //    que se considerarán como "no considerados".
      let treemapData = [];
      let nonConsideredData = [];
      filteredData.forEach(row => {
        let codeRaw = row["CATEGORIA"];
        let code = codeRaw ? codeRaw.toString().trim().toUpperCase() : "";
        let cases = Number(row.TOTAL_REGISTROS) || 0;
        // Si no hay código, lo saltamos.
        if (!code) return;
        let rec = mapping[code];
        // Si no se encontró en el diccionario o la categoría normalizada es "Sin Información", se agrupa como no considerado.
        if (!rec || normalize(rec.categoria) === "Sin Información") {
          nonConsideredData.push(row);
        } else {
          treemapData.push(row);
        }
      });
  
      // Agrupamos los registros no considerados
      let nonConsideredMap = {};
      nonConsideredData.forEach(row => {
        let codeRaw = row["CATEGORIA"];
        let code = codeRaw ? codeRaw.toString().trim().toUpperCase() : "";
        let cases = Number(row.TOTAL_REGISTROS) || 0;

        // Obtenemos el registro del diccionario (si existe)
        let rec = mapping[code];
        // Si existe, usamos su descripción; de lo contrario, usamos "No considerado"
        let desc = rec && rec.descripcion ? rec.descripcion.trim() : "No considerado";

        if (!nonConsideredMap[code]) {
          nonConsideredMap[code] = { description: desc, cases: 0 };
        }
        nonConsideredMap[code].cases += cases;
      });
      let nonConsideredCodes = [];
      for (const code in nonConsideredMap) {
        nonConsideredCodes.push({
          code: code || "(sin código)",
          description: nonConsideredMap[code].description,
          cases: nonConsideredMap[code].cases
        });
      }
      const totalNonConsidered = Object.values(nonConsideredMap).reduce((sum, item) => sum + item.cases, 0);
  
      // Construimos el treemap solo con los registros que tienen categoría definida.
      allNodes = construirNodos(treemapData);
      let nodesToRender = allNodes;
      const levelVal = levelDropdown.value;
      if (levelVal !== "null") {
        nodesToRender = nodesToRender.filter(n => n.id.split("|").length <= Number(levelVal));
      }
      const totalSinCategoria = nonConsideredData.reduce((sum, row) => {
        let code = row["CATEGORIA"] ? row["CATEGORIA"].toString().trim().toUpperCase() : "";
        return sum + (Number(row.TOTAL_REGISTROS) || 0);
      }, 0);
      const nodoRaiz = allNodes.find(n => n.id === ROOT);
      const totalTreemap = nodoRaiz ? nodoRaiz.value : 0;
      const totalCasos = totalSinCategoria + totalTreemap;
  
      // Actualizamos los totales en la interfaz.
      document.getElementById("codelabel").innerHTML =
        "Total de Códigos CIE10 no considerados en la GBD: " + totalSinCategoria.toLocaleString() +
        "<br><span id='verCodigos' style='color:blue; cursor:pointer;'>Ver Códigos CIE-10 (ctrl+click)</span>";
      document.getElementById("totalCasosLabel").innerHTML =
        "Total de casos: " + totalCasos.toLocaleString();
  
      renderTreemap(nodesToRender);
      setTimeout(() => { Plotly.Plots.resize("chart"); }, 50);
      loadingIndicator.style.display = "none";
  
      // Listener para el modal de códigos no considerados
      document.getElementById("verCodigos").addEventListener("click", function(e) {
        if (!e.ctrlKey) return;
        verNonConsideredModal(nonConsideredCodes);
      });
    }, 500);
  });
  
  resetBtn.addEventListener("click", () => {
    searchInput.value = "";
    const filteredData = filterExcelData(excelDataGlobal);
    allNodes = construirNodos(filteredData);
    renderTreemap(allNodes);
  });
  clearButton.addEventListener("click", () => {
    searchInput.value = "";
    autoCompleteInstance.close();
  });
  dropdownButton.addEventListener("click", () => {
    autoCompleteInstance.evaluate();
    searchInput.focus();
  });
  searchInput.addEventListener("awesomplete-selectcomplete", function() {
    const label = this.value;
    const nodeId = labelToNodeId[label];
    console.log("Se seleccionó:", label, "-> nodeId:", nodeId);
    if (nodeId) {
      drillToNode(nodeId);
      autoCompleteInstance.close();
    }
  });
  levelDropdown.addEventListener("change", function() {
    const selectedLevel = this.value === "null" ? null : parseInt(this.value);
    Plotly.restyle("chart", { maxdepth: [selectedLevel] });
  });
});

// BLOQUE 9: Depuración (opcional)
function debugPrintTreemap(data) {
  const hierarchy = construirNodos(data);
  console.log("Estructura completa del Treemap:", hierarchy);
}