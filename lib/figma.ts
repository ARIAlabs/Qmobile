import * as Figma from 'figma-api';

// Initialize Figma API
// Store your token in environment variables or secure storage
const FIGMA_TOKEN = process.env.EXPO_PUBLIC_FIGMA_TOKEN || '';

const api = new Figma.Api({
  personalAccessToken: FIGMA_TOKEN
});

/**
 * Fetch a Figma file by its key
 * @param fileKey - The Figma file key from the URL (e.g., 'abc123def456')
 */
export async function getFigmaFile(fileKey: string) {
  try {
    const file = await api.getFile(fileKey);
    return file;
  } catch (error) {
    console.error('Error fetching Figma file:', error);
    throw error;
  }
}

/**
 * Extract design tokens from Figma file
 * @param fileKey - The Figma file key
 */
export async function getDesignTokens(fileKey: string) {
  try {
    const file = await api.getFile(fileKey);
    // Parse and extract colors, typography, spacing, etc.
    return {
      colors: extractColors(file),
      typography: extractTypography(file),
    };
  } catch (error) {
    console.error('Error fetching design tokens:', error);
    throw error;
  }
}

/**
 * Get images/assets from Figma
 * @param fileKey - The Figma file key
 * @param nodeIds - Array of node IDs to export
 */
export async function getFigmaImages(fileKey: string, nodeIds: string[]) {
  try {
    const images = await api.getImage(fileKey, {
      ids: nodeIds,
      scale: 2, // 2x for retina displays
      format: 'png'
    });
    return images;
  } catch (error) {
    console.error('Error fetching Figma images:', error);
    throw error;
  }
}

// Helper functions to extract design tokens
function extractColors(file: any) {
  // Implement your color extraction logic based on Figma structure
  return {};
}

function extractTypography(file: any) {
  // Implement your typography extraction logic
  return {};
}

export default api;