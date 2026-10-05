/**
 * Restaurant Menu Card
 * A Home Assistant Lovelace card that renders the items of a to-do list
 * as a hand-written restaurant chalkboard menu.
 */

const CARD_VERSION = "1.0.2";
const CARD_TAG = "restaurant-menu-card";
const EDITOR_TAG = "restaurant-menu-card-editor";

const FONT_LINK_ID = "restaurant-menu-card-fonts";
const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Pacifico&subset=vietnamese&display=swap";

const DEFAULTS = {
  title: "",
  subtitle: "",
  footer: "",
  columns: 1,
  board: "black",
  show_completed: false,
  show_descriptions: true,
  parse_prices: true,
  tap_to_complete: false,
  frame: true,
  chalk_fonts: true,
};

const SECTION_COLORS = ["#f9e27d", "#f7a8c4", "#9fd8f5", "#b8f0a8", "#ffc48a"];

// "Pho - 8", "Pho .... $8", "Pho: 45k", "Pho | 8.50"
const PRICE = String.raw`(?:[$€£¥₫]\s?)?\d[\d.,]*(?:\s?(?:[$€£¥₫đ]|k|K|vnd|VND|usd|USD|eur|EUR))?`;
const SEPARATED_PRICE_RE = new RegExp(String.raw`^(.*?\S)\s*(?:\.{2,}|…+|\s[-–—@]|[:|])\s*(${PRICE})\s*$`);
// "Pho $8", "Pho 45k", "Pho 8€" (bare numbers are not treated as prices)
const CURRENCY_PRICE_RE = new RegExp(
  String.raw`^(.*?\S)\s+((?:[$€£¥₫]\s?\d[\d.,]*|\d[\d.,]*\s?(?:[$€£¥₫đ]|k|K|vnd|VND|usd|USD|eur|EUR)))\s*$`
);

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function loadChalkFonts() {
  if (document.getElementById(FONT_LINK_ID)) return;
  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = FONT_URL;
  document.head.appendChild(link);
}

function parseSummary(summary, parsePrices) {
  const text = String(summary ?? "").trim();
  if (!parsePrices) return { name: text, price: "" };
  const match = text.match(SEPARATED_PRICE_RE) || text.match(CURRENCY_PRICE_RE);
  return match ? { name: match[1].trim(), price: match[2].trim() } : { name: text, price: "" };
}

