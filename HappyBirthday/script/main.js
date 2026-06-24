let audioUrl = ""
let audio = null
let isPlaying = false
let customDataStore = {} // FEATURE: Store custom data globally

// FEATURE 7: Module-scope timeline variable for shake-to-replay access
let tl
let timelineStarted = false

// FEATURE 1: Cursor sparkle throttle timestamp
let lastSparkleTime = 0

// FEATURE 6: Polaroid tilt gate flag
let polaroidReady = false

// FEATURE 2: Slideshow state
let currentSlide = 0
let slideshowInterval = null

// FEATURE 5: Floating Emoji Rain
function spawnEmojiRain() {
  const emojis = ['🎂', '🎉', '✨', '🎈', '💫', '🌟', '🎊']
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div')
    el.className = 'emoji-float'
    el.innerText = emojis[Math.floor(Math.random() * emojis.length)]
    el.style.left = (Math.random() * 90 + 5) + '%'
    el.style.setProperty('--dur', (Math.random() * 2.5 + 2.5) + 's')
    el.style.setProperty('--delay', (Math.random() * 1.5) + 's')
    document.body.appendChild(el)
    el.addEventListener('animationend', () => el.remove())
  }
}

// FEATURE 4: Typewriter Effect
function typewriterAnimate(element, text, speed, onComplete) {
  speed = speed || 40
  element.innerText = ''
  const cursor = document.createElement('span')
  cursor.className = 'type-cursor'
  cursor.textContent = '|'
  element.appendChild(cursor)
  let i = 0
  const interval = setInterval(() => {
    if (i < text.length) {
      // Insert character before cursor
      cursor.before(text.charAt(i))
      i++
    } else {
      clearInterval(interval)
      cursor.remove()
      if (typeof onComplete === 'function') onComplete()
    }
  }, speed)
}

// Import the data to customize and insert them into page
const fetchData = () => {
  fetch("customize.json")
    .then(data => data.json())
    .then(data => {
      customDataStore = data // FEATURE: Save data globally
      dataArr = Object.keys(data)
      dataArr.map(customData => {
        if (data[customData] !== "") {
          if (customData === "imagePath") {
            document
              .querySelector(`[data-node-name*="${customData}"]`)
              .setAttribute("src", data[customData])
          } else if (customData === "fonts") {
            data[customData].forEach(font => {
              const link = document.createElement('link')
              link.rel = 'stylesheet'
              link.href = font.path
              document.head.appendChild(link)
              //设置body字体
              document.body.style.fontFamily = font.name
            })
          } else if (customData === "music") {
            audioUrl = data[customData]
            audio = new Audio(audioUrl)
            audio.preload = "auto"
          } 
          // FEATURE 1: Handle gallery images
          else if (customData === "galleryImages" && Array.isArray(data[customData])) {
            const slideshowContainer = document.querySelector(".slideshow-container")
            if (slideshowContainer && data[customData].length > 1) {
              // Remove default image, add gallery images
              slideshowContainer.innerHTML = ""
              data[customData].forEach((img, index) => {
                const imgEl = document.createElement('img')
                imgEl.src = img
                imgEl.className = 'lydia-dp slideshow-image'
                imgEl.alt = ""
                if (index === 0) imgEl.classList.add('active')
                slideshowContainer.appendChild(imgEl)
              })

              // FEATURE 2: Create dot navigation
              const dotsContainer = document.querySelector(".slideshow-dots")
              if (dotsContainer) {
                dotsContainer.innerHTML = ""
                data[customData].forEach((_, index) => {
                  const dot = document.createElement('span')
                  dot.className = 'slide-dot'
                  if (index === 0) dot.classList.add('active')
                  dot.addEventListener('click', () => {
                    goToSlide(index)
                  })
                  dotsContainer.appendChild(dot)
                })

                // FEATURE 2: Auto-advance slideshow every 3 seconds
                slideshowInterval = setInterval(() => {
                  const images = document.querySelectorAll('.slideshow-image')
                  if (images.length > 1) {
                    currentSlide = (currentSlide + 1) % images.length
                    goToSlide(currentSlide)
                  }
                }, 3000)
              }
            }
          }
          // FEATURE 1: Handle gallery captions
          else if (customData === "galleryCaptions" && Array.isArray(data[customData])) {
            const caption = document.querySelector(".slideshow-caption")
            if (caption && data[customData].length > 0) {
              caption.innerText = data[customData][0]
            }
          }
          // FEATURE 6: Handle letter content
          else if (customData === "letterContent") {
            const letterContent = document.querySelector(".letter-content")
            if (letterContent) {
              letterContent.innerText = data[customData]
            }
          }
          // FEATURE 6: Handle letter signoff
          else if (customData === "letterSignoff") {
            const letterSignoff = document.querySelector(".letter-signoff")
            if (letterSignoff) {
              letterSignoff.innerText = data[customData]
            }
          }
          // FEATURE 7: Handle candle count
          else if (customData === "candleCount") {
            const candlesContainer = document.querySelector(".candles-container")
            if (candlesContainer) {
              candlesContainer.innerHTML = ""
              for (let i = 0; i < data[customData]; i++) {
                const candle = document.createElement('div')
                candle.className = 'candle'
                candle.dataset.index = i
                candlesContainer.appendChild(candle)
              }
            }
          }
          else {
            const el = document.querySelector(`[data-node-name*="${customData}"]`)
            if (el) {
              el.innerText = data[customData]
            }
          }
        }

        // Check if the iteration is over
        // Run amimation if so
        if (dataArr.length === dataArr.indexOf(customData) + 1) {
          document.querySelector("#startButton").addEventListener("click", () => {
            document.querySelector(".startSign").style.display = "none"
            timelineStarted = true // FEATURE 7: Mark timeline as started
            animationTimeline()
          }
          )
          // animationTimeline()
        }
      })
    })
}

