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
        return { 
            valid: false, 
            message: 'Invalid file format.',
            details: {
                fileType: file.type,
                requiredWidth: REQUIRED_WIDTH,
                requiredHeight: REQUIRED_HEIGHT,
                requiredResolution: REQUIRED_RESOLUTION,
                suggestions: [
                    'Please provide your artwork in AI, PSD, or PDF format.',
                    'If you have an Adobe Illustrator file, save it as .ai or PDF.',
                    'For Photoshop files, save as .psd format.'
                ]
            }
        };
    }

    try {
        // Handle AI files and PDFs (since AI files are PDF-compatible)
        if (isAIFile || file.type === 'application/illustrator' || file.type === 'application/pdf') {
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
        
        return { 
            valid: false, 
            message: 'Unsupported file format.',
            details: {
                fileType: file.type,
                requiredWidth: REQUIRED_WIDTH,
                requiredHeight: REQUIRED_HEIGHT,
                requiredResolution: REQUIRED_RESOLUTION,
                suggestions: [
                    'Please provide your artwork in AI, PSD, or PDF format.',
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
                fileType: file.type,
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
