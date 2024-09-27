public with sharing class QuoteAttachmentController {
    
    @AuraEnabled
    public static String getQuotePdfAttachment(Id quoteId) {
        // Rechercher l'attachement du devis (remplacer par ContentDocument si c'est un fichier dans Salesforce Files)
        List<Attachment> attachments = [SELECT Id, Body FROM Attachment WHERE ParentId = :quoteId AND Name LIKE '%.pdf%' LIMIT 1];
        
        if (attachments.size() > 0) {
            // Récupérer le corps du fichier (Base64)
            Blob pdfBlob = attachments[0].Body;
            return EncodingUtil.base64Encode(pdfBlob); // Retourner le PDF encodé en base64
        }
        return null;
    }
}
