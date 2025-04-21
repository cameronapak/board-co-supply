"use client";

// NOTE: pdfjs-dist is throwing Promise.withResolvers is not a function
// This is a workaround to fix the issue
import "../utils/polyfill.ts";
import { useState, useRef, useCallback, useEffect, memo } from "react";
import { RotateCw, Download } from "lucide-react";
import SkateboardTemplate from "./skateboard-template";
import html2canvas from "html2canvas";
import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"

// PDF options for better character support
const pdfOptions = {
  cMapUrl: '/cmaps/',
  cMapPacked: true,
};

// Memoized PDF renderer component
const PdfRenderer = ({
  file,
  onLoadSuccess,
  onLoadError,
  onPageRenderSuccess,
}: {
  file: File | null;
  onLoadSuccess: (info: { numPages: number }) => void;
  onLoadError: (error: Error) => void;
  onPageRenderSuccess: (page: any) => void;
}) => {
  if (!file) {
    return null;
  }

  return (
    <div
      style={{ position: "absolute", left: "-9999px", visibility: "hidden" }}
    >
      <Document
        file={file}
        onLoadSuccess={onLoadSuccess}
        onLoadError={onLoadError}
        options={pdfOptions}
      >
        <Page
          pageNumber={1}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          onRenderSuccess={onPageRenderSuccess}
        />
      </Document>
    </div>
  );
};

