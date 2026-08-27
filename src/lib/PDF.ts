// pdfjs-dist v4+ is published as ESM-only, but this project compiles to
// CommonJS. Load it through a dynamic import created with the Function
// constructor so tsc does not transpile it into a require() call.
const loadPdfJsLib = (): Promise<any> => new Function('return import("pdfjs-dist/legacy/build/pdf.mjs")')();

export default class PDF {

    public static async getPageText(pdf: any, pageNo: number) {
        const page = await pdf.getPage(pageNo);
        const tokenizedText = await page.getTextContent();
        return tokenizedText.items.map((token: any) => token.str).join('\n');
    }

    public static async getPDFText(source: any): Promise<string> {
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
