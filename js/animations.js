// js/animations.js
const Animations = {
    bounce(element) {
        element.style.transform = "scale(0.95)";
        setTimeout(() => {
            element.style.transform = "scale(1)";
        }, 150);
    }
};