// FEATURE 2: Go to specific slide helper
function goToSlide(index) {
  const images = document.querySelectorAll('.slideshow-image')
  const dots = document.querySelectorAll('.slide-dot')
  const caption = document.querySelector('.slideshow-caption')

  images.forEach(img => img.classList.remove('active'))
  dots.forEach(dot => dot.classList.remove('active'))

  if (images[index]) images[index].classList.add('active')
  if (dots[index]) dots[index].classList.add('active')

  // Update caption
  if (caption && customDataStore.galleryCaptions && customDataStore.galleryCaptions[index]) {
    caption.innerText = customDataStore.galleryCaptions[index]
  }

  currentSlide = index
}

// Animation Timeline
const animationTimeline = () => {
  // Spit chars that needs to be animated individually
  const textBoxChars = document.getElementsByClassName("hbd-chatbox")[0]
  const hbd = document.getElementsByClassName("wish-hbd")[0]

  textBoxChars.innerHTML = `<span>${textBoxChars.innerHTML
    .split("")
    .join("</span><span>")}</span>`

  hbd.innerHTML = `<span>${hbd.innerHTML
    .split("")
    .join("</span><span>")}</span>`

  const ideaTextTrans = () => ({
    opacity: 0,
    y: -20,
    rotationX: 5,
    skewX: "15deg"
  })

  const ideaTextTransLeave = () => ({
    opacity: 0,
    y: 20,
    rotationY: 5,
    skewX: "-15deg"
  })

  // FEATURE 7: Assign to module-scope variable (no const)
  tl = new TimelineMax()

  tl
    .to(".container", 0.1, {
      visibility: "visible"
    })
    .from(".one", 0.7, {
      opacity: 0,
      y: 10
    })
    .from(".two", 0.4, {
      opacity: 0,
      y: 10
    })
    .to(
      ".one",
      0.7,
      {
        opacity: 0,
        y: 10
      },
      "+=2.5"
    )
    .to(
      ".two",
      0.7,
      {
        opacity: 0,
        y: 10
      },
      "-=1"
    )
    .from(".three", 0.7, {
      opacity: 0,
      y: 10
      // scale: 0.7
    })
    .to(
      ".three",
      0.7,
      {
        opacity: 0,
        y: 10
      },
      "+=2"
    )
    .from(".four", 0.7, {
      scale: 0.2,
      opacity: 0
    })
    .from(".fake-btn", 0.3, {
      scale: 0.2,
      opacity: 0
    })
    .staggerTo(
      ".hbd-chatbox span",
      0.5,
      {
        visibility: "visible"
      },
      0.05
    )
    .to(".fake-btn", 0.1, {
      backgroundColor: "#8FE3B6"
    })
    .to(
      ".four",
      0.5,
      {
        scale: 0.2,
        opacity: 0,
        y: -150
      },
      "+=0.7"
    )
    .from(".idea-1", 0.7, ideaTextTrans())
    .to(".idea-1", 0.7, ideaTextTransLeave(), "+=1.5")
    .from(".idea-2", 0.7, ideaTextTrans())
    .to(".idea-2", 0.7, ideaTextTransLeave(), "+=1.5")
    .from(".idea-3", 0.7, ideaTextTrans())
    .to(".idea-3 strong", 0.5, {
      scale: 1.2,
      x: 10,
      backgroundColor: "rgb(21, 161, 237)",
      color: "#fff"
    })
    .to(".idea-3", 0.7, ideaTextTransLeave(), "+=1.5")
    .from(".idea-4", 0.7, ideaTextTrans())
    .to(".idea-4", 0.7, ideaTextTransLeave(), "+=1.5")
    .from(
      ".idea-5",
      0.7,
      {
        rotationX: 15,
        rotationZ: -10,
        skewY: "-5deg",
        y: 50,
        z: 10,
        opacity: 0
      },
      "+=0.5"
    )
    .to(
      ".idea-5 .smiley",
      0.7,
      {
        rotation: 90,
        x: 8
      },
      "+=0.4"
    )
    .to(
      ".idea-5",
      0.7,
      {
        scale: 0.2,
        opacity: 0
      },
      "+=2"
    )
    .staggerFrom(
      ".idea-6 span",
      0.8,
      {
        scale: 3,
        opacity: 0,
        rotation: 15,
        ease: Expo.easeOut
      },
      0.2
    )
    .staggerTo(
      ".idea-6 span",
      0.8,
      {
        scale: 3,
        opacity: 0,
        rotation: -15,
        ease: Expo.easeOut
      },
      0.2,
      "+=1"
    )
    .staggerFromTo(
      ".baloons img",
      2.5,
      {
        opacity: 0.9,
        y: 1400,
        immediateRender: true
      },
      {
        opacity: 1,
        y: -1000
      },
      0.2
    )
    // FEATURE 1&2: Animate polaroid wrapper instead of just image
    .from(
      ".polaroid-wrapper",
      0.5,
      {
        scale: 3.5,
        opacity: 0,
        x: 25,
        y: -25,
        rotationZ: -45
      },
      "-=2"
    )
    // FEATURE 6: Enable polaroid tilt after it appears
    .call(() => {
      polaroidReady = true
    })
    .from(".hat", 0.5, {
      x: -100,
      y: 350,
      rotation: -180,
      opacity: 0
    })
    .staggerFrom(
      ".wish-hbd span",
      0.7,
      {
        opacity: 0,
        y: -50,
        // scale: 0.3,
        rotation: 150,
        skewX: "30deg",
        ease: Elastic.easeOut.config(1, 0.5)
      },
      0.1
    )
    .staggerFromTo(
      ".wish-hbd span",
      0.7,
      {
        scale: 1.4,
        rotationY: 150
      },
      {
        scale: 1,
        rotationY: 0,
        color: "#ff69b4",
        ease: Expo.easeOut
      },
      0.1,
      "party"
    )
    .from(
      ".wish h5",
      0.5,
      {
        opacity: 0,
        y: 10,
        skewX: "-15deg"
      },
      "party"
    )
    // FEATURE 3: Confetti trigger at party time
    .call(() => {
      if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.4 } })
      }
    }, null, "party")
    // FEATURE 7: Cake appears beside photo at party time
    .from(".cake-section", 0.7, {
      opacity: 0,
      y: 30,
      scale: 0.8
    }, "party+=0.5")
    .staggerTo(
      ".eight svg",
      1.5,
      {
        visibility: "visible",
        opacity: 0,
        scale: 80,
        repeat: 3,
        repeatDelay: 1.4
      },
      0.3
    )
    .to(".six", 0.5, {
      opacity: 0,
      y: 30,
      zIndex: "-1"
    })
    // FEATURE 6: Letter card appears after .nine
    .staggerFrom(".nine p", 1, ideaTextTrans(), 1.2)
    .to(
      ".last-smile",
      0.5,
      {
        rotation: 90
      },
      "+=1"
    )
    // Fade out .nine before showing letter
    .to(".nine", 0.8, {
      opacity: 0,
      y: -20,
      ease: Power2.easeInOut
    }, "+=1")
    // FEATURE 6: Letter animation
    .fromTo(".ten", 1.2,
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, ease: Power2.easeOut },
      "+=0.3"
    )
    // FEATURE 3: Stardust confetti burst on letter card
    .call(() => {
      if (typeof confetti !== 'undefined') {
        // Left burst
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.65 },
          colors: ['#818cf8', '#c084fc', '#38bdf8', '#f8fafc', '#6366f1'],
          scalar: 0.75,
          gravity: 0.5,
          drift: 0.1,
          ticks: 300
        })
        // Right burst
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.65 },
          colors: ['#818cf8', '#c084fc', '#38bdf8', '#f8fafc', '#6366f1'],
          scalar: 0.75,
          gravity: 0.5,
          drift: -0.1,
          ticks: 300
        })
      }
    })
    // FEATURE 4: Typewriter effect on letter content
    .call(() => {
      const letterContentEl = document.querySelector('.letter-content')
      const letterSignoffEl = document.querySelector('.letter-signoff')
      const contentText = customDataStore.letterContent || letterContentEl.innerText
      const signoffText = customDataStore.letterSignoff || letterSignoffEl.innerText
      letterSignoffEl.innerText = '' // Clear signoff until content finishes
      typewriterAnimate(letterContentEl, contentText, 40, () => {
        typewriterAnimate(letterSignoffEl, signoffText, 40)
      })
    })

  // tl.seek("currentStep");
  // tl.timeScale(2);

  // FEATURE 7: Add candle click event listeners
  const candles = document.querySelectorAll(".candle")
  let allCandles = candles.length
  let blownCandles = 0
  candles.forEach(candle => {
    candle.addEventListener("click", (e) => {
      e.stopPropagation()
      if (!candle.classList.contains("blown")) {
        candle.classList.add("blown")
        blownCandles++
        if (blownCandles === allCandles) {
          const wishMessage = document.querySelector(".wish-message")
          if (wishMessage) {
            wishMessage.style.display = "block"
          }
        }
      }
    })
  })

  // Restart Animation on click
  const replyBtn = document.getElementById("replay")
  replyBtn.addEventListener("click", () => {
    // FEATURE 7: Reset candles on replay
    candles.forEach(candle => candle.classList.remove("blown"))
    blownCandles = 0
    const wishMessage = document.querySelector(".wish-message")
    if (wishMessage) wishMessage.style.display = "none"

    // FEATURE 5: Spawn emoji rain on replay
    spawnEmojiRain()

    // FEATURE 6: Reset polaroid tilt gate
    polaroidReady = false

    tl.restart()

  })
}

