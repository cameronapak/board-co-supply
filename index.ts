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
                    // Get FormData directly from the request
                    const formData = await req.formData();
                    const file = formData.get('file');

                    console.log('Received file:', {
                        type: file instanceof File ? file.type : 'not a file',
                        constructor: file?.constructor.name,
                        isBlob: file instanceof Blob,
                        isFile: file instanceof File
                    });
                    
                    if (!file) {
                        console.log('No file received in form data');
                        return Response.json(
                            { message: 'No file provided' },
                            { status: 400 }
                        );
                    }

                    if (!(file instanceof File)) {
                        console.log('File is not a File instance');
                        return Response.json(
                            { message: 'Invalid file format' },
                            { status: 400 }
                        );
                    }
                    
                    // Convert File to BunFile
                    const arrayBuffer = await file.arrayBuffer();
                    const bunFile = Bun.file(new Uint8Array(arrayBuffer), {
                        type: file.type
                    }) as BunFile;

                    console.log('Created BunFile:', {
                        type: bunFile.type,
                        size: bunFile.size
                    });

                    const result = await validateArtwork(bunFile);
                    
                    if (!result.valid) {
                        console.log('Validation failed:', result.message);
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
                    console.error('Error processing file:', error);
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