/** Split the flat to-do list into sections. Items starting with "#" become section headings. */
function buildSections(items, config) {
  const sections = [{ title: "", description: "", items: [] }];
  for (const item of items) {
    const summary = String(item.summary ?? "").trim();
    if (summary.startsWith("#")) {
      sections.push({
        title: summary.replace(/^#+\s*/, ""),
        description: item.description || "",
        items: [],
      });
      continue;
    }
    if (item.status === "completed" && !config.show_completed) continue;
    sections[sections.length - 1].items.push({
      ...parseSummary(summary, config.parse_prices),
      uid: item.uid,
      description: item.description || "",
      completed: item.status === "completed",
    });
  }
  return sections.filter((section) => section.title || section.items.length);
}

const FLOURISH = `
  <svg class="flourish" viewBox="0 0 240 24" aria-hidden="true">
    <path d="M4 12 C 40 2, 70 22, 104 12" />
    <path d="M136 12 C 170 2, 200 22, 236 12" />
    <path d="M120 3 L123 10 L130 12 L123 14 L120 21 L117 14 L110 12 L117 10 Z" class="star" />
  </svg>`;

const STYLES = `
  :host { display: block; }
  ha-card {
    background: none;
    border: none;
    box-shadow: none;
    overflow: hidden;
  }
  .frame {
    padding: 14px;
    border-radius: var(--ha-card-border-radius, 12px);
    background:
      repeating-linear-gradient(95deg, rgba(0,0,0,.08) 0 2px, transparent 2px 7px),
      linear-gradient(135deg, #8b5a2b 0%, #5e3a1a 35%, #7a4b22 60%, #4a2c12 100%);
    box-shadow: 0 6px 18px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.08);
  }
  .frame.no-frame { padding: 0; background: none; box-shadow: none; }
  .board {
    --chalk: rgba(246, 244, 236, .93);
    --chalk-dim: rgba(246, 244, 236, .62);
    position: relative;
    padding: 24px 26px 20px;
    border-radius: 6px;
    color: var(--chalk);
    font-family: "Patrick Hand", "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive;
    font-size: 20px;
    line-height: 1.35;
    background-color: #232729;
    background-image:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
      radial-gradient(ellipse at 18% 22%, rgba(255,255,255,.08), transparent 45%),
      radial-gradient(ellipse at 82% 68%, rgba(255,255,255,.06), transparent 50%),
      radial-gradient(ellipse at 50% 105%, rgba(255,255,255,.05), transparent 55%);
    box-shadow: inset 0 0 40px rgba(0,0,0,.55);
    text-shadow: 0 0 1px rgba(255,255,255,.55), 0 0 6px rgba(255,255,255,.12);
  }
  .board.green { background-color: #2c4234; }
  .board.no-fonts { font-family: "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive; }

  header { text-align: center; margin-bottom: 14px; }
  .title {
    font-family: "Pacifico", "Patrick Hand", cursive;
    font-size: 1.9em;
    letter-spacing: 0;
    line-height: 1.45;
  }
  .no-fonts .title { font-family: inherit; }
  .subtitle { color: var(--chalk-dim); font-size: .95em; margin-top: 4px; }
  .flourish {
    display: block;
    width: min(240px, 70%);
    height: 24px;
    margin: 8px auto 0;
    fill: none;
    stroke: var(--chalk-dim);
    stroke-width: 1.6;
    stroke-linecap: round;
  }
  .flourish .star { fill: #f9e27d; stroke: none; opacity: .85; }

  .menu { column-gap: 32px; }
  .section { break-inside: avoid; margin-bottom: 14px; }
  .section-title {
    font-weight: 400;
    font-size: 1.3em;
    letter-spacing: .05em;
    text-transform: uppercase;
    text-align: center;
    margin: 4px 0 2px;
  }
  .section-title::before, .section-title::after { content: "~"; margin: 0 .4em; opacity: .7; }
  .section-description { text-align: center; color: var(--chalk-dim); font-size: .85em; margin-bottom: 6px; }

  .item { break-inside: avoid; padding: 4px 0; }
  .item.clickable { cursor: pointer; }
  .item-line { display: flex; align-items: baseline; }
  .item-name { font-size: 1.05em; }
  .dots {
    flex: 1;
    min-width: 16px;
    margin: 0 6px;
    border-bottom: 2px dotted rgba(246, 244, 236, .35);
    transform: translateY(-.25em);
  }
  .item-price { color: #f9e27d; white-space: nowrap; }
  .item-description {
    color: var(--chalk-dim);
    font-size: .82em;
    white-space: pre-line;
    padding-left: .6em;
  }
  .item.completed .item-name,
  .item.completed .item-price { text-decoration: line-through; opacity: .55; }
  .sold-out {
    display: inline-block;
    margin-left: 8px;
    padding: 0 6px;
    border: 1.5px solid #f7a8c4;
    border-radius: 4px;
    color: #f7a8c4;
    font-size: .7em;
    text-transform: uppercase;
    transform: rotate(-4deg);
  }

  .empty, .warning { text-align: center; color: var(--chalk-dim); padding: 18px 0; }
  .warning { color: #f7a8c4; }
  footer {
    text-align: center;
    color: var(--chalk-dim);
    margin-top: 6px;
    font-size: .95em;
  }
  .chalk-tray {
    height: 6px;
    margin: 10px 18% -4px;
    border-radius: 3px;
    background: linear-gradient(#3a2412, #24160a);
    position: relative;
  }
  .chalk-tray::after {
    content: "";
    position: absolute;
    left: 12%;
    top: -5px;
    width: 34px;
    height: 6px;
    border-radius: 3px;
    background: #f1efe6;
    box-shadow: 46px 0 0 #f7a8c4;
  }
  .no-frame .chalk-tray { display: none; }
`;

class RestaurantMenuCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._items = undefined;
    this._error = undefined;
    this._unsub = undefined;
    this.shadowRoot.addEventListener("click", (ev) => this._handleClick(ev));
  }

  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig(hass) {
    const entity = Object.keys(hass?.states || {}).find((id) => id.startsWith("todo.")) || "";
    return { entity, title: "Today's Menu", subtitle: "Fresh from the kitchen" };
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error("Please define a to-do list entity (e.g. todo.shopping_list)");
    }
    if (!String(config.entity).startsWith("todo.")) {
      throw new Error("The entity must be a to-do list (todo.*)");
    }
    const entityChanged = this._config?.entity !== config.entity;
    this._config = { ...DEFAULTS, ...config, columns: Math.min(4, Math.max(1, Number(config.columns) || 1)) };
    if (entityChanged) {
      this._unsubscribe();
      this._items = undefined;
      this._error = undefined;
      this._subscribe();
    }
    if (this._config.chalk_fonts) loadChalkFonts();
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const name = hass.states[this._config?.entity]?.attributes?.friendly_name;
    const exists = Boolean(hass.states[this._config?.entity]);
    if (name !== this._friendlyName || exists !== this._entityExists) {
      this._friendlyName = name;
      this._entityExists = exists;
      this._render();
    }
    this._subscribe();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    this._subscribe();
  }

  disconnectedCallback() {
    this._unsubscribe();
  }

  getCardSize() {
    const count = this._items?.length ?? 4;
    return 3 + Math.ceil(count / (this._config?.columns || 1));
  }

  getGridOptions() {
    return { columns: 12, min_columns: 4 };
  }

  _subscribe() {
    if (this._unsub || !this._hass || !this._config || !this.isConnected) return;
    if (!this._hass.states[this._config.entity]) return;
    const entityId = this._config.entity;
    this._unsub = this._hass.connection
      .subscribeMessage(
        (msg) => {
          this._items = msg.items || [];
          this._error = undefined;
          this._render();
        },
        { type: "todo/item/subscribe", entity_id: entityId }
      )
      .catch(async (err) => {
        // Older Home Assistant versions: fall back to a one-off fetch.
        try {
          const result = await this._hass.callWS({ type: "todo/item/list", entity_id: entityId });
          this._items = result.items || [];
        } catch (listErr) {
          this._error = listErr?.message || err?.message || String(listErr);
        }
        this._render();
        return undefined;
      });
  }

  _unsubscribe() {
    if (!this._unsub) return;
    const pending = this._unsub;
    this._unsub = undefined;
    pending.then((unsub) => typeof unsub === "function" && unsub()).catch(() => {});
  }

  _handleClick(ev) {
    if (!this._config?.tap_to_complete || !this._hass) return;
    const el = ev.composedPath().find((node) => node?.dataset?.uid);
    if (!el) return;
    const item = this._items?.find((i) => i.uid === el.dataset.uid);
    if (!item) return;
    this._hass.callService(
      "todo",
      "update_item",
      { item: item.uid, status: item.status === "completed" ? "needs_action" : "completed" },
      { entity_id: this._config.entity }
    );
  }

  _renderItem(item) {
    const c = this._config;
    const classes = ["item", item.completed ? "completed" : "", c.tap_to_complete ? "clickable" : ""].join(" ");
    const price = item.price
      ? `<span class="dots"></span><span class="item-price">${escapeHtml(item.price)}</span>`
      : "";
    const soldOut = item.completed ? `<span class="sold-out">sold out</span>` : "";
    const description =
      c.show_descriptions && item.description
        ? `<div class="item-description">${escapeHtml(item.description)}</div>`
        : "";
    return `
      <div class="${classes}" data-uid="${escapeHtml(item.uid)}">
        <div class="item-line"><span class="item-name">${escapeHtml(item.name)}</span>${soldOut}${price}</div>
        ${description}
      </div>`;
  }

  _renderBody() {
    const c = this._config;
    if (this._hass && !this._entityExists) {
      return `<div class="warning">Entity not found: ${escapeHtml(c.entity)}</div>`;
    }
    if (this._error) return `<div class="warning">${escapeHtml(this._error)}</div>`;
    if (this._items === undefined) return `<div class="empty">Writing today's menu…</div>`;

    const sections = buildSections(this._items, c);
    if (!sections.some((s) => s.items.length)) {
      return `<div class="empty">Today's specials coming soon…</div>`;
    }
    let colorIndex = 0;
    const html = sections
      .map((section) => {
        const color = section.title ? SECTION_COLORS[colorIndex++ % SECTION_COLORS.length] : "";
        const heading = section.title
          ? `<div class="section-title" style="color:${color}">${escapeHtml(section.title)}</div>` +
            (c.show_descriptions && section.description
              ? `<div class="section-description">${escapeHtml(section.description)}</div>`
              : "")
          : "";
        return `<div class="section">${heading}${section.items.map((i) => this._renderItem(i)).join("")}</div>`;
      })
      .join("");
    return `<div class="menu" style="column-count:${c.columns}">${html}</div>`;
  }

  _render() {
    if (!this._config) return;
    const c = this._config;
    const title = c.title || this._friendlyName || "Menu";
    const boardClasses = ["board", c.board === "green" ? "green" : "", c.chalk_fonts ? "" : "no-fonts"].join(" ");
    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <ha-card>
        <div class="frame ${c.frame ? "" : "no-frame"}">
          <div class="${boardClasses}">
            <header>
              <div class="title">${escapeHtml(title)}</div>
              ${c.subtitle ? `<div class="subtitle">${escapeHtml(c.subtitle)}</div>` : ""}
              ${FLOURISH}
            </header>
            ${this._renderBody()}
            ${c.footer ? `<footer>${escapeHtml(c.footer)}</footer>` : ""}
          </div>
          <div class="chalk-tray"></div>
        </div>
      </ha-card>`;
  }
}

const EDITOR_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "todo" } } },
  { name: "title", selector: { text: {} } },
  { name: "subtitle", selector: { text: {} } },
  { name: "footer", selector: { text: {} } },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "columns", selector: { number: { min: 1, max: 4, mode: "box" } } },
      {
        name: "board",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "black", label: "Blackboard" },
              { value: "green", label: "Green chalkboard" },
            ],
          },
        },
      },
    ],
  },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "show_completed", selector: { boolean: {} } },
      { name: "show_descriptions", selector: { boolean: {} } },
      { name: "parse_prices", selector: { boolean: {} } },
      { name: "tap_to_complete", selector: { boolean: {} } },
      { name: "frame", selector: { boolean: {} } },
      { name: "chalk_fonts", selector: { boolean: {} } },
    ],
  },
];

const EDITOR_LABELS = {
  entity: "To-do list",
  title: "Title (defaults to the list name)",
  subtitle: "Subtitle",
  footer: "Footer",
  columns: "Columns",
  board: "Board style",
  show_completed: "Show completed items as sold out",
  show_descriptions: "Show item descriptions",
  parse_prices: "Detect prices (e.g. \"Pho - 45k\")",
  tap_to_complete: "Tap an item to toggle sold out",
  frame: "Wooden frame",
  chalk_fonts: "Chalk fonts (Google Fonts)",
};

// Home Assistant lazy-loads <ha-form> and its pickers. Loading a built-in card's
// editor forces them to be defined so the custom editor isn't rendered empty.
let haFormLoading;
function loadHaForm() {
  if (customElements.get("ha-form") && customElements.get("ha-entity-picker")) return Promise.resolve();
  haFormLoading ||= (async () => {
    try {
      const helpers = await window.loadCardHelpers?.();
      const card = await helpers?.createCardElement({ type: "entities", entities: [] });
      await card?.constructor?.getConfigElement?.();
    } catch (err) {
      console.warn("restaurant-menu-card: could not preload ha-form", err);
    }
  })();
  return haFormLoading;
}

class RestaurantMenuCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    this._update();
  }

  connectedCallback() {
    loadHaForm().then(() => {
      this._formReady = true;
      this._update();
    });
  }

  _update() {
    if (!this._config || !this._hass || !this._formReady) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.schema = EDITOR_SCHEMA;
      this._form.computeLabel = (schema) => EDITOR_LABELS[schema.name] ?? schema.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._config = ev.detail.value;
        this.dispatchEvent(
          new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })
        );
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.data = { ...DEFAULTS, ...this._config };
  }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, RestaurantMenuCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, RestaurantMenuCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: "Restaurant Menu Card",
    description: "Shows a to-do list as a restaurant chalkboard menu.",
    preview: true,
    documentationURL: "https://github.com/yuyuvn/hacs-restaurant-menu",
  });
}

console.info(
  `%c RESTAURANT-MENU-CARD %c v${CARD_VERSION} `,
  "color:#f9e27d;background:#232729;font-weight:700;",
  "color:#232729;background:#f9e27d;"
);
