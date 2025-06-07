export const downloadAndRun = async (name, batFile) => {
  try {
    const baseUrl = "https://raw.githubusercontent.com/DragosKissLove/tfy-electron2312/master/src/utils/";
    const response = await fetch(`${baseUrl}${batFile}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download ${name} installer`);
    }
    
    const batContent = await response.text();
    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const fileURL = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = fileURL;
    link.download = `${name}.bat`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileURL);

    alert(`🔧 ${name} installer downloaded. Please run the .bat file to install.`);
  } catch (error) {
    alert(`❌ Error downloading ${name}: ${error.message}`);
  }
};