let items = [];

fetch("items.json")
    .then(response => response.json())
    .then(data => {
        items = data;
        renderItems();
    });

const container = document.getElementById("itemsContainer");

function renderItems() {

    container.innerHTML = "";

    items.forEach((item, index) => {

        const card = document.createElement("div");
        card.className = "item-card";

        card.innerHTML = `
            <div class="item-title">${item.name}</div>

            <div class="variants" id="variants-${index}"></div>

            <button
                class="add-type"
                onclick="addVariant(${index})">
                + Additional Type
            </button>
        `;

        container.appendChild(card);

        if (item.types && item.types.length > 0) {

            item.types.forEach(type => {
                createVariantRow(index, type);
            });

        } else {

            createVariantRow(index, item.name);

        }

    });

}

function createVariantRow(itemIndex, typeName = "") {

    const holder = document.getElementById(`variants-${itemIndex}`);

    const row = document.createElement("div");
    row.className = "variant-row";

    row.innerHTML = `
        <input
            class="variant-name"
            type="text"
            value="${typeName}"
            placeholder="Type"
        >

        <input
            class="pieces"
            type="text"
            placeholder="Qty"
        >

        <label>
            <input type="checkbox" class="buo">
            Buo
        </label>

        <label>
            <input type="checkbox" class="chichirya">
            Chichirya
        </label>
    `;

    holder.appendChild(row);
}

function addVariant(itemIndex) {
    createVariantRow(itemIndex);
}

document
    .getElementById("exportBtn")
    .addEventListener("click", () => {

        let normalItems = [];
        let buoItems = [];
        let chichiryaItems = [];

        items.forEach((item, index) => {

            const rows = document.querySelectorAll(
                `#variants-${index} .variant-row`
            );

            rows.forEach(row => {

                const type = row
                    .querySelector(".variant-name")
                    .value
                    .trim();

                const qty = row
                    .querySelector(".pieces")
                    .value
                    .trim();

                const isBuo = row
                    .querySelector(".buo")
                    .checked;

                const isChichirya = row
                    .querySelector(".chichirya")
                    .checked;

                if (!qty) {
                    return;
                }

                let quantityText;

                if (/^\d+$/.test(qty)) {
                    quantityText = `${qty}pcs.`;
                } else {
                    quantityText = qty;
                }

                let line;

                if (type === item.name) {
                    line = `${quantityText} ${item.name}`;
                } else {
                    line = `${quantityText} ${item.name} ${type}`;
                }

                if (isBuo) {
                    buoItems.push(line);
                }
                else if (isChichirya) {
                    chichiryaItems.push(line);
                }
                else {
                    normalItems.push(line);
                }

            });

        });

        let result = "ORENCIO MENDOZA\n\n";

        if (normalItems.length > 0) {
            result += normalItems.join("\n");
        }

        if (buoItems.length > 0) {

            if (result.trim() !== "ORENCIO MENDOZA") {
                result += "\n\n";
            }

            result += "BUO\n\n";
            result += buoItems.join("\n");
        }

        if (chichiryaItems.length > 0) {

            if (
                normalItems.length > 0 ||
                buoItems.length > 0
            ) {
                result += "\n\n";
            }

            result += "CHICHIRYA\n\n";
            result += chichiryaItems.join("\n");
        }

        document.getElementById("output").value = result;

    });