import { generateInvoice } from './client-doc/invoice.js';
import { generateUPD } from './client-doc/upd.js';

let updHtml;
let doc;
let showSignature = true;
let showStamp = true;
let docData; // Храним данные для перегенерации
let docType;

(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('id_invoice');
    const sig = urlParams.get('sig');
    docType = urlParams.get('type') || 'bill';

    if (!invoiceId) {
        const errText = 'ID счёта не найден в URL. Проверьте ссылку.';
        showError(errText);
        return;
    }

    fetch(`/get_invoice.php?id_invoice=${invoiceId}&sig=${sig}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
        })
        .then(json => {
            docData = json;
            updateDoc();
        })
        .catch(error => {
            console.error('Ошибка загрузки данных:', error);
            showError('Не удалось загрузить данные счёта. Попробуйте позже или проверьте соединение.');
        });
})();

function updateDoc() {
    if (!docData) return;
    const generateDoc = { upd: generateUPD, bill: generateInvoice }[docType];
    doc = generateDoc(docData, { signature: showSignature, stamp: showStamp });

    const docElement = document.getElementById('doc');
    docElement.className = '';
    docElement.classList.add('page', `page--A4-${doc.orientation}`);
    docElement.innerHTML = doc.html;

    document.title = `${doc.title} №${docData.nomer} от ${docData.inv_date}. ${docData.seller.name}`;
}

function showError(message) {
    console.error(message);
    const div = document.createElement('div');
    div.style.color = 'red';
    div.textContent = message;
    document.body.prepend(div);
}

// Слушатели для панели
const signatureCheckbox = document.getElementById('signature-checkbox');
const stampCheckbox = document.getElementById('stamp-checkbox');
const printButton = document.querySelector('.control-panel__button--print');
const saveButton = document.querySelector('.control-panel__button--save');

signatureCheckbox.addEventListener('change', (e) => {
    showSignature = e.target.checked;
    e.target.setAttribute('aria-checked', showSignature);
    updateDoc();
});

stampCheckbox.addEventListener('change', (e) => {
    showStamp = e.target.checked;
    e.target.setAttribute('aria-checked', showStamp);
    updateDoc();
});

printButton.addEventListener('click', () => {
    window.print();
});

saveButton.addEventListener('click', () => {
    const fullHtml = `<!doctype html><html lang="ru">${document.head.outerHTML}<body>${document.getElementById('doc').outerHTML}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Динамическое имя файла
    let filename = 'doc.html'; // Fallback
    if (docData) {
        const date = docData.inv_date.replace(/[^0-9-]/g, ''); // Очищаем дату на всякий
        const number = docData.nomer;
        filename = sanitizeFilename(`${docData.seller.name}-${doc.title}-${date}-${number}.html`);
    }

    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
});

// Функция для очистки имени файла (удаляем/заменяем недопустимые символы)
function sanitizeFilename(name) {
    return name.replace(/[\/\\:*?"<>|]/g, '_').trim();
}
