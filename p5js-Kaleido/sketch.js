// The essential rendering algorithm I have used comes from Jim BumGardner's work at https://github.com/jbum/p5js_slider_sketches.  My midifications to that then tailor the interaction of the display to an Osher Lifelong Learning class on symmetry that I am co-teaching in January 2026 (https://tnaps-math-cs.website/Symmetry/).

// The technique used to create a flex layout for the canvas on the left and instructions on the right is described at https://www.perplexity.ai/search/i-want-to-style-a-web-page-tha-T0Z.HTmhRuq91BzsdcNVog#0



let kWidth = 800; // width of graphics
let kHeight = 800; // height of graphics

let nbrSides = 7;
let kMinSides = 3;
let kMaxSides = 13;
// let nbrSides_M1 = 3;
// let nbrSides_M2 = 5;

let scopeRadius = Math.floor(0.4 * kWidth);
let scopeMargin = 8;

let mirrorRadians = 0;
let adjustedMirrorRadians = 0;
let objectCellHeight = kWidth;
let objectCellWidth = kHeight;

let objectCell, // objectCell contains the things the kaleidoscope is looking at
  compositeCell; // composite cell is used to contruct the kaleidoscope view -- only needed because of the recursion/feedback feature.

let usesMirrors = false;

// these vars control the particle animation in the object cell
// let kBlurAmt = 0.01;
let kDarkenAmount = 164;
let kSpeed = 0.1;
let kMinPanSpeed = 0;
let kMaxPanSpeed = 0.05;
let kMinRotateSpeed = 0;
let kMaxRotateSpeed = 0.0005;
let kDoRotate = false;
let kTubeRotate = false;
let kStartTubeRotate;
//let kBisect = false;

let kWedgeFeedback = false;
// let kRecursionLevels = 0;
// let kRecursionScale = 0.66;
//let kShowFrameRate = false;

let rStart;
let src_img, src_images;

const pic_names = [
  "./assets/davine-simple-face.JPEG",
  "./assets/brute.png",
  "./assets/darcy.png",
  "./assets/circles.png",
];

const oc_padding = 4; // object cell padding -- this helps reduce edge artifacts in the center and outer rim

// FOR USER FILE UPLOAD
let input;
////////////////////////////////////////////

function setupMirrors() {
  // console.log("setup",nbrSides);
  mirrorRadians = (2 * PI) / (nbrSides * 2);
  let pixelAngle = 1 / scopeRadius; // helps reduce visible seams by overlapping aliased edges
  adjustedMirrorRadians = mirrorRadians + pixelAngle * 2;
}

// render the mirror shape - use the mirror button to see it
function myMask() {
  let ox = 0,
    oy = 0; // objectCell.height/2;
  let adjustedAngle = adjustedMirrorRadians; // helps reduce seams by adding a pixel to the outer angle
  compositeCell.beginShape();
  compositeCell.vertex(ox, oy);
  let beginAngle = -adjustedAngle / 2;
  let nbrDivs = 10;
  for (let i = 0; i <= nbrDivs; ++i) {
    let amt = i / nbrDivs;
    compositeCell.vertex(
      ox + cos(beginAngle + adjustedAngle * amt) * scopeRadius,
      oy + sin(beginAngle + adjustedAngle * amt) * scopeRadius
    );
  }
  compositeCell.endShape(CLOSE);
}

function DrawCell(oc) {
  oc.smooth();
  // when kDarkenAmount is a lower value, this provides a trail effect
  oc.background(0); // , 0, 0, kDarkenAmount);
  oc.noStroke();

  let subPixels = 2; // sub-pixel movement
  oc.push();
  if (kDoRotate) {
    let rotate_speed = map(kSpeed, 0, 1, kMinRotateSpeed, kMaxRotateSpeed);
    oc.translate(width / 2, height / 2);
    oc.rotate(millis() * rotate_speed);
    oc.scale(height / min(src_img.height, src_img.width));
    oc.image(src_img, -src_img.width / 2, -src_img.height / 2);
  } else {
    let pan_speed = map(kSpeed, 0, 1, kMinPanSpeed, kMaxPanSpeed);
    let pixels_traveled =
      (int(millis() * pan_speed) % (src_img.width * subPixels)) / subPixels;
    let delta_x = -pixels_traveled;
    oc.scale(height / src_img.height);
    oc.image(src_img, delta_x, 0);
    oc.image(src_img, delta_x + src_img.width, 0);
  }
  oc.pop();

  // this provides a blur effect
  // if (kBlurAmt >= 1 / 20) {
  //   oc.filter(BLUR, kBlurAmt);
  // }
}

function preload() {
  src_images = [];
  for (let i = 0; i < pic_names.length; ++i) {
    src_images.push(loadImage(pic_names[i]));
  }
  src_img = src_images[0];
}