const SkateboardDesigner: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 428, height: 1741 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showSnapLines, setShowSnapLines] = useState({
    vertical: false,
    horizontal: false,
  });
  const [sizePercentage, setSizePercentage] = useState(100);
  const [isExporting, setIsExporting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isRendering, setIsRendering] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const designRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const skateboardMaskBase64 =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDI4IiBoZWlnaHQ9IjE3NDEiIHZpZXdCb3g9IjAgMCA0MjggMTc0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTQyMy43MTEgMTUyNy4xNEM0MjMuNzExIDE2NDQuNjYgMzI5LjY4MiAxNzM3IDIxMy44NTUgMTczN0M5OC4wMjg4IDE3MzcgNCAxNjQ0LjY2IDQgMTUyNy4xNFYyMTMuODU1QzQgOTguMDI4OCA5OC4wMjg4IDQgMjEzLjg1NSA0QzMyOS42ODIgNCA0MjMuNzExIDk4LjAyODggNDIzLjcxMSAyMTMuODU1VjE1MjcuMTRaIi8+PC9zdmc+";

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    },
    []
  );

  const onPageRenderSuccess = useCallback(() => {
    if (isRendering) {
      return;
    }
    
    setIsRendering(true);
    
    setTimeout(() => {
      const pdfPage = document.querySelector(".react-pdf__Page");
      if (!pdfPage) {
        setIsRendering(false);
        return;
      }

      if (!canvasRef.current) {
        const canvas = document.createElement("canvas");
        canvasRef.current = canvas;
        document.body.appendChild(canvas);
        canvas.style.display = "none";
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        const scale = 2; // Higher scale for better quality
        canvas.width = pdfPage.clientWidth * scale;
        canvas.height = pdfPage.clientHeight * scale;

        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Scale up for better resolution
        context.scale(scale, scale);

        // Convert to image
        const imageDataUrl = canvas.toDataURL("image/png");
        setImage(imageDataUrl);

        if (containerRef.current) {
          const img = new Image();
          img.onload = () => {
            const containerWidth = containerRef.current!.offsetWidth;
            const containerHeight = containerRef.current!.offsetHeight;
            const imageAspectRatio = img.width / img.height;

            let newWidth, newHeight;

            if (containerWidth / containerHeight > imageAspectRatio) {
              newHeight = containerHeight;
              newWidth = newHeight * imageAspectRatio;
            } else {
              newWidth = containerWidth;
              newHeight = newWidth / imageAspectRatio;
            }

            setSize({ width: newWidth, height: newHeight });
            setPosition({
              x: (containerWidth - newWidth) / 2,
              y: (containerHeight - newHeight) / 2,
            });
            setIsRendering(false);
          };
          img.src = imageDataUrl;
        } else {
          setIsRendering(false);
        }
      } else {
        setIsRendering(false);
      }
    }, 100);
  }, [isRendering]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("Error loading PDF:", error);
    alert("Error loading PDF. Please try a different file.");
    setPdfFile(null);
  }, []);

  const onPageRenderError = useCallback((error: Error) => {
    console.error("Error rendering PDF page:", error);
    alert("Error rendering PDF page. Please try a different file.");
    setPdfFile(null);
  }, []);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file before processing
    const isValid = await validateFile(file);
    if (!isValid) {
      // Reset input field
      event.target.value = "";
      return;
    }

    if (file.type === "application/pdf") {
      // Handle PDF file
      setPdfFile(file);
      setPageNumber(1);
    } else {
      // Handle image file
      setPdfFile(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setImage(imageDataUrl);

        const img = new Image();
        img.onload = () => {
          if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const containerHeight = containerRef.current.offsetHeight;
            const imageAspectRatio = img.width / img.height;

            let newWidth, newHeight;

            if (containerWidth / containerHeight > imageAspectRatio) {
              newHeight = containerHeight;
              newWidth = newHeight * imageAspectRatio;
            } else {
              newWidth = containerWidth;
              newHeight = newWidth / imageAspectRatio;
            }

            setSize({ width: newWidth, height: newHeight });
            setPosition({
              x: (containerWidth - newWidth) / 2,
              y: (containerHeight - newHeight) / 2,
            });
          }
          setRotation(0);
          setSizePercentage(100);
        };
        img.src = imageDataUrl;
      };
      reader.readAsDataURL(file);
    }
    setRotation(0);
    setSizePercentage(100);
  };

  const validateFile = async (file: File) => {
    setIsValidating(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/validate", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Show error message to user
        const errorMsg = result.message || "Failed to validate file";
        const details = result.details?.suggestions?.join("\n") || "";
        alert(`${errorMsg}\n${details}`);
        return false;
      }

      return true;
    } catch (error) {
      alert(
        `Error validating file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && containerRef.current) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        const containerRect = containerRef.current.getBoundingClientRect();
        const snapThreshold = 10;
        const centerX = containerRect.width / 2 - size.width / 2;
        const centerY = containerRect.height / 2 - size.height / 2;

        setShowSnapLines({
          vertical: Math.abs(newX - centerX) < snapThreshold,
          horizontal: Math.abs(newY - centerY) < snapThreshold,
        });

        setPosition({
          x: Math.abs(newX - centerX) < snapThreshold ? centerX : newX,
          y: Math.abs(newY - centerY) < snapThreshold ? centerY : newY,
        });
      }
    },
    [isDragging, dragStart, size]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setShowSnapLines({ vertical: false, horizontal: false });
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  }, []);

  const handleExport = useCallback(() => {
    const designElement = designRef.current;
    if (!designElement) return;

    setIsExporting(true);
    setTimeout(() => {
      html2canvas(designElement, {
        backgroundColor: null,
        scale: 4, // Increase scale for higher resolution
        useCORS: true, // Enable CORS for better image quality
        allowTaint: true, // Allow cross-origin images
        logging: false, // Disable logging for better performance
        imageTimeout: 0, // Remove timeout for image loading
      }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement("a");
        link.download = "skateboard-design.png";
        link.href = canvas.toDataURL("image/png", 1.0); // Use maximum quality
        link.click();
        setIsExporting(false);
      });
    }, 100); // Small delay to ensure state update is reflected
  }, []);

  const handleSizeChange = useCallback((value: number[]) => {
    const newPercentage = value[0];
    setSizePercentage(newPercentage);
    if (containerRef.current && imageRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      const imageAspectRatio =
        imageRef.current.naturalWidth / imageRef.current.naturalHeight;

      let newWidth, newHeight;

      if (containerWidth / containerHeight > imageAspectRatio) {
        newHeight = (containerHeight * newPercentage) / 100;
        newWidth = newHeight * imageAspectRatio;
      } else {
        newWidth = (containerWidth * newPercentage) / 100;
        newHeight = newWidth / imageAspectRatio;
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({
        x: (containerWidth - newWidth) / 2,
        y: (containerHeight - newHeight) / 2,
      });
    }
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMouseMove(e as unknown as React.MouseEvent);
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("mousemove", handleGlobalMouseMove);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, [isDragging, handleMouseMove]);

  return (
    <div className="relative w-full h-full grid sm:grid-cols-2 max-sm:grid-rows-[1fr_auto] items-center gap-8 mx-auto">
      <div className="p-6 flex justify-center gap-4">
        <div
          style={{ aspectRatio: "100/413" }}
          ref={containerRef}
          className="relative w-[128px] px-[1px] sm:pb-[125%] max-sm:pb-0 max-sm:w-full h-[350px]"
        >
          <div
            ref={designRef}
            className="absolute inset-0 bg-white overflow-hidden"
          >
            {image && (
              <div
                className="absolute inset-0"
                onMouseDown={handleMouseDown}
                style={{
                  maskImage: `url(${skateboardMaskBase64})`,
                  WebkitMaskImage: `url(${skateboardMaskBase64})`,
                  maskSize: "100% 100%",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                }}
              >
                <div
                  className="absolute"
                  style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    transform: `rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    ref={imageRef}
                    src={image || "/placeholder.svg"}
                    alt="Uploaded design"
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                </div>
              </div>
            )}
            <SkateboardTemplate
              className="absolute inset-0 w-full h-full pointer-events-none"
              color="black"
              opacity={isExporting ? 1 : 0.2}
              fillOpacity={isExporting ? 0.5 : 0.1}
            />
          </div>
          {isDragging && showSnapLines.vertical && (
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-500 pointer-events-none" />
          )}
          {isDragging && showSnapLines.horizontal && (
            <div className="absolute left-0 right-0 top-1/2 h-px bg-blue-500 pointer-events-none" />
          )}
        </div>
      </div>

      <PdfRenderer
        file={pdfFile}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        onPageRenderSuccess={onPageRenderSuccess}
      />

      <div className="p-6 bg-slate-100 h-full w-full flex flex-col space-y-4">
        <input
          type="file"
          onChange={handleFileChange}
          accept="image/*,.pdf"
          className="hidden"
          id="file-upload"
        />
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Skateboard Customizer</h2>
          <button className="bg-white p-2 w-full rounded-md shadow active:shadow-none active:scale-95 transition-all duration-100">
            <label htmlFor="file-upload" className="cursor-pointer">
              {isValidating ? "Validating..." : "Upload Design"}
            </label>
          </button>
          {image && (
            <div className="grid grid-cols-2 gap-4">
              <button
                className="flex items-center justify-center gap-1 bg-white p-2 w-full rounded-md shadow active:shadow-none active:scale-95 transition-all duration-100"
                onClick={handleRotate}
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Rotate
              </button>
              <button
                className="flex items-center justify-center gap-1 bg-white p-2 w-full rounded-md shadow active:shadow-none active:scale-95 transition-all duration-100"
                onClick={handleExport}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Image
              </button>
            </div>
          )}
        </div>
        {image && (
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max="400"
              step="1"
              value={sizePercentage}
              onChange={(e) => handleSizeChange([parseInt(e.target.value, 10)])}
              className="w-64"
            />
            <span className="text-sm font-medium">{sizePercentage}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkateboardDesigner;