// Run fetch and animation in sequence
fetchData()

const playPauseButton = document.getElementById('playPauseButton')

document.getElementById('startButton').addEventListener('click', () => {
  if (audio) {
    togglePlay(true)
  }
})

playPauseButton.addEventListener('click', () => {
  if (audio) {
    togglePlay(!isPlaying)
  }
})

function togglePlay(play) {
  if (!audio) return
  
  isPlaying = play
  play ? audio.play() : audio.pause()
  playPauseButton.classList.toggle('playing', play)
  // FEATURE 5: Toggle visualizer
  playPauseButton.classList.toggle('visualizer-active', play)
}

// FEATURE 4: Generate particles for bokeh background
const generateParticles = () => {
  const particleBg = document.getElementById('particle-bg')
  const particleCount = 20
  const colors = ['#fb7185', '#38bdf8', '#818cf8', '#c084fc', '#f472b6']
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle'
    
    const size = Math.random() * 8 + 4 // 4-12px
    const x = Math.random() * 100
    const y = Math.random() * 100
    const color = colors[Math.floor(Math.random() * colors.length)]
    const duration = Math.random() * 6 + 6 // 6-12s
    const delay = Math.random() * 3
    const drift = Math.random() * 200 - 100 // -100 to 100px horizontal drift
    
    particle.style.width = size + 'px'
    particle.style.height = size + 'px'
    particle.style.left = x + '%'
    particle.style.bottom = y + '%'
    particle.style.backgroundColor = color
    particle.style.opacity = Math.random() * 0.2 + 0.3 // 0.3-0.5
    particle.style.animation = `float-up ${duration}s ease-in infinite`
    particle.style.animationDelay = delay + 's'
    particle.style.setProperty('--drift', drift + 'px')
    
    particleBg.appendChild(particle)
  }
}

