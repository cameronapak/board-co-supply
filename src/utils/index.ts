import type { BunFile } from 'bun';
import { PDFDocument } from 'pdf-lib';

interface ValidationResult {
    valid: boolean;
    message: string;
    details?: {
        currentWidth?: number;
        currentHeight?: number;
        currentResolution?: number;
        requiredWidth: number;
        requiredHeight: number;
        requiredResolution: number;
        fileType: string;
        suggestions: string[];
    };
}

// Function to validate artwork dimensions and resolution
export async function validateArtwork(file: BunFile): Promise<ValidationResult> {
    const REQUIRED_WIDTH = 1200;
    const REQUIRED_HEIGHT = 1050;
    const REQUIRED_RESOLUTION = 300;

    // Add detailed logging for debugging
    console.log('Starting validation for file:', {
        type: file.type,
        name: file.name,
        size: file.size,
        constructor: file.constructor?.name
    });

    try {
        // Check if the file is in an acceptable format
        const acceptedTypes = [
            'application/postscript',
            'image/vnd.adobe.photoshop',
            'application/pdf',
            'application/illustrator',  // AI files
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/tiff'
            // Removed GIF as it's not suitable for physical printing
        ];

        // Handle AI files that might be misidentified as PostScript
        const isAIFile = file.type === 'application/postscript' && file.name?.toLowerCase().endsWith('.ai');
        
        // Check if file is an image by MIME type or file extension
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'];
        const hasImageExtension = file.name ? imageExtensions.some(ext => 
            file.name!.toLowerCase().endsWith(ext)
        ) : false;
        
        const isImageFile = (file.type.startsWith('image/') && file.type !== 'image/vnd.adobe.photoshop') || hasImageExtension;
        
        console.log('File classification:', {
            isAcceptedType: acceptedTypes.includes(file.type),
            isAIFile,
            isImageFile,
            hasPngType: file.type === 'image/png',
            hasImageExtension,
            hasImagePrefix: file.type.startsWith('image/')
        });
        
        // Check if file is accepted
        if (!acceptedTypes.includes(file.type) && !isAIFile && !hasImageExtension) {
            return { 
                valid: false, 
                message: 'Invalid file format.',
                details: {
                    fileType: file.type || 'unknown',
                    requiredWidth: REQUIRED_WIDTH,
                    requiredHeight: REQUIRED_HEIGHT,
                    requiredResolution: REQUIRED_RESOLUTION,
                    suggestions: [
                        'Please provide your artwork in AI, PSD, PDF, or common image formats (JPG, PNG, etc.).',
                        'If you have an Adobe Illustrator file, save it as .ai or PDF.',
                        'For Photoshop files, save as .psd format.'
                    ]
                }
            };
        }

        // Handle AI files and PDFs (since AI files are PDF-compatible)
        if (isAIFile || file.type === 'application/illustrator' || file.type === 'application/pdf') {
            console.log('Processing PDF/AI file');
            const buffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(buffer);
            
            const pages = pdfDoc.getPages();
            if (pages.length === 0) {
                return { 
                    valid: false, 
                    message: 'Document has no pages.',
                    details: {
                        fileType: isAIFile ? 'AI' : file.type,
                        requiredWidth: REQUIRED_WIDTH,
                        requiredHeight: REQUIRED_HEIGHT,
                        requiredResolution: REQUIRED_RESOLUTION,
                        suggestions: [
                            'Your document appears to be empty.',
                            'Please ensure your artwork is on the first page.',
                            'Try re-saving your document and upload again.'
                        ]
                    }
                };
            }
            
            const page = pages[0];
            if (!page) {
                return { 
                    valid: false, 
                    message: 'Could not read first page.',
                    details: {
                        fileType: isAIFile ? 'AI' : file.type,
                        requiredWidth: REQUIRED_WIDTH,
                        requiredHeight: REQUIRED_HEIGHT,
                        requiredResolution: REQUIRED_RESOLUTION,
                        suggestions: [
                            'Your document appears to be corrupted.',
                            'Try re-saving your document and upload again.'
                        ]
                    }
                };
            }

            const { width, height } = page.getSize();
            
            // Convert points to pixels (1 point = 1/72 inch at 300 DPI)
            const widthInPixels = Math.round((width / 72) * REQUIRED_RESOLUTION);
            const heightInPixels = Math.round((height / 72) * REQUIRED_RESOLUTION);

            console.log('Document dimensions:', {
                widthPx: widthInPixels,
                heightPx: heightInPixels,
                originalWidth: width,
                originalHeight: height,
                fileType: isAIFile ? 'AI' : file.type
            });
            
            if (widthInPixels < REQUIRED_WIDTH || heightInPixels < REQUIRED_HEIGHT) {
                const widthScale = REQUIRED_WIDTH / widthInPixels;
                const heightScale = REQUIRED_HEIGHT / heightInPixels;
                const scale = Math.max(widthScale, heightScale);
                
                return { 
                    valid: false, 
                    message: 'Invalid dimensions.',
                    details: {
                        currentWidth: widthInPixels,
                        currentHeight: heightInPixels,
                        fileType: isAIFile ? 'AI' : file.type,
                        requiredWidth: REQUIRED_WIDTH,
                        requiredHeight: REQUIRED_HEIGHT,
                        requiredResolution: REQUIRED_RESOLUTION,
                        suggestions: [
                            `Your artwork is too small. Current size: ${widthInPixels}x${heightInPixels}px`,
                            `Required minimum size: ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px`,
                            `Try scaling your artwork by ${Math.round(scale * 100)}% to meet the minimum size requirement.`,
                            'For vector files (AI/PDF), you can safely scale the artwork without losing quality.'
                        ]
                    }
                };
            }

            return { 
                valid: true,
                message: 'File is valid.',
                details: {
                    currentWidth: widthInPixels,
                    currentHeight: heightInPixels,
                    fileType: isAIFile ? 'AI' : file.type,
                    requiredWidth: REQUIRED_WIDTH,
                    requiredHeight: REQUIRED_HEIGHT,
                    requiredResolution: REQUIRED_RESOLUTION,
                    suggestions: [
                        'Your artwork meets all requirements!',
                        `Current size: ${widthInPixels}x${heightInPixels}px`
                    ]
                }
            };
        }
        // Handle PSD files
        else if (file.type === 'image/vnd.adobe.photoshop') {
            console.log('Processing PSD file');
            const { default: sharp } = await import('sharp');
            const buffer = await file.arrayBuffer();
            const img = sharp(Buffer.from(buffer));
            const metadata = await img.metadata();
            
            if (!metadata.width || !metadata.height) {
                return { 
                    valid: false, 
                    message: 'Could not read dimensions.',
                    details: {
                        fileType: 'PSD',
                        requiredWidth: REQUIRED_WIDTH,
                        requiredHeight: REQUIRED_HEIGHT,
                        requiredResolution: REQUIRED_RESOLUTION,
                        suggestions: [
                            'Could not read the dimensions of your PSD file.',
                            'Try re-saving your file and upload again.',
                            'Ensure your PSD file is not corrupted.'
                        ]
                    }
                };
            }

            const issues: string[] = [];
            if (metadata.width < REQUIRED_WIDTH || metadata.height < REQUIRED_HEIGHT) {
                const widthScale = REQUIRED_WIDTH / metadata.width;
                const heightScale = REQUIRED_HEIGHT / metadata.height;
                const scale = Math.max(widthScale, heightScale);
                issues.push(
                    `Your artwork is too small. Current size: ${metadata.width}x${metadata.height}px`,
                    `Required minimum size: ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px`,
                    `Try increasing the canvas size by ${Math.round(scale * 100)}%`
                );
            }
            
            if (metadata.density !== REQUIRED_RESOLUTION) {
                issues.push(
                    `Current resolution: ${metadata.density || 'unknown'} DPI`,
                    `Required resolution: ${REQUIRED_RESOLUTION} DPI`,
                    'In Photoshop, go to Image > Image Size and set resolution to 300 DPI'
                );
            }
            
            if (issues.length > 0) {
                return { 
                    valid: false, 
                    message: 'Invalid dimensions or resolution.',
                    details: {
                        currentWidth: metadata.width,
                        currentHeight: metadata.height,
                        currentResolution: metadata.density,
                        fileType: 'PSD',
                        requiredWidth: REQUIRED_WIDTH,
                        requiredHeight: REQUIRED_HEIGHT,
                        requiredResolution: REQUIRED_RESOLUTION,
                        suggestions: issues
                    }
                };
            }
            
            return { 
                valid: true,
                message: 'File is valid.',
                details: {
                    currentWidth: metadata.width,
                    currentHeight: metadata.height,
                    currentResolution: metadata.density,
                    fileType: 'PSD',
                    requiredWidth: REQUIRED_WIDTH,
                    requiredHeight: REQUIRED_HEIGHT,
                    requiredResolution: REQUIRED_RESOLUTION,
                    suggestions: [
                        'Your artwork meets all requirements!',
                        `Current size: ${metadata.width}x${metadata.height}px`,
                        `Current resolution: ${metadata.density} DPI`
                    ]
                }
            };
        }
        // Handle image files (JPG, PNG, etc.)
        else if (isImageFile) {
            console.log('Processing image file:', {
                type: file.type, 
                extension: file.name?.split('.').pop()?.toLowerCase() || 'unknown'
            });
            
            try {
                const { default: sharp } = await import('sharp');
                console.log('Sharp imported successfully');
                
                const buffer = await file.arrayBuffer();
                console.log('Image buffer loaded, size:', buffer.byteLength);
                
                // Determine file format for display
                let fileFormat = file.type.replace('image/', '').toUpperCase();
                if (!fileFormat || fileFormat === 'UNKNOWN') {
                    // Try to determine from filename
                    const extension = file.name?.split('.').pop()?.toLowerCase();
                    if (extension) {
                        fileFormat = extension.toUpperCase();
                    }
                }
                
                const img = sharp(Buffer.from(buffer));
                console.log('Sharp instance created');
                
                const metadata = await img.metadata();
                console.log('Image metadata retrieved:', {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    density: metadata.density
                });
                
                if (!metadata.width || !metadata.height) {
                    return { 
                        valid: false, 
                        message: 'Could not read image dimensions.',
                        details: {
                            fileType: fileFormat,
                            requiredWidth: REQUIRED_WIDTH,
                            requiredHeight: REQUIRED_HEIGHT,
                            requiredResolution: REQUIRED_RESOLUTION,
                            suggestions: [
                                'Could not read the dimensions of your image file.',
                                'Try re-saving your file in a different format and upload again.',
                                'Ensure your image file is not corrupted.'
                            ]
                        }
                    };
                }

                const issues: string[] = [];
                if (metadata.width < REQUIRED_WIDTH || metadata.height < REQUIRED_HEIGHT) {
                    const widthScale = REQUIRED_WIDTH / metadata.width;
                    const heightScale = REQUIRED_HEIGHT / metadata.height;
                    const scale = Math.max(widthScale, heightScale);
                    issues.push(
                        `Your image is too small. Current size: ${metadata.width}x${metadata.height}px`,
                        `Required minimum size: ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}px`,
                        `Try resizing your image to ${Math.ceil(metadata.width * scale)}x${Math.ceil(metadata.height * scale)}px to meet the minimum requirements.`
                    );
                }
                
                if (metadata.density && metadata.density < REQUIRED_RESOLUTION) {
                    issues.push(
                        `Current resolution: ${metadata.density || 'unknown'} DPI`,
                        `Required resolution: ${REQUIRED_RESOLUTION} DPI`,
                        'Consider using a higher resolution image or resample your image in an editing program.'
                    );
                }
                
                if (issues.length > 0) {
                    return { 
                        valid: false, 
                        message: 'Invalid dimensions or resolution.',
                        details: {
                            currentWidth: metadata.width,
                            currentHeight: metadata.height,
                            currentResolution: metadata.density,
                            fileType: fileFormat,
                            requiredWidth: REQUIRED_WIDTH,
                            requiredHeight: REQUIRED_HEIGHT,
                            requiredResolution: REQUIRED_RESOLUTION,
                            suggestions: issues
                        }
                    };
                }
                
                return { 
                    valid: true,
                    message: 'File is valid.',
                    details: {
                        currentWidth: metadata.width,
                        currentHeight: metadata.height,
                        currentResolution: metadata.density,
                        fileType: fileFormat,
                        requiredWidth: REQUIRED_WIDTH,
                        requiredHeight: REQUIRED_HEIGHT,
                        requiredResolution: REQUIRED_RESOLUTION,
                        suggestions: [
                            'Your artwork meets all requirements!',
                            `Current size: ${metadata.width}x${metadata.height}px`,
                            metadata.density ? `Current resolution: ${metadata.density} DPI` : ''
                        ].filter(Boolean)
                    }
                };
            } catch (imageError) {
                console.error('Error processing image file with sharp:', imageError);
                return { 
                    valid: false, 
                    message: 'Error processing image file.',
                    details: {
                        fileType: file.type.replace('image/', '').toUpperCase() || 
                                 file.name?.split('.').pop()?.toUpperCase() || 'UNKNOWN',
                        requiredWidth: REQUIRED_WIDTH,
                        requiredHeight: REQUIRED_HEIGHT,
                        requiredResolution: REQUIRED_RESOLUTION,
                        suggestions: [
                            'There was an error processing your image file.',
                            'The file may be corrupted or in an unsupported format.',
                            'Try re-saving your file in a different format like JPG or PNG.'
                        ]
                    }
                };
            }
        } else {
            console.log('File did not match any handler types:', file.type);
        }
        
        return { 
            valid: false, 
            message: 'Unsupported file format.',
            details: {
                fileType: file.type || 'unknown',
                requiredWidth: REQUIRED_WIDTH,
                requiredHeight: REQUIRED_HEIGHT,
                requiredResolution: REQUIRED_RESOLUTION,
                suggestions: [
                    'Please provide your artwork in AI, PSD, PDF, or common image formats (JPG, PNG, etc.).',
                    'If you have an Adobe Illustrator file, save it as .ai or PDF.',
                    'For Photoshop files, save as .psd format.'
                ]
            }
        };
    } catch (error) {
        console.error('Validation error:', error);
        return { 
            valid: false, 
            message: 'Error processing file.',
            details: {
                fileType: file.type || 'unknown',
                requiredWidth: REQUIRED_WIDTH,
                requiredHeight: REQUIRED_HEIGHT,
                requiredResolution: REQUIRED_RESOLUTION,
                suggestions: [
                    'An error occurred while processing your file.',
                    'Please ensure your file is not corrupted.',
                    'Try re-saving your file and upload again.'
                ]
            }
        };
    }
}
