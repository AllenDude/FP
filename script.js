let items = [];

fetch("items.json")
    .then(response => response.json())
    .then(data => {
        items = data;
        renderItems();
        createAlphabetNav();
    });

const container = document.getElementById("itemsContainer");
const alphabetNav = document.getElementById("alphabetNav");

function renderItems() {

    container.innerHTML = "";

    // Keep original index for export
    const displayItems = items.map((item, index) => ({
        ...item,
        originalIndex: index
    }));

    // Alphabetical display only
    displayItems.sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    let currentLetter = "";

    displayItems.forEach((item) => {

        const firstLetter = item.name.charAt(0).toUpperCase();

        if (firstLetter !== currentLetter) {

            currentLetter = firstLetter;

            const letterHeader = document.createElement("div");
            letterHeader.className = "letter-header";
            letterHeader.id = `letter-${currentLetter}`;

            letterHeader.textContent = currentLetter;

            container.appendChild(letterHeader);
        }

        const card = document.createElement("div");
        card.className = "item-card";

        card.innerHTML = `
            <div class="item-title">${item.name}</div>

            <div class="variants" id="variants-${item.originalIndex}"></div>

            <button
                class="add-type"
                onclick="addVariant(${item.originalIndex})">
                + Additional Type
            </button>
        `;

        container.appendChild(card);

        if (item.types && item.types.length > 0) {

            item.types.forEach(type => {
                createVariantRow(item.originalIndex, type);
            });

        } else {

            createVariantRow(item.originalIndex, item.name);

        }

    });

}

function createAlphabetNav() {

    alphabetNav.innerHTML = "";

    const letters = new Set();

    items.forEach(item => {
        letters.add(item.name.charAt(0).toUpperCase());
    });

    [...letters]
        .sort()
        .forEach(letter => {

            const link = document.createElement("a");

            link.href = `#letter-${letter}`;
            link.textContent = letter;

            alphabetNav.appendChild(link);

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

        // Export still follows ORIGINAL JSON ORDER
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

                // School Supplies Exception
                if (item.name === "School Supplies") {

                    if (type === item.name || !type) {
                        line = `${quantityText} School Supplies`;
                    } else {
                        line = `${quantityText} ${type}`;
                    }

                } else {

                    if (type === item.name) {
                        line = `${quantityText} ${item.name}`;
                    } else {
                        line = `${quantityText} ${item.name} ${type}`;
                    }

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