const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // 修改为你本地Chrome的路径
        headless: true // 以无头模式运行
    });
    const page = await browser.newPage();
    await page.goto('https://docs.goosefx.io/', { waitUntil: 'domcontentloaded' });

    // 获取页面中的所有链接
    const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors
            .map(anchor => anchor.href)
            .filter(href => href.startsWith('https://docs.goosefx.io/'));
    });


    // 去重
    const uniqueLinks = [...new Set(links)];
    console.log(uniqueLinks);

    // return false;
    const pdfBuffers = [];

    // 依次访问每个链接并生成PDF
    for (const link of uniqueLinks) {
        await page.goto(link, { waitUntil: 'domcontentloaded' });
        const pdfBuffer = await page.pdf({ format: 'A4' });
        pdfBuffers.push(pdfBuffer);
    }

    await browser.close();

    // 合并所有PDF内容
    const mergedPdf = await mergePdfs(pdfBuffers);
    fs.writeFileSync('solend_docs_full.pdf', mergedPdf);
})();

const mergePdfs = async (pdfBuffers) => {
    const PDFDocument = require('pdf-lib').PDFDocument;
    const mergedPdf = await PDFDocument.create();
    for (const pdfBuffer of pdfBuffers) {
        const pdf = await PDFDocument.load(pdfBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    return await mergedPdf.save();
};
