import { Stage, Layer, Path, Group, Image, Transformer } from 'react-konva';
import { useEffect, useState, useRef } from 'react';

interface SkateboardProps {
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
  fillOpacity?: number;
  padding?: number;
  imageUrl?: string;
}

const Skateboard = ({ 
  width = window.innerWidth, 
  height = window.innerHeight,
  color = '#000000',
  opacity = 1,
  fillOpacity = 1,
  padding = 20,
  imageUrl = 'https://konvajs.org/assets/yoda.jpg' // Default image
}: SkateboardProps) => {
  // Original SVG dimensions
  const originalWidth = 428;
  const originalHeight = 1741;
  
  // Calculate scale to fit within available space while maintaining aspect ratio
  const scaleX = (width - padding * 2) / originalWidth;
  const scaleY = (height - padding * 2) / originalHeight;
  const scale = Math.min(scaleX, scaleY);
  
  // Calculate position to center the skateboard
  const centerX = width / 2 - (originalWidth * scale) / 2;
  const centerY = height / 2 - (originalHeight * scale) / 2;

  // Image state
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const imageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  // Load the image
  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [imageUrl]);

  // Set up transformer when image is selected
  useEffect(() => {
    if (isSelected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Handle selection
  const handleSelect = () => {
    setIsSelected(true);
  };

  // Handle deselection when clicking elsewhere on stage
  const handleCheckDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setIsSelected(false);
    }
  };

  return (
    <Stage width={width} height={height} onClick={handleCheckDeselect}>
      <Layer>
        <Group 
          x={centerX} 
          y={centerY} 
          scaleX={scale} 
          scaleY={scale}
          clipFunc={(ctx) => {
            ctx.beginPath();
            ctx.rect(0, 0, 428, 1741);
            ctx.clip();
          }}
        >
          {/* Main skateboard shape */}
          <Path
            draggable={true}
            fill="white"
            data="M423.711 1527.14C423.711 1644.66 329.682 1737 213.855 1737C98.0288 1737 4 1644.66 4 1527.14V213.855C4 98.0288 98.0288 4 213.855 4C329.682 4 423.711 98.0288 423.711 213.855V1527.14Z"
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth={6.76953}
            lineCap="round"
            lineJoin="round"
          />
          
          {/* Wheel bolts */}
          <Path
            data="M169.854 376.324C173.593 376.324 176.624 373.293 176.624 369.554C176.624 365.815 173.593 362.785 169.854 362.785C166.115 362.785 163.084 365.815 163.084 369.554C163.084 373.293 166.115 376.324 169.854 376.324Z"
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth={5.07715}
            fill="white"
          />
          <Path
            data="M257.857 376.324C261.596 376.324 264.627 373.293 264.627 369.554C264.627 365.815 261.596 362.785 257.857 362.785C254.119 362.785 251.088 365.815 251.088 369.554C251.088 373.293 254.119 376.324 257.857 376.324Z"
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth={5.07715}
            fill="white"
          />
          <Path
            data="M169.854 491.406C173.593 491.406 176.624 488.375 176.624 484.636C176.624 480.898 173.593 477.867 169.854 477.867C166.115 477.867 163.084 480.898 163.084 484.636C163.084 488.375 166.115 491.406 169.854 491.406Z"
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth={5.07715}
            fill="white"
          />
          <Path
            data="M257.857 491.406C261.596 491.406 264.627 488.375 264.627 484.636C264.627 480.898 261.596 477.867 257.857 477.867C254.119 477.867 251.088 480.898 251.088 484.636C251.088 488.375 254.119 491.406 257.857 491.406Z"
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth={5.07715}
            fill="white"
          />
          <Path
            data="M169.854 1273.29C173.593 1273.29 176.624 1270.26 176.624 1266.52C176.624 1262.78 173.593 1259.75 169.854 1259.75C166.115 1259.75 163.084 1262.78 163.084 1266.52C163.084 1270.26 166.115 1273.29 169.854 1273.29Z"
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth={5.07715}
            fill="white"
          />
          <Path
            data="M257.857 1273.29C261.596 1273.29 264.627 1270.26 264.627 1266.52C264.627 1262.78 261.596 1259.75 257.857 1259.75C254.119 1259.75 251.088 1262.78 251.088 1266.52C251.088 1270.26 254.119 1273.29 257.857 1273.29Z"
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth={5.07715}
            fill="white"
          />
          <Path
            data="M169.854 1388.37C173.593 1388.37 176.624 1385.34 176.624 1381.6C176.624 1377.86 173.593 1374.83 169.854 1374.83C166.115 1374.83 163.084 1377.86 163.084 1381.6C163.084 1385.34 166.115 1388.37 169.854 1388.37Z"
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth={5.07715}
            fill="white"
          />
          <Path
            data="M257.857 1388.37C261.596 1388.37 264.627 1385.34 264.627 1381.6C264.627 1377.86 261.596 1374.83 257.857 1374.83C254.119 1374.83 251.088 1377.86 251.088 1381.6C251.088 1385.34 254.119 1388.37 257.857 1388.37Z"
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth={5.07715}
            fill="white"
          />
          
          {/* Letters */}
          <Path
            data="M189.254 1526.22V1515.92H237.775V1526.22H219.688V1575H207.341V1526.22H189.254Z"
            fill={color}
            fillOpacity={fillOpacity}
          />
          <Path
            data="M236.683 172.92V232H225.894L200.191 194.816H199.758V232H187.267V172.92H198.229L223.73 210.076H224.249V172.92H236.683Z"
            fill={color}
            fillOpacity={fillOpacity}
          />
        </Group>

        {/* Draggable and resizable image */}
        {image && (
          <>
            <Image
              ref={imageRef}
              image={image}
              x={width / 2 - 100}
              y={height / 2 - 100}
              width={200}
              height={200}
              draggable
              onClick={handleSelect}
              onTap={handleSelect}
            />
            {isSelected && (
              <Transformer
                ref={transformerRef}
                keepRatio={true}
                centeredScaling={true}
                boundBoxFunc={(oldBox, newBox) => {
                  // Ensure minimum size
                  if (newBox.width < 20 || newBox.height < 20) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            )}
          </>
        )}
      </Layer>
    </Stage>
  );
};

export default Skateboard;
