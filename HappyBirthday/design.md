# Happy Birthday Web Experience - Design Document

## 1. Overview
This project is a highly personalized, animated "Happy Birthday" web experience. It leverages a dark-themed, starry background with interactive canvas effects, over which a carefully choreographed sequence of messages, images, and birthday elements (balloons, hat, cake) are revealed using a robust animation timeline.

## 2. Visual Theme & Aesthetics
- **Background**: Deep dark blue/purple starry night effect with subtle, slowly fading fireworks or shooting stars rendered on an HTML5 `<canvas>`.
- **Typography**: Uses modern, clean web fonts (configured dynamically via Google Fonts).
- **Color Palette**: 
  - Dominant dark backgrounds (`#0f172a` or similar deep blues) to allow text and colorful SVGs to pop.
  - Vibrant accent colors for balloons (coral, teal, purple) and text highlights (pink).

## 3. Core Technologies
- **HTML5/CSS3**: Structured via absolute and relative positioning to allow elements to overlap and animate in/out of the same central focal point.
- **JavaScript (Vanilla)**: Handles data fetching, DOM manipulation, and canvas rendering.
- **GSAP TweenMax (1.x)**: The primary animation engine driving the complex, sequential `TimelineMax` choreography.
- **Canvas Confetti**: A lightweight library used to trigger a confetti explosion at the climax of the animation.

## 4. Customization Architecture (`customize.json`)
The application is entirely data-driven, allowing easy reuse without altering HTML/JS. 
- A `customize.json` file dictates the text content, images, and font preferences.
- **Binding**: Elements in the DOM use a custom `data-node-name` attribute. The `fetchData()` function iterates through the JSON and injects the corresponding strings into the `innerText` or `src` of matching elements.

## 5. Animation Choreography (Timeline Sequence)
The visual experience is built on a single, continuous GSAP timeline (`animationTimeline()`) that triggers when the user clicks the "Start" button. The sequence is broken down into thematic "ideas":

1. **Introduction (`.one`, `.two`)**: Gentle fade-ins of the initial greeting.
2. **The Realization (`.three`, `.four`, `.idea-1` to `.idea-4`)**: Successive text reveals expressing the intention to do something special.
3. **The Polaroid (`.six`, `.polaroid-wrapper`)**: A spinning, scaling polaroid image drops into the screen, pausing for the user to view.
4. **The Buildup (`.idea-6 span`)**: Large "S" and "O" characters aggressively scale and rotate in and out, building anticipation.
5. **The Celebration (`.baloons img`, `.hat`, `.wish-hbd`)**: 
   - Colorful balloons float up from the bottom.
   - A party hat spins into place.
   - The main "Happy Birthday" text letters playfully bounce into position individually (using Elastic easing).
6. **The Climax (`party` label)**: 
   - A sub-heading wishes them well.
   - The `canvas-confetti` library is triggered for a physical explosion effect.
7. **The Cake (`.eight svg`)**: An animated SVG birthday cake appears, pulsing playfully.
8. **The Outro (`.nine p`)**: Final closing remarks fade in, accompanied by a clickable replay button.

## 6. Technical Implementation Details
- **Letter Splitting**: For the elastic, bouncing text effects, the JS dynamically splits inner text strings into individual `<span>` elements before adding them to the timeline.
- **Canvas Trailing Effect**: The background canvas does not clear completely every frame. Instead, it fills with a `rgba(15, 23, 42, 0.2)` (dark, slightly transparent) color, allowing moving particles to leave smooth fading trails without breaking the dark theme.
- **State Management**: GSAP's `immediateRender` ensures elements are hidden during timeline construction. The entire `.container` remains invisible until the user clicks start, ensuring no layout flashes occur.
