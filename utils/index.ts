import type { BunFile } from 'bun';
import { PDFDocument } from 'pdf-lib';

// Function to validate artwork dimensions and resolution
export async function validateArtwork(file: BunFile) {
    // Check if the file is in an acceptable format
    if (!['application/postscript', 'image/vnd.adobe.photoshop', 'application/pdf'].includes(file.type)) {
        return { valid: false, message: 'Invalid file format.' };
    }

    try {
        if (file.type === 'application/pdf') {
            // Handle PDF validation
            const buffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(buffer);
            
            // Get the first page
            const pages = pdfDoc.getPages();
            if (pages.length === 0) {
                return { valid: false, message: 'PDF has no pages.' };
            }
            
            const page = pages[0];
            if (!page) {
                return { valid: false, message: 'PDF has no pages.' };
            }

            const { width, height } = page.getSize();
            
            // Convert points to pixels (1 point = 1/72 inch, assuming 300 DPI)
            const widthInPixels = (width / 72) * 300;
            const heightInPixels = (height / 72) * 300;

            console.log('PDF dimensions:', {
                widthPx: widthInPixels,
                heightPx: heightInPixels,
                originalWidth: width,
                originalHeight: height
            });
            
            // Check dimensions (assuming standard aspect ratio)
            if (widthInPixels < 1200 || heightInPixels < 1050) {
                return { valid: false, message: 'Invalid dimensions.' };
            }

            // For PDFs, we assume they're created at the correct resolution
            // since they're vector-based
            
            return { valid: true };
        } else if (file.type === 'application/postscript' || file.type === 'image/vnd.adobe.photoshop') {
            // Use Sharp for raster image formats (PSD)
            const { default: sharp } = await import('sharp');
            const buffer = await file.arrayBuffer();
            const img = sharp(Buffer.from(buffer));
            const metadata = await img.metadata();
            
            // Check dimensions
            if (!metadata.width || !metadata.height || metadata.width < 1200 || metadata.height < 1050) {
                return { valid: false, message: 'Invalid dimensions.' };
            }
            
            // Check resolution
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
