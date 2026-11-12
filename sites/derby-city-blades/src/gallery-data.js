// Every gallery card lives here, one line per card, shown in this order.
// To add a photo: drop the file in public/images/ and set `photo` to its filename.
// `photo: null` (or a file that is not there yet) shows the PHOTO TO COME panel.
// `section` must match one of the section titles below.
window.DCB_GALLERY = {
  // One filter chip per section, plus "All".
  // layout: "feature" = large photo left, caption right; "feature-reverse" = mirrored; "row" = three across.
  // OPEN: full model list and spellings still need Derick to confirm. "Stalhorse" is spelled as recorded.
  sections: [
    { title: "Spur", layout: "feature" },
    { title: "Stayer", layout: "feature-reverse" },
    { title: "Favorite Projects", layout: "row" },
    { title: "More Models", layout: "row" }
  ],

  items: [
    { section: "Spur", eyebrow: "Model", name: "Spur", caption: "Carbon fiber and curly maple, translucent blue spacer.", photo: "spur-carbon-maple.jpg" },
    { section: "Stayer", eyebrow: "Model", name: "Stayer", caption: "Purple and amber scales.", photo: "stayer-purple-amber.jpg" },
    { section: "Favorite Projects", eyebrow: "Favorite Projects", name: "Collaboration", caption: "Elk antler, mammoth and true stone collaboration.", photo: "collaboration-antler-mammoth.jpg" },
    { section: "Favorite Projects", eyebrow: "Favorite Projects", name: "Prototype", caption: "Pink and blue prototype.", photo: "prototype-pink-blue.jpg" },
    { section: "Favorite Projects", eyebrow: "Favorite Projects", name: "Patterned Scales", caption: "Green patterned scales and striped wood.", photo: "patterned-scales.jpg" },
    { section: "More Models", eyebrow: "Model", name: "Mega Spur", caption: "Photo coming soon.", photo: null },
    { section: "More Models", eyebrow: "Model", name: "Colt", caption: "Photo coming soon.", photo: null },
    { section: "More Models", eyebrow: "Model", name: "Stalhorse", caption: "Photo coming soon.", photo: null }
  ]
};