function setup() {

  let min_window_dimension = Math.min(windowWidth, windowHeight);
  myCanvas = createCanvas(kWidth, kWidth);
  myCanvas.parent('p5-container');   // attach to the div instead of <body>[web:8]
  compositeCell = createGraphics(kWidth, kWidth);
  background(0);

  objectCellWidth = width;
  objectCellHeight = height;
  objectCell = createGraphics(objectCellWidth, objectCellHeight);
  frameRate(60); // desired frame rate

  kStartTubeRotate = millis();

  ellipseMode(RADIUS);
  setupMirrors();

  // Set up user interface

  // Picture menu
  label = createSpan("Picture");
  label.position(10, 10);
  label.style("font-family", "arial");
  label.style("color", "#ffffff");
  pictureMenu = createSelect();
  pictureMenu.position(10, 30);
  pictureMenu.option("Face", 0);
  pictureMenu.option("Brute", 1);
  pictureMenu.option("Darcy", 2);
  pictureMenu.option("Circles", 3);
  pictureMenu.changed(onpictureMenuChange);

  // Activate mirror button
  mirrorButton = createButton("Mirrors on/off");
  mirrorButton.position(100, 10);
  mirrorButton.size(200, 20);

  // Attach event handler - fires when button is clicked
  mirrorButton.mouseClicked(onMirrorButtonClick);

  // Activate mirror wedge button
  mirrorWedgeButton = createButton("Toggle mirror wedge display");
  mirrorWedgeButton.position(100, 30);
  mirrorWedgeButton.size(200, 20);

  // Attach event handler - fires when button is clicked
  mirrorWedgeButton.mouseClicked(onMirrorWedgeButtonClick);

  // Activate image rotate button
  imageRotateButton = createButton("Toggle picture rotate");
  imageRotateButton.position(100, 50);
  imageRotateButton.size(200, 20);

  // Attach event handler
  imageRotateButton.mouseClicked(onImageRotateButtonClick);

  // Activate tube rotate button
  tubeRotateButton = createButton("Toggle mirror rotate");
  tubeRotateButton.position(100, 70);
  tubeRotateButton.size(200, 20);

  // Attach event handler - fires when button is clicked
  tubeRotateButton.mouseClicked(onTubeRotateButtonClick);

  // Wedge size slider
  label = createSpan("Number reflections");
  label.position(320, 10);
  label.style("font-family", "arial");
  label.style("color", "#ffffff");
  wedgeSizeSlider = createSlider(3, 13, 7, 1); // min, max, initial, step [web:1][web:6]
  wedgeSizeSlider.position(320, 30);
  // Event handler
  wedgeSizeSlider.changed(onWedgeSizeSliderInput);

  // Rotation speed slider
  label = createSpan("Rotation speed");
  label.position(490, 10);
  label.style("font-family", "arial");
  label.style("color", "#ffffff");
  speedSlider = createSlider(0.0, 1.0, 0.14, 0.01); // min, max, initial, step [web:1][web:6]
  speedSlider.position(490, 30);
  // Event handler
  speedSlider.changed(onSpeedSliderInput);

// CHANGE 2 FOR USER FILE INPUT    
  // Create a file input and place it on
  // the canvas.
  // input = createFileInput(handleImage);
  // input.position(0, 200);

 // Hidden file input so we get the appropriate label for the button
  fileInput = createFileInput(handleImage);
  fileInput.attribute('accept', 'image/*');  // optional: images only
  fileInput.style('display', 'none');        // hide the actual input

  // Visible button with any label you like
  loadButton = createButton('Load image');
  loadButton.position(10, 200);
  loadButton.mousePressed(() => {
    // forward click to hidden file input
    fileInput.elt.click();
  });    

}

function handleImage(file) {
  if (file.type === 'image') {
      src_img = createImg(file.data, '');
  } else {
      console.log('File upload error');
  }
}

function onpictureMenuChange() {
  console.log("pictureMenu change" + pictureMenu.value());
  src_img = src_images[pictureMenu.value()];
  console.log(src_img);
}

function onMirrorButtonClick() {
  usesMirrors = !usesMirrors;
}

function onMirrorWedgeButtonClick() {
  kWedgeFeedback = !kWedgeFeedback;
}

function onImageRotateButtonClick() {
  kDoRotate = !kDoRotate;
}

function onTubeRotateButtonClick() {
  kTubeRotate = !kTubeRotate;
  if (kTubeRotate) {
    kStartTubeRotate = millis();
  }
}

function onWedgeSizeSliderInput() {
  nbrSides = constrain(wedgeSizeSlider.value(), kMinSides, kMaxSides);
  console.log("nbr sides = ", nbrSides);
  setupMirrors();
}

