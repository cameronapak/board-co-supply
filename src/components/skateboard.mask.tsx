import type React from "react"

const SkateboardMask: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg width="0" height="0" viewBox="0 0 2976 720" xmlns="http://www.w3.org/2000/svg" {...props} id="skateboardMask">
      <defs>
        <mask id="skateboardMask">
          <path
            fill="white"
            d="M2616,0C2814.82,0,2976,161.18,2976,360C2976,558.82,2814.82,720,2616,720H360C161.18,720,0,558.82,0,360C0,161.18,161.18,0,360,0H2616Z"
          />
        </mask>
      </defs>
    </svg>
  )
}

export default SkateboardMask
