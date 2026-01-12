/**
 * Utility functions for PDF generation
 * Converts SVGs and icons to data URLs for use with @react-pdf/renderer
 */

/**
 * Converts an SVG string to a PNG base64 data URL using canvas
 * This is more reliable than SVG data URLs for @react-pdf/renderer
 * @param svgString - The SVG string to convert
 * @param scale - Scale factor for higher quality (default: 3 for icons, 1 for large images)
 */
export const svgToPngDataUrl = (svgString: string, scale: number = 1): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if we're in a browser environment with canvas support
    if (typeof document === 'undefined' || typeof Image === 'undefined') {
      // Fallback to SVG data URL if canvas is not available
      resolve(svgToDataUrl(svgString));
      return;
    }
    
    try {
      // Remove any XML declaration and ensure proper encoding
      const cleanedSvg = svgString
        .replace(/<\?xml[^>]*\?>/g, '')
        .trim();
      
      // Create an image from the SVG
      const img = new Image();
      const svgBlob = new Blob([cleanedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        try {
          // Create canvas and draw the image at higher resolution
          const canvas = document.createElement('canvas');
          // Use natural dimensions or default size, scaled up for quality
          const baseWidth = img.naturalWidth || img.width || 200;
          const baseHeight = img.naturalHeight || img.height || 200;
          const width = baseWidth * scale;
          const height = baseHeight * scale;
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { 
            alpha: true,
            desynchronized: false 
          });
          
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(svgToDataUrl(svgString)); // Fallback to SVG
            return;
          }
          
          // Enable high-quality rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw the image directly at the scaled size (better quality than scaling context)
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to PNG data URL with high quality
          const pngDataUrl = canvas.toDataURL('image/png', 1.0);
          
          // Clean up
          URL.revokeObjectURL(url);
          
          resolve(pngDataUrl);
        } catch (error) {
          URL.revokeObjectURL(url);
          resolve(svgToDataUrl(svgString)); // Fallback to SVG
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(svgToDataUrl(svgString)); // Fallback to SVG
      };
      
      img.src = url;
    } catch (error) {
      // Fallback to SVG data URL on any error
      resolve(svgToDataUrl(svgString));
    }
  });
};

/**
 * Synchronous version that returns SVG data URL
 * Uses URL encoding which is more compatible with @react-pdf/renderer
 */
