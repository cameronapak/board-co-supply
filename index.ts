import { type BunFile } from 'bun';
import { validateArtwork } from './utils';

const server = Bun.serve({
    port: 3000,
    routes: {
        // Serve the main HTML page
        "/": {
            GET: () => {
                const html = Bun.file('./public/index.html');
                return new Response(html, {
                    headers: { 'Content-Type': 'text/html' }
                });
            }
        },

        // Handle artwork validation
        "/validate": {
            POST: async (req) => {
                try {
                    const body = req.body;
                    if (!body) {
                        return Response.json(
                            { message: 'No request body' },
                            { status: 400 }
                        );
                    }
                    
                    const formData = await Bun.readableStreamToFormData(body as ReadableStream);
                    const file = formData.get('file');
                    
                    if (!file || !(file instanceof Blob)) {
                        return Response.json(
                            { message: 'No valid file provided' },
                            { status: 400 }
                        );
                    }
                    
                    // Create a BunFile from the Blob
                    const bunFile = file as unknown as BunFile;
                    const result = await validateArtwork(bunFile);
                    
                    if (!result.valid) {
                        return Response.json(
                            { message: result.message },
                            { status: 400 }
                        );
                    }
                    
                    return Response.json(
                        { message: 'File is valid' },
                        { status: 200 }
                    );
                } catch (error) {
                    return Response.json(
                        { message: 'Error validating file' },
                        { status: 500 }
                    );
                }
            }
        },

        // Catch-all route for unmatched paths
        "/*": () => new Response('Not Found', { status: 404 })
    }
});

console.log(`🚀 Server running at ${server.url}`);
