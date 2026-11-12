// Site-wide settings. Anything marked OPEN is waiting on Derick to confirm.
window.DCB_CONFIG = {
  // OPEN: logo / branding files. Leave null to show the text name.
  // When Derick supplies one, drop it in public/images/ and set e.g. "logo.svg".
  logo: null,

  // OPEN: how commission inquiries should reach him. Instagram is the only channel in use so far.
  instagram: {
    handle: "derbycityblades",
    url: "https://www.instagram.com/derbycityblades/"
  },

  // OPEN: his favorite photo for the hero. Reuses the Spur gallery photo until he picks one.
  heroPhoto: "spur-carbon-maple.jpg",
  heroPhotoAlt: "Spur knife with carbon fiber and curly maple handle and a translucent blue spacer",

  // Folder the build serves public/images/ from, relative to the page.
  imageBase: "images/",

  // Design-preview filler: random non-knife photos in public/images/filler/, shown only where a
  // real photo is missing and tagged FILLER PHOTO. Set to false (or delete the folder) before going live.
  useFiller: false,
  fillerBase: "images/filler/"
};