export const svgToDataUrl = (svgString: string): string => {
  const cleanedSvg = svgString
    .replace(/<\?xml[^>]*\?>/g, '')
    .trim();
  
  // Use URL encoding instead of base64 for better compatibility
  const encoded = encodeURIComponent(cleanedSvg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
};

/**
 * Creates an SVG icon string with customizable size and color
 * Uses a larger viewBox for better quality rendering
 */
const createIconSvg = (
  pathData: string,
  size: number = 12,
  color: string = '#2E9E5E'
): string => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${pathData}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`;
};

/**
 * LinkedIn icon SVG path data (from lucide-react)
 */
const linkedinPath = "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z";

/**
 * GitHub icon SVG path data (from lucide-react)
 */
const githubPath = "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4M9 18c-4.51 2-5-2-7-2";

/**
 * Globe icon SVG path data (simplified globe icon)
 */
const globePath = "M21.54 15H17a2 2 0 0 0-2 2v4.54M7 3.34V5a2 2 0 0 0 2 2h2.76M2 10h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H2.22M10 2v2a2 2 0 0 0 2 2h2M10 18v-2a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2M18 10h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.34M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10zM2 12h20";

/**
 * Logo SVG string (from Black Logo.svg)
 */
const logoSvg = `<svg width="1399" height="200" viewBox="0 0 1399 200" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M19.9835 159.867C31.0197 159.867 39.9663 168.815 39.9663 179.851C39.9663 190.887 31.0197 199.834 19.9835 199.834C8.94654 199.834 0 190.887 0 179.851C0 168.815 8.94654 159.867 19.9835 159.867Z" fill="#242425"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M99.9148 159.868C110.951 159.868 119.898 168.815 119.898 179.851C119.898 190.887 110.951 199.834 99.9148 199.834C88.8788 199.834 79.9316 190.887 79.9316 179.851C79.9316 168.815 88.8788 159.868 99.9148 159.868Z" fill="#252525"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M179.847 159.868C190.883 159.868 199.83 168.815 199.83 179.851C199.83 190.887 190.883 199.834 179.847 199.834C168.811 199.834 159.864 190.887 159.864 179.851C159.864 168.815 168.811 159.868 179.847 159.868Z" fill="#252525"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M19.9835 79.9318C31.0197 79.9318 39.9663 88.879 39.9663 99.9152C39.9663 110.952 31.0197 119.899 19.9835 119.899C8.94654 119.899 0 110.952 0 99.9152C0 88.879 8.94654 79.9318 19.9835 79.9318Z" fill="#252525"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M99.9148 79.9326C110.951 79.9326 119.898 88.8796 119.898 99.9156C119.898 110.952 110.951 119.899 99.9148 119.899C88.8788 119.899 79.9316 110.952 79.9316 99.9156C79.9316 88.8796 88.8788 79.9326 99.9148 79.9326Z" fill="#252525"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M179.847 79.9324C190.883 79.9324 199.83 88.8794 199.83 99.9155C199.83 110.952 190.883 119.899 179.847 119.899C168.811 119.899 159.864 110.952 159.864 99.9155C159.864 88.8794 168.811 79.9324 179.847 79.9324Z" fill="#242425"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M19.9835 0.00364685C31.0197 0.00364685 39.9663 8.95098 39.9663 19.9872C39.9663 31.0234 31.0197 39.9707 19.9835 39.9707C8.94654 39.9707 0 31.0234 0 19.9872C0 8.95098 8.94654 0.00364685 19.9835 0.00364685Z" fill="#242425"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M99.9148 0.00443649C110.951 0.00443649 119.898 8.9516 119.898 19.9876C119.898 31.0235 110.951 39.9707 99.9148 39.9707C88.8788 39.9707 79.9316 31.0235 79.9316 19.9876C79.9316 8.9516 88.8788 0.00443649 99.9148 0.00443649Z" fill="#252525"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M179.847 0.00424957C190.883 0.00424957 199.83 8.95144 199.83 19.9875C199.83 31.0235 190.883 39.9707 179.847 39.9707C168.811 39.9707 159.864 31.0235 159.864 19.9875C159.864 8.95144 168.811 0.00424957 179.847 0.00424957Z" fill="#252525"/>
<path d="M99.9148 159.868C88.8784 159.868 79.9316 168.815 79.9316 179.851C79.9316 190.887 88.8784 199.834 99.9148 199.834H179.847C190.884 199.834 199.83 190.887 199.83 179.851C199.83 168.815 190.884 159.868 179.847 159.868H99.9148Z" fill="#505CFD"/>
<path d="M19.9831 79.9324C8.94675 79.9324 0 88.8792 0 99.9156C0 110.952 8.94675 119.899 19.9831 119.899H99.9154C110.952 119.899 119.899 110.952 119.899 99.9156V39.9666L179.848 39.9663C190.884 39.9662 199.831 31.0194 199.831 19.983C199.831 8.94669 190.884 2.28882e-05 179.848 2.28882e-05H99.9153C88.879 2.28882e-05 79.9323 8.94721 79.9323 19.9836V79.9324H19.9831Z" fill="#505CFD"/>
<path d="M312.117 166.531H300.779C296.433 166.531 293.221 163.249 293.221 158.808V41.2266C293.221 36.5928 296.433 33.3105 300.779 33.3105H312.117C316.652 33.3105 319.865 36.5928 319.865 41.2266V158.808C319.865 163.249 316.652 166.531 312.117 166.531ZM415.192 141.6L395.448 70.2318C392.544 60.145 391.77 57.1 388.286 57.1C384.995 57.1 384.414 59.1935 384.802 69.2802L387.124 157.967C387.124 162.344 383.834 165.58 379.382 165.58H367.574C363.122 165.58 359.831 162.344 359.831 157.967V58.6225C359.831 39.7813 367.961 33.3105 386.35 33.3105C404.352 33.3105 411.708 37.4975 417.515 58.2419L437.065 129.61C439.969 139.507 440.743 142.742 444.227 142.742C447.518 142.742 448.099 140.648 447.905 130.752L445.776 42.0651C445.582 37.4975 448.873 34.2621 453.518 34.2621H465.133C469.778 34.2621 473.069 37.4975 473.069 42.0651V141.219C473.069 160.061 464.745 166.531 446.55 166.531C428.354 166.531 420.805 162.344 415.192 141.6ZM513.035 158.808V41.2266C513.035 36.5928 516.337 33.3105 520.804 33.3105H573.441C610.734 33.3105 626.273 45.6673 626.273 93.1634V106.099C626.273 154.175 610.734 166.531 573.441 166.531H520.804C516.337 166.531 513.035 163.249 513.035 158.808ZM543.241 53.2937C540.471 53.2937 539.679 54.0809 539.679 56.8361V136.345C539.679 139.1 540.471 139.887 543.241 139.887H573.116C594.682 139.887 599.629 133.196 599.629 102.101V90.6863C599.629 59.985 594.682 53.2937 573.116 53.2937H543.241ZM659.578 113.822V85.8266C659.578 42.9642 672.679 33.3105 703.572 33.3105H751.477C756.365 33.3105 759.494 36.5928 759.494 41.2266V49.5287C759.494 54.1625 756.365 57.4448 751.477 57.4448H711.393C690.863 57.4448 687.148 61.3062 687.148 82.9305V83.3166C687.148 86.0197 687.93 86.792 690.667 86.792H743.656C748.544 86.792 751.672 90.0742 751.672 94.708V102.624C751.672 107.258 748.544 110.54 743.656 110.54H690.667C688.125 110.54 687.148 111.505 687.148 114.015V116.525C687.148 138.536 690.667 142.397 711.393 142.397H751.477C756.17 142.397 759.494 145.679 759.494 150.313V158.808C759.494 163.249 756.17 166.531 751.477 166.531H703.572C672.679 166.531 659.578 156.878 659.578 113.822ZM799.409 166.531H786.21C780.28 166.531 777.22 160.344 781.428 154.543L818.919 102.725C821.406 99.2442 821.215 97.1173 818.919 93.8303L784.106 44.7184C779.898 38.3377 783.149 33.3105 788.697 33.3105H802.087C808.016 33.3105 810.503 35.8241 814.903 42.9782L836.518 74.8816C838.813 78.7487 840.726 78.9421 843.213 74.8816L864.254 42.9782C868.845 35.8241 871.14 33.3105 877.261 33.3105H890.268C895.816 33.3105 898.876 38.5311 894.477 44.7184L859.472 93.637C856.794 97.5041 856.985 98.2775 859.663 101.951L897.346 154.543C901.745 160.537 898.494 166.531 892.372 166.531H879.174C873.053 166.531 869.801 163.631 865.402 156.864L842.256 122.06C839.578 117.806 838.048 117.806 835.561 122.253L812.99 156.864C808.973 163.438 805.338 166.531 799.409 166.531ZM988.041 141.6L968.298 70.2318C965.394 60.145 964.62 57.1 961.135 57.1C957.845 57.1 957.264 59.1935 957.651 69.2802L959.974 157.967C959.974 162.344 956.683 165.58 952.231 165.58H940.424C935.971 165.58 932.681 162.344 932.681 157.967V58.6225C932.681 39.7813 940.811 33.3105 959.2 33.3105C977.202 33.3105 984.557 37.4975 990.364 58.2419L1009.91 129.61C1012.82 139.507 1013.59 142.742 1017.08 142.742C1020.37 142.742 1020.95 140.648 1020.75 130.752L1018.63 42.0651C1018.43 37.4975 1021.72 34.2621 1026.37 34.2621H1037.98C1042.63 34.2621 1045.92 37.4975 1045.92 42.0651V141.219C1045.92 160.061 1037.6 166.531 1019.4 166.531C1001.2 166.531 993.655 162.344 988.041 141.6ZM1104.78 166.531H1093.44C1089.1 166.531 1085.88 163.249 1085.88 158.808V41.2266C1085.88 36.5928 1089.1 33.3105 1093.44 33.3105H1104.78C1109.32 33.3105 1112.53 36.5928 1112.53 41.2266V158.808C1112.53 163.249 1109.32 166.531 1104.78 166.531ZM1207.86 141.6L1188.11 70.2318C1185.21 60.145 1184.43 57.1 1180.95 57.1C1177.66 57.1 1177.08 59.1935 1177.47 69.2802L1179.79 157.967C1179.79 162.344 1176.5 165.58 1172.05 165.58H1160.24C1155.79 165.58 1152.5 162.344 1152.5 157.967V58.6225C1152.5 39.7813 1160.63 33.3105 1179.01 33.3105C1197.02 33.3105 1204.37 37.4975 1210.18 58.2419L1229.73 129.61C1232.63 139.507 1233.41 142.742 1236.89 142.742C1240.18 142.742 1240.76 140.648 1240.57 130.752L1238.44 42.0651C1238.25 37.4975 1241.54 34.2621 1246.18 34.2621H1257.8C1262.44 34.2621 1265.73 37.4975 1265.73 42.0651V141.219C1265.73 160.061 1257.41 166.531 1239.21 166.531C1221.02 166.531 1213.47 162.344 1207.86 141.6ZM1299.04 113.822V85.8266C1299.04 42.9642 1312.14 33.3105 1343.03 33.3105H1390.94C1395.83 33.3105 1398.95 36.5928 1398.95 41.2266V49.5287C1398.95 54.1625 1395.83 57.4448 1390.94 57.4448H1350.85C1330.32 57.4448 1326.61 61.3062 1326.61 82.9305V83.3166C1326.61 86.0197 1327.39 86.792 1330.13 86.792H1383.12C1388 86.792 1391.13 90.0742 1391.13 94.708V102.624C1391.13 107.258 1388 110.54 1383.12 110.54H1330.13C1327.59 110.54 1326.61 111.505 1326.61 114.015V116.525C1326.61 138.536 1330.13 142.397 1350.85 142.397H1390.94C1395.63 142.397 1398.95 145.679 1398.95 150.313V158.808C1398.95 163.249 1395.63 166.531 1390.94 166.531H1343.03C1312.14 166.531 1299.04 156.878 1299.04 113.822Z" fill="#242425"/>
</svg>`;

/**
 * Pre-computed data URLs for icons and logo
 * These functions return promises that resolve to PNG data URLs
 * Icons use scale factor of 6 for high quality (12px * 6 = 72px rendered, then scaled down to 12px in PDF)
 * This ensures crisp rendering even when scaled down
 * Logo uses scale factor of 2 for good quality without excessive file size
 */
export const getLinkedinIconDataUrl = async (color: string = '#2E9E5E'): Promise<string> => {
  return svgToPngDataUrl(createIconSvg(linkedinPath, 12, color), 6);
};

export const getGithubIconDataUrl = async (color: string = '#2E9E5E'): Promise<string> => {
  return svgToPngDataUrl(createIconSvg(githubPath, 12, color), 6);
};

export const getGlobeIconDataUrl = async (color: string = '#2E9E5E'): Promise<string> => {
  return svgToPngDataUrl(createIconSvg(globePath, 12, color), 6);
};

export const getLogoDataUrl = async (): Promise<string> => {
  return svgToPngDataUrl(logoSvg, 2);
};

/**
 * Cache for pre-computed data URLs to avoid regenerating them
 */
const dataUrlCache: Record<string, string> = {};

/**
 * Get cached or generate new data URL for logo
 */
export const getCachedLogoDataUrl = async (): Promise<string> => {
  if (dataUrlCache.logo) {
    return dataUrlCache.logo;
  }
  const url = await getLogoDataUrl();
  dataUrlCache.logo = url;
  return url;
};

/**
 * Get cached or generate new data URL for LinkedIn icon
 */
export const getCachedLinkedinIconDataUrl = async (color: string = '#2E9E5E'): Promise<string> => {
  const key = `linkedin-${color}`;
  if (dataUrlCache[key]) {
    return dataUrlCache[key];
  }
  const url = await getLinkedinIconDataUrl(color);
  dataUrlCache[key] = url;
  return url;
};

/**
 * Get cached or generate new data URL for GitHub icon
 */
export const getCachedGithubIconDataUrl = async (color: string = '#2E9E5E'): Promise<string> => {
  const key = `github-${color}`;
  if (dataUrlCache[key]) {
    return dataUrlCache[key];
  }
  const url = await getGithubIconDataUrl(color);
  dataUrlCache[key] = url;
  return url;
};

/**
 * Get cached or generate new data URL for Globe icon
 */
export const getCachedGlobeIconDataUrl = async (color: string = '#2E9E5E'): Promise<string> => {
  const key = `globe-${color}`;
  if (dataUrlCache[key]) {
    return dataUrlCache[key];
  }
  const url = await getGlobeIconDataUrl(color);
  dataUrlCache[key] = url;
  return url;
};

