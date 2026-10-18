const CODE_PREFIX = "ORD1:";

let items = [];

// Used only to fill the page when it is (re)built, e.g. after Import or Clear All
let saved = {};

const container = document.getElementById("itemsContainer");
const alphabetNav = document.getElementById("alphabetNav");
const output = document.getElementById("output");

fetch(`items.json?v=${Date.now()}`)
    .then(response => response.json())
    .then(data => {
        items = data;
        renderItems();
        createAlphabetNav();
        updateOutput();
    });

/* ========================================= */
/* Rendering                                 */
/* ========================================= */

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

        const title = document.createElement("div");
        title.className = "item-title";
        title.textContent = item.name;

        const variants = document.createElement("div");
        variants.className = "variants";
        variants.id = `variants-${item.originalIndex}`;

        const addBtn = document.createElement("button");
        addBtn.className = "add-type";
        addBtn.textContent = "+ Additional Type";
        addBtn.addEventListener("click", () => addVariant(item.originalIndex));

        card.appendChild(title);
        card.appendChild(variants);
        card.appendChild(addBtn);

        container.appendChild(card);

        const defaults = (item.types && item.types.length > 0)
            ? item.types
            : [item.name];

        const savedRows = saved[item.name] || [];

        // Default rows, filled from imported data when available
        defaults.forEach(type => {

            const match = savedRows.find(r => r.key === type);

            createVariantRow(item.originalIndex, type, type, match);

        });

        // Rows that were added by hand
        savedRows
            .filter(r => r.key === null)
            .forEach(r => {
                createVariantRow(item.originalIndex, r.type, null, r);
            });

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

function createVariantRow(itemIndex, typeName = "", key = null, state = null) {

    const holder = document.getElementById(`variants-${itemIndex}`);

    const row = document.createElement("div");
    row.className = "variant-row";
    row.dataset.key = key === null ? "" : key;

    row.innerHTML = `
        <input
            class="variant-name"
            type="text"
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

        <label>
            <input type="checkbox" class="promo">
            Promo
        </label>
    `;

    // Set values through the DOM so quotes or symbols can't break anything
    row.querySelector(".variant-name").value =
        state && state.type !== undefined ? state.type : typeName;

    row.querySelector(".pieces").value = state ? state.qty : "";

    if (state && state.flag) {
        const box = row.querySelector(`.${state.flag}`);
        if (box) box.checked = true;
    }

    holder.appendChild(row);

}

function addVariant(itemIndex) {
    createVariantRow(itemIndex);
}

/* ========================================= */
/* Building the order text                   */
/* ========================================= */

function buildText() {

    let normalItems = [];
    let buoItems = [];
    let chichiryaItems = [];
    let promoItems = [];

    // Follows ORIGINAL JSON ORDER
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

            const isPromo = row
                .querySelector(".promo")
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
            else if (isPromo) {
                promoItems.push(line);
            }
            else {
                normalItems.push(line);
            }

        });

    });

    // Nothing entered yet
    if (
        normalItems.length === 0 &&
        buoItems.length === 0 &&
        chichiryaItems.length === 0 &&
        promoItems.length === 0
    ) {
        return "";
    }

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

    if (promoItems.length > 0) {

        if (
            normalItems.length > 0 ||
            buoItems.length > 0 ||
            chichiryaItems.length > 0
        ) {
            result += "\n\n";
        }

        result += "PROMO\n\n";
        result += promoItems.join("\n");
    }

    return result;

}

function updateOutput() {
    output.value = buildText();
}

/* ========================================= */
/* Export / import code                      */
/* ========================================= */

// Reads the page into a compact list: [[itemName, [[key, type, qty, flag], ...]], ...]
function collectState() {

    const state = [];

    items.forEach((item, index) => {

        const rows = [];

        document
            .querySelectorAll(`#variants-${index} .variant-row`)
            .forEach(row => {

                const qty = row.querySelector(".pieces").value.trim();

                if (!qty) {
                    return;
                }

                const key = row.dataset.key === "" ? null : row.dataset.key;

                let flag = "";
                if (row.querySelector(".buo").checked) flag = "buo";
                else if (row.querySelector(".chichirya").checked) flag = "chichirya";
                else if (row.querySelector(".promo").checked) flag = "promo";

                rows.push([
                    key,
                    row.querySelector(".variant-name").value,
                    qty,
                    flag
                ]);

            });

        if (rows.length > 0) {
            state.push([item.name, rows]);
        }

    });

    return state;

}

