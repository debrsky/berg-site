// Подсветка цены, её диапазона и города назначения в каждой таблице прайса.
const priceCellSelector = ".pricing__table td[tabindex]";
const columnClass = "pricing__active-column";

for (const table of document.querySelectorAll(".pricing__table")) {
  let hoveredCell = null;
  let focusedCell = null;

  const render = () => {
    table
      .querySelectorAll(
        `.pricing__active-row, .${columnClass}, .pricing__active-cell`
      )
      .forEach((element) =>
        element.classList.remove(
          "pricing__active-row",
          columnClass,
          "pricing__active-cell"
        )
      );

    const cell = hoveredCell || focusedCell;
    if (!cell) return;

    const column = cell.cellIndex;
    cell.parentElement
      .querySelectorAll("th, td")
      .forEach((element) => element.classList.add("pricing__active-row"));
    for (const row of table.tBodies[0].rows) {
      const price = row.cells[column];
      // В строке «Машинорейс» одна объединённая ячейка вместо цен.
      if (price && price.colSpan === 1) price.classList.add(columnClass);
    }
    table.tHead.rows[1].cells[column - 1]?.classList.add(columnClass);
    cell.classList.add("pricing__active-cell");
  };

  table.addEventListener("pointerover", (event) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    const cell = event.target.closest(priceCellSelector);
    if (cell === hoveredCell) return;
    hoveredCell = cell;
    render();
  });
  table.addEventListener("pointerleave", () => {
    hoveredCell = null;
    render();
  });
  table.addEventListener("focusin", (event) => {
    focusedCell = event.target.closest(priceCellSelector);
    render();
  });
  table.addEventListener("focusout", () => {
    focusedCell = null;
    render();
  });
  table.addEventListener("click", (event) => {
    const cell = event.target.closest(priceCellSelector);
    if (cell) cell.focus(); // Касание на мобильном также выбирает цену.
  });
}

// Печатать все направления, даже если они свернуты на экране.
const directions = document.querySelectorAll(".pricing__directions details");
let openedForPrint = [];
window.addEventListener("beforeprint", () => {
  openedForPrint = [...directions].filter((details) => !details.open);
  openedForPrint.forEach((details) => {
    details.open = true;
  });
});
window.addEventListener("afterprint", () => {
  openedForPrint.forEach((details) => {
    details.open = false;
  });
  openedForPrint = [];
});

// Снять выбор на сенсорном экране при касании вне ячейки с ценой.
document.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch" || event.target.closest(priceCellSelector))
    return;
  if (document.activeElement?.matches(priceCellSelector)) {
    document.activeElement.blur();
  }
});
