import type { BunFile } from 'bun';

// Function to validate artwork dimensions and resolution
export async function validateArtwork(file: BunFile) {
    // Check if the file is in an acceptable format
    if (!['application/postscript', 'image/vnd.adobe.photoshop', 'application/pdf'].includes(file.type)) {
        return { valid: false, message: 'Invalid file format.' };
    }

    // Use a library like Sharp for Node.js to check dimensions and resolution
    const { default: sharp } = await import('sharp');
    try {
        const buffer = await file.arrayBuffer();
        const img = sharp(Buffer.from(buffer));
        const metadata = await img.metadata();

        console.log(metadata);
        
        // Check dimensions (assuming standard aspect ratio)
        if (!metadata.width || !metadata.height || metadata.width < 1200 || metadata.height < 1050) {
            return { valid: false, message: 'Invalid dimensions.' };
        }
        
        // Check resolution
        if (metadata.density !== 300) {
            return { valid: false, message: 'Invalid resolution.' };
        }
        
        return { valid: true };
    } catch (error) {
        return { valid: false, message: 'Error processing file.' };
    }
}
