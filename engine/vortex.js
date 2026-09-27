// Keep first theme big detailed eyes, but make them small like second image
document.addEventListener('DOMContentLoaded',()=>{
  const eyes = document.getElementById('vortex-eyes');
  eyes.style.transform = 'scale(0.55)'; // makes big eyes small - not smaller not big
  eyes.style.gap = '24px';
  eyes.style.margin = '0 auto';
  // Tight gap fix
  document.getElementById('eyes-wrap').style.paddingBottom = '2px';
  document.querySelector('.stories-section').style.marginTop = '0px';
  document.querySelector('.stories-section').style.paddingTop = '4px';
});
