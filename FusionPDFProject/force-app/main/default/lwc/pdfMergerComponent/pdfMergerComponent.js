import { LightningElement, api, wire } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import pdfLib from '@salesforce/resourceUrl/PdfLib'; // Charger la bibliothèque pdf-lib
import salesKitPdf from '@salesforce/resourceUrl/SalesKit'; // Charger la plaquette commerciale SalesKit
import getQuotePdfAttachment from '@salesforce/apex/QuoteAttachmentController.getQuotePdfAttachment'; // Appel à la méthode Apex

export default class PdfMergerComponent extends LightningElement {
    @api quoteId; // L'ID du devis passé en paramètre
    pdfLibInitialized = false;
    quotePdfBytes = null;

    connectedCallback() {
        this.initializePdfLib();
        this.loadQuotePdf(); // Charger le devis dès que le composant est connecté
    }

    // Charger la bibliothèque pdf-lib
    initializePdfLib() {
        if (this.pdfLibInitialized) {
            return;
        }
        loadScript(this, pdfLib)
            .then(() => {
                this.pdfLibInitialized = true;
                console.log('pdf-lib loaded successfully');
            })
            .catch(error => {
                console.error('Error loading pdf-lib:', error);
            });
    }

    // Charger le devis PDF depuis Salesforce via Apex
    loadQuotePdf() {
        getQuotePdfAttachment({ quoteId: this.quoteId })
            .then(result => {
                if (result) {
                    // Décoder le PDF encodé en base64
                    this.quotePdfBytes = this.base64ToArrayBuffer(result);
                    console.log('Quote PDF loaded successfully');
                } else {
                    console.error('No PDF found for this Quote');
                }
            })
            .catch(error => {
                console.error('Error loading Quote PDF:', error);
            });
    }

    // Convertir Base64 en tableau d'octets pour pdf-lib
    base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    // Méthode pour fusionner les PDFs
    async mergePdf() {
        if (!this.quotePdfBytes) {
            console.error('Quote PDF not loaded yet');
            return;
        }

        // Charger la plaquette commerciale SalesKit à partir des ressources statiques
        const salesKitPdfBytes = await this.loadSalesKitPdf();

        // Créer un nouveau document PDF
        const pdfDoc = await PDFLib.PDFDocument.create();

        // Incorporer les deux PDFs dans le nouveau document
        const quotePdfDoc = await PDFLib.PDFDocument.load(this.quotePdfBytes);
        const salesKitPdfDoc = await PDFLib.PDFDocument.load(salesKitPdfBytes);

        const quotePages = await pdfDoc.copyPages(quotePdfDoc, quotePdfDoc.getPageIndices());
        quotePages.forEach(page => pdfDoc.addPage(page));

        const salesKitPages = await pdfDoc.copyPages(salesKitPdfDoc, salesKitPdfDoc.getPageIndices());
        salesKitPages.forEach(page => pdfDoc.addPage(page));

        // Sauvegarder le PDF fusionné
        const mergedPdfBytes = await pdfDoc.save();

        // Télécharger le PDF fusionné
        this.downloadPdf(mergedPdfBytes);
    }

    // Charger le PDF de la plaquette commerciale depuis les ressources statiques
    async loadSalesKitPdf() {
        const response = await fetch(salesKitPdf); // Charge la ressource statique SalesKit
        return await response.arrayBuffer(); // Convertir en tableau d'octets pour pdf-lib
    }

    // Télécharger le fichier PDF fusionné
    downloadPdf(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'MergedQuote.pdf';
        link.click();
    }
}
