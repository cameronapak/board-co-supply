import type { BunFile } from 'bun';
import { PDFDocument } from 'pdf-lib';

// Function to validate artwork dimensions and resolution
export async function validateArtwork(file: BunFile) {
    // Check if the file is in an acceptable format
    const acceptedTypes = [
        'application/postscript',
        'image/vnd.adobe.photoshop',
        'application/pdf',
        'application/illustrator'  // AI files
    ];

    // Handle AI files that might be misidentified as PostScript
    const isAIFile = file.type === 'application/postscript' && file.name?.toLowerCase().endsWith('.ai');
    
    if (!acceptedTypes.includes(file.type) && !isAIFile) {
        return { valid: false, message: 'Invalid file format.' };
    }

    try {
        // Handle AI files and PDFs (since AI files are PDF-compatible)
        if (isAIFile || file.type === 'application/illustrator' || file.type === 'application/pdf') {
            const buffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(buffer);
            
            const pages = pdfDoc.getPages();
            if (pages.length === 0) {
                return { valid: false, message: 'Document has no pages.' };
            }
            
            const page = pages[0];
            if (!page) {
                return { valid: false, message: 'Could not read first page.' };
            }

            const { width, height } = page.getSize();
            
            // Convert points to pixels (1 point = 1/72 inch at 300 DPI)
            const widthInPixels = (width / 72) * 300;
            const heightInPixels = (height / 72) * 300;

            console.log('Document dimensions:', {
                widthPx: widthInPixels,
                heightPx: heightInPixels,
                originalWidth: width,
                originalHeight: height,
                fileType: isAIFile ? 'AI' : file.type
            });
            
            if (widthInPixels < 1200 || heightInPixels < 1050) {
                return { valid: false, message: 'Invalid dimensions.' };
            }

            // Both AI files and PDFs are vector-based, so we don't check resolution
            return { valid: true };
        }
        // Handle PSD files
        else if (file.type === 'image/vnd.adobe.photoshop') {
            const { default: sharp } = await import('sharp');
            const buffer = await file.arrayBuffer();
            const img = sharp(Buffer.from(buffer));
            const metadata = await img.metadata();
            
            if (!metadata.width || !metadata.height || metadata.width < 1200 || metadata.height < 1050) {
                return { valid: false, message: 'Invalid dimensions.' };
            }
            
            if (metadata.density !== 300) {
                return { valid: false, message: 'Invalid resolution.' };
            }
            
            return { valid: true };
        }
        
        return { valid: false, message: 'Unsupported file format.' };
    } catch (error) {
        console.error('Validation error:', error);
        return { valid: false, message: 'Error processing file.' };
    }
}
