"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// pdfjs-dist v4+ is published as ESM-only, but this project compiles to
// CommonJS. Load it through a dynamic import created with the Function
// constructor so tsc does not transpile it into a require() call.
const loadPdfJsLib = () => new Function('return import("pdfjs-dist/legacy/build/pdf.mjs")')();
class PDF {
    static async getPageText(pdf, pageNo) {
        const page = await pdf.getPage(pageNo);
        const tokenizedText = await page.getTextContent();
        return tokenizedText.items.map((token) => token.str).join('\n');
    }
    static async getPDFText(source) {
        // pdf.js v4 rejects Node Buffers; pass a plain Uint8Array copy instead
        if (source && source.data instanceof Uint8Array) {
            source = { ...source, data: new Uint8Array(source.data) };
        }
        const pdfJsLib = await loadPdfJsLib();
        const pdf = await pdfJsLib.getDocument(source).promise;
        const maxPages = pdf.numPages;
        const pageTextPromises = [];
        for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
            pageTextPromises.push(PDF.getPageText(pdf, pageNo));
        }
        const pageTexts = await Promise.all(pageTextPromises);
        return pageTexts.join('\n');
    }
}
exports.default = PDF;
