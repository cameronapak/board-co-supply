import { fetch, type BunFile } from 'bun';

// Function to validate artwork dimensions and resolution
async function validateArtwork(file: BunFile) {
    // Check if the file is in an acceptable format
    if (!['application/postscript', 'image/vnd.adobe.photoshop', 'application/pdf'].includes(file.type)) {
        return { valid: false, message: 'Invalid file format.' };
    }

    // Use a library like Sharp for Node.js to check dimensions and resolution
    // Since Bun.js doesn't directly support image processing, you might need to use a Node.js library
    const sharp = await import('sharp');
    try {
        const img = await sharp(file.arrayBuffer());
        const metadata = await img.metadata();
        
        // Check dimensions (assuming standard aspect ratio)
        if (metadata.width < 1200 || metadata.height < 1050) {
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

// Example usage in a Bun.js endpoint
Bun.serve({
    async fetch(req) {
        if (req.method === 'POST') {
            try {
                const formData = await Bun.readableStreamToFormData(req.body);
                const file = formData.get('file');
                
                if (!file) {
                    return new Response(JSON.stringify({ message: 'No file provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }
                
                const result = await validateArtwork(file);
                if (!result.valid) {
                    return new Response(JSON.stringify({ message: result.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }
                
                return new Response(JSON.stringify({ message: 'File is valid' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } catch (error) {
                return new Response(JSON.stringify({ message: 'Error validating file' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        } else {
            return new Response('Only POST requests are supported.', { status: 405 });
        }
    },
});
