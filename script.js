// ==============================
// MEMBER POPUP FUNCTIONALITY
// ==============================

const memberPopup = document.getElementById('memberPopup');
const closePopupBtn = document.getElementById('closePopup');
const skipPopupBtn = document.getElementById('skipPopup');

// Show popup after delay if not seen before
function initMemberPopup() {
    if (!memberPopup) return;

    const hasSeenPopup = localStorage.getItem('blububb_popup_seen');

    if (!hasSeenPopup) {
        setTimeout(() => {
            memberPopup.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 3000); // Show after 3 seconds
    }
}

function closePopup() {
    if (!memberPopup) return;
    memberPopup.classList.remove('active');
    document.body.style.overflow = '';
    localStorage.setItem('blububb_popup_seen', 'true');
}

if (closePopupBtn) {
    closePopupBtn.addEventListener('click', closePopup);
}

if (skipPopupBtn) {
    skipPopupBtn.addEventListener('click', closePopup);
}

// Close on overlay click
if (memberPopup) {
    memberPopup.addEventListener('click', (e) => {
        if (e.target === memberPopup) {
            closePopup();
        }
    });
}

// Initialize popup on page load
document.addEventListener('DOMContentLoaded', initMemberPopup);

// ==============================
// Hamburger Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
}

// Close menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    });
});

// Simple Fade In Animation on Scroll
const sections = document.querySelectorAll('.section');
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px"
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

sections.forEach(section => {
    section.style.opacity = "0";
    section.style.transform = "translateY(30px)";
    section.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out";
    observer.observe(section);
});

// Carousel Logic (Auto Scroll Loop)
const track = document.querySelector('.testimonial-track');
const slides = Array.from(track.children);
const nextButton = document.querySelector('.next-btn');
const prevButton = document.querySelector('.prev-btn');
const dotsNav = document.querySelector('.carousel-nav');
const dots = Array.from(dotsNav.children);

const slideWidth = slides[0].getBoundingClientRect().width;

// Arrange the slides next to one another
const setSlidePosition = (slide, index) => {
    slide.style.left = slideWidth * index + 'px';
};
slides.forEach(setSlidePosition);

const moveToSlide = (track, currentSlide, targetSlide) => {
    track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
    currentSlide.classList.remove('current-slide');
    targetSlide.classList.add('current-slide');

    // Update opacity
    currentSlide.style.opacity = '0';
    targetSlide.style.opacity = '1';
};

const updateDots = (currentDot, targetDot) => {
    currentDot.classList.remove('current-slide');
    targetDot.classList.add('current-slide');
};

const moveNext = () => {
    const currentSlide = track.querySelector('.current-slide');
    let nextSlide = currentSlide.nextElementSibling;
    const currentDot = dotsNav.querySelector('.current-slide');
    let nextDot = currentDot.nextElementSibling;

    // Loop back to start if at end
    if (!nextSlide) {
        nextSlide = slides[0];
        nextDot = dots[0];
    }

    moveToSlide(track, currentSlide, nextSlide);
    updateDots(currentDot, nextDot);
};

const movePrev = () => {
    const currentSlide = track.querySelector('.current-slide');
    let prevSlide = currentSlide.previousElementSibling;
    const currentDot = dotsNav.querySelector('.current-slide');
    let prevDot = currentDot.previousElementSibling;

    // Loop to end if at start
    if (!prevSlide) {
        prevSlide = slides[slides.length - 1];
        prevDot = dots[dots.length - 1];
    }

    moveToSlide(track, currentSlide, prevSlide);
    updateDots(currentDot, prevDot);
};

// Next Button
nextButton.addEventListener('click', () => {
    moveNext();
    resetAutoScroll();
});

// Prev Button
prevButton.addEventListener('click', () => {
    movePrev();
    resetAutoScroll();
});

// Dot Indicator Click
dotsNav.addEventListener('click', e => {
    const targetDot = e.target.closest('button');

    if (!targetDot) return;

    const currentSlide = track.querySelector('.current-slide');
    const currentDot = dotsNav.querySelector('.current-slide');
    const targetIndex = dots.findIndex(dot => dot === targetDot);
    const targetSlide = slides[targetIndex];

    moveToSlide(track, currentSlide, targetSlide);
    updateDots(currentDot, targetDot);
    resetAutoScroll();
});

// Auto Scroll Interval
let autoScrollInterval = setInterval(moveNext, 3000); // Scroll every 3 seconds

const resetAutoScroll = () => {
    clearInterval(autoScrollInterval);
    autoScrollInterval = setInterval(moveNext, 3000);
};

// Handle Window Resize
window.addEventListener('resize', () => {
    const slideWidth = slides[0].getBoundingClientRect().width;
    slides.forEach((slide, index) => {
        slide.style.left = slideWidth * index + 'px';
    });

    // Re-center current slide
    const currentSlide = track.querySelector('.current-slide');
    track.style.transform = 'translateX(-' + currentSlide.style.left + ')';

    // Disable transition temporarily to avoid "jumping" effect (optional, keeping simple for now)
});