function encodeCode(state) {

    const bytes = new TextEncoder().encode(JSON.stringify(state));

    let binary = "";
    bytes.forEach(b => binary += String.fromCharCode(b));

    return CODE_PREFIX + btoa(binary);

}

function decodeCode(code) {

    code = code.replace(/\s+/g, "");

    if (!code.startsWith(CODE_PREFIX)) {
        throw new Error("Not a valid code");
    }

    const binary = atob(code.slice(CODE_PREFIX.length));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const state = JSON.parse(new TextDecoder().decode(bytes));

    if (!Array.isArray(state)) {
        throw new Error("Not a valid code");
    }

    const result = {};

    state.forEach(entry => {

        if (!Array.isArray(entry) || !Array.isArray(entry[1])) {
            return;
        }

        result[entry[0]] = entry[1].map(r => ({
            key: (typeof r[0] === "string") ? r[0] : null,
            type: String(r[1] ?? ""),
            qty: String(r[2] ?? ""),
            flag: ["buo", "chichirya", "promo"].includes(r[3]) ? r[3] : ""
        }));

    });

    return result;

}

/* ========================================= */
/* Clipboard, toast, modal                   */
/* ========================================= */

async function copyText(text) {

    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        // fall through to the old method
    }

    try {

        const temp = document.createElement("textarea");
        temp.value = text;
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();

        const ok = document.execCommand("copy");

        document.body.removeChild(temp);

        return ok;

    } catch (e) {
        return false;
    }

}

let toastTimer;

function showToast(message) {

    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);

}

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalOk = document.getElementById("modalOk");
const modalCancel = document.getElementById("modalCancel");

let modalAction = null;

function openModal({ title, value = "", readOnly = false, okText, onOk }) {

    modalTitle.textContent = title;
    modalText.value = value;
    modalText.readOnly = readOnly;
    modalOk.textContent = okText;
    modalAction = onOk;

    modal.classList.add("show");

    modalText.focus();

    if (readOnly) {
        modalText.select();
    }

}

function closeModal() {
    modal.classList.remove("show");
    modalAction = null;
}

modalCancel.addEventListener("click", closeModal);

modalOk.addEventListener("click", () => {
    if (modalAction) {
        modalAction(modalText.value);
    } else {
        closeModal();
    }
});

/* ========================================= */
/* Events                                    */
/* ========================================= */

// Only one of Buo / Chichirya / Promo per row
container.addEventListener("change", (e) => {

    if (e.target.type === "checkbox" && e.target.checked) {

        e.target
            .closest(".variant-row")
            .querySelectorAll('input[type="checkbox"]')
            .forEach(box => {
                if (box !== e.target) box.checked = false;
            });

    }

    updateOutput();

});

container.addEventListener("input", updateOutput);

// EXPORT: turn the current list into a code and copy it
document
.getElementById("exportBtn")
.addEventListener("click", async () => {

    const state = collectState();

    if (state.length === 0) {
        showToast("Nothing to export yet");
        return;
    }

    const code = encodeCode(state);

    if (await copyText(code)) {
        showToast("Code copied");
    } else {
        // Clipboard blocked, let them copy it by hand
        openModal({
            title: "Copy this code",
            value: code,
            readOnly: true,
            okText: "Close",
            onOk: closeModal
        });
    }

});

// IMPORT: paste a code and the list fills itself in
document
.getElementById("importBtn")
.addEventListener("click", () => {

    openModal({
        title: "Paste the code",
        value: "",
        readOnly: false,
        okText: "Import",
        onOk: (code) => {

            try {
                saved = decodeCode(code);
            } catch (e) {
                showToast("That code didn't work");
                return;
            }

            renderItems();
            updateOutput();
            closeModal();
            showToast("Imported");

        }
    });

});

// COPY LIST: copy the actual order text
document
.getElementById("copyBtn")
.addEventListener("click", async () => {

    const text = buildText();

    if (!text) {
        showToast("List is empty");
        return;
    }

    if (await copyText(text)) {
        showToast("List copied");
    } else {
        showToast("Couldn't copy, select the text and copy it");
    }

});

// CLEAR ALL
document
.getElementById("clearBtn")
.addEventListener("click", () => {

    if (!confirm("Clear everything and start a new list?")) {
        return;
    }

    saved = {};

    renderItems();
    updateOutput();

});
