const { chromium } = require('playwright');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { SingleBar } = require('cli-progress');

const mergePdfs = async (pdfBuffers) => {
    const mergedPdf = await PDFDocument.create();
    for (const pdfBuffer of pdfBuffers) {
        const pdf = await PDFDocument.load(pdfBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    return await mergedPdf.save();
};

const generatePdfFromLinks = async (links, outputPath) => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // 修改为你本地Chrome的路径
        headless: true // 以无头模式运行
    });

    const page = await browser.newPage();

    try {
        const progressBar = new SingleBar({
            format: 'Generating PDF | {bar} | {percentage}% | ETA: {eta}s | {value}/{total} pages',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
        });
        progressBar.start(links.length, 0);

        const pdfPromises = links.map(async (link, index) => {
            console.log(link)
            await page.goto(link, { waitUntil: 'networkidle' });
            const pdfBuffer = await page.pdf({ format: 'A4' });
            progressBar.increment();
            return pdfBuffer;
        });

        const pdfBuffers = await Promise.all(pdfPromises);
        await browser.close();

        progressBar.stop();
        const mergedPdf = await mergePdfs(pdfBuffers);
        fs.writeFileSync(outputPath, mergedPdf);
        console.log('PDF generated successfully!');
    } catch (error) {
        console.error('Error generating PDF:', error);
        await browser.close();
    }
};

const linksToGenerate = ['https://docs.solend.fi/', 'https://docs.solend.fi/another-page']; // Add more links as needed
const outputPath = 'solend_docs_full.pdf';

generatePdfFromLinks(linksToGenerate, outputPath);
