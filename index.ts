import { type BunFile } from 'bun';
import { validateArtwork } from './utils';

// Example usage in a Bun.js endpoint
Bun.serve({
    async fetch(req) {
        if (req.method === 'POST') {
            try {
                const body = req.body;
                if (!body) {
                    return new Response(JSON.stringify({ message: 'No request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }
                
                const formData = await Bun.readableStreamToFormData(body as ReadableStream);
                const file = formData.get('file');
                
                if (!file || !(file instanceof Blob)) {
                    return new Response(JSON.stringify({ message: 'No valid file provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }
                
                // Create a BunFile from the Blob
                const bunFile = file as unknown as BunFile;
                const result = await validateArtwork(bunFile);
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
