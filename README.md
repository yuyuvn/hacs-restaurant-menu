# Restaurant Menu Card

A Home Assistant dashboard card that shows the items of a **to-do list** as a
hand-written **restaurant chalkboard menu**, with a wooden frame, chalk
lettering, sections, dotted price leaders and "sold out" items.

It works with any `todo.*` entity (Shopping List, Local To-do, Google Tasks,
etc.) and updates live when the list changes.

## Installation

### HACS (custom repository)

1. In HACS, open the menu (⋮) and choose **Custom repositories**.
2. Add this repository's URL with the type **Dashboard**.
3. Search for **Restaurant Menu Card**, install it, then reload the browser.

### Manual

1. Copy `dist/restaurant-menu-card.js` to `<config>/www/restaurant-menu-card.js`.
2. Add a dashboard resource (**Settings → Dashboards → ⋮ → Resources**):
   `/local/restaurant-menu-card.js` with the type **JavaScript module**.

## Usage

Add the card through the UI (search for "Restaurant Menu") or in YAML:

```yaml
type: custom:restaurant-menu-card
entity: todo.restaurant_menu
title: Today's Menu
subtitle: Fresh from the kitchen
footer: Bon appétit!
columns: 2
```

### Writing your menu in the to-do list

| To-do item                       | Shows as                               |
| -------------------------------- | -------------------------------------- |
| `# Mains`                        | Section heading "MAINS"                |
| `Phở bò - 65k`                   | Phở bò ........ 65k                    |
| `Fish & Chips .... $12`          | Fish & Chips ........ $12              |
| `Bún chả: 60k` / `Latte \| 4.5`  | Name with the price on the right       |
| `Grilled salmon €18`             | Prices with a currency are detected    |
| `Fresh coconut`                  | Item with no price                     |

- The item **description** is shown under the dish in smaller chalk. A
  heading's description is shown under that heading.
- **Completed** items are hidden. Turn on `show_completed` to show them crossed
  out with a "sold out" tag.
- The menu keeps the same order as the to-do list, so you can drag items to
  reorder it.

## Options

| Option              | Type    | Default        | Description                                                  |
| ------------------- | ------- | -------------- | ------------------------------------------------------------ |
| `entity`            | string  | **required**   | The `todo.*` entity to show                                  |
| `title`             | string  | list name      | The big title at the top                                     |
| `subtitle`          | string  |                | Smaller text under the title                                 |
| `footer`            | string  |                | Text at the bottom of the board                              |
| `title_tap_action`  | action  | none           | What happens when the title is tapped (see below)            |
| `columns`           | number  | `1`            | Number of menu columns (1–4)                                 |
| `board`             | string  | `black`        | `black` or `green` chalkboard                                |
| `show_completed`    | boolean | `false`        | Show completed items as "sold out"                           |
| `show_descriptions` | boolean | `true`         | Show item descriptions                                       |
| `parse_prices`      | boolean | `true`         | Detect prices in the item text                               |
| `tap_to_complete`   | boolean | `false`        | Tap an item to mark it sold out or available again           |
| `frame`             | boolean | `true`         | Show the wooden frame and chalk tray                         |
| `chalk_fonts`       | boolean | `true`         | Load chalk-style fonts from Google Fonts (turn off if offline) |

### Title tap action

`title_tap_action` uses the same format as the `tap_action` option on Home
Assistant's built-in cards, so all standard actions work: `navigate`, `url`,
`more-info`, `perform-action`, `toggle`, `assist` and `none`. You can also set
it in the visual editor.

```yaml
type: custom:restaurant-menu-card
entity: todo.restaurant_menu
title_tap_action:
  action: navigate
  navigation_path: /dashboard-kitchen/menu
```

```yaml
title_tap_action:
  action: more-info   # opens the to-do list
```

## Development

The card is a single JavaScript file with no build step. To preview it without
Home Assistant, run this from the repository root:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/demo/>.
