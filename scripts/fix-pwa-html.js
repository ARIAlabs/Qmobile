const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

const metaTags = `
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Quilox">
  <meta name="mobile-web-app-capable" content="yes">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
`;

function processHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processHtmlFiles(filePath);
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Check if meta tags already exist
      if (!content.includes('apple-mobile-web-app-capable')) {
        // Insert meta tags after <head>
        content = content.replace('<head>', '<head>' + metaTags);
        fs.writeFileSync(filePath, content);
        console.log('Updated:', filePath);
      }
    }
  });
}

console.log('Adding iOS PWA meta tags to HTML files...');
processHtmlFiles(distDir);
console.log('Done!');
