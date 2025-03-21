import { type BunFile } from 'bun';
import { validateArtwork } from './utils';
import homepage from "./layout/index.html";

Bun.serve({
    port: 3000,
    routes: {
        // Serve the main HTML page
        "/": homepage,

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
                        isFile: file instanceof File,
                        name: file instanceof File ? file.name : 'no name'
                    });
                    
                    if (!file) {
                        console.log('No file received in form data');
                        return Response.json(
                            { 
                                message: 'No file provided',
                                details: {
                                    fileType: 'unknown',
                                    requiredWidth: 1200,
                                    requiredHeight: 1050,
                                    requiredResolution: 300,
                                    suggestions: [
                                        'Please select a file to upload',
                                        'Supported formats: AI, PSD, PDF, JPG, PNG, etc.'
                                    ]
                                }
                            },
                            { status: 400 }
                        );
                    }

                    if (!(file instanceof File)) {
                        console.log('File is not a File instance');
                        return Response.json(
                            { 
                                message: 'Invalid file format',
                                details: {
                                    fileType: 'unknown',
                                    requiredWidth: 1200,
                                    requiredHeight: 1050,
                                    requiredResolution: 300,
                                    suggestions: [
                                        'The uploaded data is not recognized as a valid file',
                                        'Try a different file or upload method'
                                    ]
                                }
                            },
                            { status: 400 }
                        );
                    }

                    // Pass the File directly to validateArtwork
                    // Since File is a Blob which extends BunFile
                    const result = await validateArtwork(file as unknown as BunFile);
                    
                    if (!result.valid) {
                        console.log('Validation failed:', result.message);
                        return Response.json(
                            { 
                                message: result.message, 
                                details: result.details 
                            },
                            { status: 400 }
                        );
                    }
                    
                    return Response.json(
                        { 
                            message: 'File is valid',
                            details: result.details
                        },
                        { status: 200 }
                    );
                } catch (error) {
                    console.error('Error processing file:', error);
                    return Response.json(
                        { 
                            message: 'Error validating file',
                            details: {
                                fileType: 'unknown',
                                requiredWidth: 1200,
                                requiredHeight: 1050,
                                requiredResolution: 300,
                                suggestions: [
                                    'An unexpected error occurred while processing your file',
                                    'Try a different file or format',
                                    'Make sure your file is not corrupted'
                                ]
                            }
                        },
                        { status: 500 }
                    );
                }
            }
        },

        // Serve the CSS file
        "/styles.css": {
            GET: () => {
                return new Response(Bun.file('./styles.css'), {
                    headers: { 'Content-Type': 'text/css' }
                });
            }
        },

        // Catch-all route for unmatched paths
        "/*": () => new Response('Not Found', { status: 404 })
    }
});