// Call particle generation on page load
generateParticles()

// FEATURE 1: Cursor Trail Sparkles
document.addEventListener('mousemove', (e) => {
  const now = Date.now()
  if (now - lastSparkleTime < 30) return
  lastSparkleTime = now

  const sparkle = document.createElement('div')
  sparkle.className = 'cursor-sparkle'
  sparkle.style.left = (e.clientX - 5) + 'px'
  sparkle.style.top = (e.clientY - 5) + 'px'
  document.body.appendChild(sparkle)
  sparkle.addEventListener('animationend', () => sparkle.remove())
})

// FEATURE 6: Polaroid Tilt on Hover
const polaroidWrapper = document.querySelector('.polaroid-wrapper')
if (polaroidWrapper) {
  polaroidWrapper.addEventListener('mousemove', (e) => {
    if (!polaroidReady) return
    const rect = polaroidWrapper.getBoundingClientRect()
    const rotateY = ((e.clientX - rect.left) / rect.width - 0.5) * 15
    const rotateX = -((e.clientY - rect.top) / rect.height - 0.5) * 10
    polaroidWrapper.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`
  })

  polaroidWrapper.addEventListener('mouseleave', () => {
    if (!polaroidReady) return
    polaroidWrapper.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)'
  })
}

// FEATURE 7: Shake to Replay on Mobile
let lastX = null, lastY = null, lastZ = null
let shakeThreshold = 15
let shakeCooldown = false

window.addEventListener('devicemotion', (e) => {
  const accel = e.accelerationIncludingGravity || e.acceleration
  if (!accel) return

  const ax = accel.x || 0
  const ay = accel.y || 0
  const az = accel.z || 0

  if (lastX !== null) {
    const deltaX = Math.abs(ax - lastX)
    const deltaY = Math.abs(ay - lastY)
    const deltaZ = Math.abs(az - lastZ)

    if (deltaX + deltaY + deltaZ > shakeThreshold && !shakeCooldown && timelineStarted && tl) {
      shakeCooldown = true

      // FEATURE 5: Emoji rain on shake replay
      spawnEmojiRain()

      // Reset candles
      const candles = document.querySelectorAll(".candle")
      candles.forEach(candle => candle.classList.remove("blown"))
      const wishMessage = document.querySelector(".wish-message")
      if (wishMessage) wishMessage.style.display = "none"

      // Reset polaroid tilt gate
      polaroidReady = false

      tl.restart()

      setTimeout(() => { shakeCooldown = false }, 3000)
    }
  }

  lastX = ax
  lastY = ay
  lastZ = az
})