@IsTest
public class QuoteAttachmentControllerTest {
    
    @IsTest
    static void testGetQuotePdfAttachment() {
        // Créer un devis fictif
        Quote testQuote = new Quote(
            Name = 'Test Quote',
            OpportunityId = [SELECT Id FROM Opportunity LIMIT 1].Id, // Sélectionner une opportunité existante
            Status = 'Draft',
            Pricebook2Id = [SELECT Id FROM Pricebook2 WHERE IsActive = true LIMIT 1].Id // Sélectionner une pricebook active
        );
        insert testQuote;

        // Créer un fichier PDF fictif à attacher au devis
        Attachment testAttachment = new Attachment(
            ParentId = testQuote.Id,
            Name = 'TestQuote.pdf',
            Body = Blob.valueOf('Test PDF content'),
            ContentType = 'application/pdf'
        );
        insert testAttachment;

        // Exécuter la méthode à tester
        String pdfResult = QuoteAttachmentController.getQuotePdfAttachment(testQuote.Id);

        // Vérifier que la méthode retourne bien le PDF encodé en base64
        System.assertNotEquals(null, pdfResult, 'The method should return a PDF encoded in base64.');
    }
}