function onSpeedSliderInput() {
  kSpeed = map(speedSlider.value(), 0, 1, 0, 1);
}

// copies wedges from the objectCell to the compositeCell in a 2-mirror kaleidoscope pattern
// that rotates about the center
//
// alternate wedges are reflected by inverting the Y scaling
function applyMirrors() {
  for (let i = 0; i < nbrSides; ++i) {
    // for each reflection, there are two wedges copied (a normal one, and a reflected one)
    compositeCell.push();
    compositeCell.rotate(mirrorRadians * i * 2);
    compositeCell.push();
    compositeCell.clip(myMask);
    compositeCell.image(
      objectCell,
      -objectCell.width / 2,
      -objectCell.height / 2
    );
    compositeCell.pop();

    // every other wedge is inverted (reflected)
    compositeCell.rotate(mirrorRadians);
    compositeCell.scale(1, -1);
    compositeCell.push();
    compositeCell.clip(myMask);
    compositeCell.image(
      objectCell,
      -objectCell.width / 2,
      -objectCell.height / 2
    );
    compositeCell.pop();
    compositeCell.pop();
  }
}

let average_fr = 0;
let fr_count = 0;
let fr_total = 0;

function draw() {
  DrawCell(objectCell); // draw object cell contents

  // begin rendering to composteCell
  compositeCell.background(0);
  compositeCell.push();
  compositeCell.translate(width / 2, height / 2);

  if (usesMirrors) {
    //    let save_nbrSides = nbrSides;
    //    nbrSides = kRecursionLevels > 0 ? nbrSides_M1 : save_nbrSides;
    setupMirrors();
    applyMirrors(); // copy the wedges from the object cell to the composite Cell
    // apply feedback passes, if any
    // for (let i = 0; i < kRecursionLevels; ++i) {
    //   nbrSides = kRecursionLevels > 1 && i == 0 ? nbrSides_M2 : save_nbrSides;
    //   setupMirrors();
    //   let cx = objectCell.width / 2;
    //   let cy = objectCell.height / 2;
    //   let dx = cx + objectCell.width / 4;
    //   let dy = cy;
    //   let image_width = kWidth * kRecursionScale;
    //   let image_height = kHeight * kRecursionScale;
    //   if (kBisect) {
    //     let center_rad = dx - cx;
    //     dx = cx + cos(-mirrorRadians / 2) * center_rad;
    //     dy = cy + sin(-mirrorRadians / 2) * center_rad;
    //   }
    //   objectCell.image(
    //     compositeCell,
    //     dx - image_width / 2,
    //     dy - image_height / 2,
    //     image_width,
    //     image_height
    //   );
    //   applyMirrors();
    // }
  } else {
    compositeCell.background(0);
    compositeCell.image(
      objectCell,
      -objectCell.width / 2,
      -objectCell.height / 2
    );
  }

  if (kWedgeFeedback) {
    // show the wedge shape itself
    compositeCell.push();
    // compositeCell.translate(10, 154);
    compositeCell.fill(0, 0, 255, 128);
    compositeCell.noStroke();
    myMask();
    compositeCell.pop();
  }
  compositeCell.pop(); // finish drawing

  // render compositeCell to screen, with rotation about the center
  push();
  background(0);
  translate(width / 2, height / 2);
  if (kTubeRotate) {
    rotate((millis() - kStartTubeRotate) * 0.00005); // rotating of scope as a whole
  }
  image(compositeCell, -kWidth / 2, -kHeight / 2);
  pop();

  let fr = frameRate();
  fr_total += fr;
  fr_count += 1;
  if (fr_count > 60) {
    average_fr = fr_total / fr_count;
    fr_total = 0;
    fr_count = 0;
  }

  //  if (kShowFrameRate) {
  //    push();
  //    fill(255);
  //    textSize(16);
  //    let fr_str = average_fr.toFixed(1);
  //    text(fr_str, 10, 20);
  //    pop();
  //  }
}

// let small_size = 512;
// let large_size = 900;

// function toggle_sketch_size() {
//   kWidth = kWidth === small_size ? large_size : small_size;
//   kHeight = kWidth;
//   resizeCanvas(kWidth, kHeight);
// }

// function keyPressed() {
//   // Return early if the preset editor is active
//   const presetEditor = document.getElementById("preset-editor");
//   if (
//     presetEditor &&
//     presetEditor.style.display !== "none" &&
//     presetEditor.style.display !== ""
//   ) {
//     return;
//   }
//   if (key === "x" || key === "X") {
//     toggle_slider_visibility();
//   } else if (key === "s" || key === "S") {
//     toggle_sketch_size();
//   }
// }
