// constants
const ANIMATION_DURATION = 350;
const POSITION_BEHIND_MAP = "100%";
const POSITION_OFFSCREEN_LEFT = "-100%";
const POSITION_VISIBLE = "0px";
const OPAQUE = 1;
const TRANSPARENT = 0;

// private variables
let visibleDiv = $("#scripnav1");
let invisibleDiv = $("#scripnav2");

// helper methods
const animateToNewContent = function (content, animationType) {
    invisibleDiv.html(content);

    if (animationType === "prev") {
        slideFromLeft();
    } else if (animationType === "next") {
        slideFromRight();
    } else {
        crossfade();
    }
};

const swapDivs = function () {
    let temp = visibleDiv;

    visibleDiv = invisibleDiv;
    invisibleDiv = temp;
};

const crossfade = function () {
    // make sure invisible div is in the right spot
    invisibleDiv.css({left: POSITION_VISIBLE, opacity: TRANSPARENT});

    const hideIfTransparent = function () {
        swapDivs();

        invisibleDiv.css({left: POSITION_OFFSCREEN_LEFT});
    }

    // cross-fade the divs
    visibleDiv.animate({ opacity: TRANSPARENT}, ANIMATION_DURATION);
    invisibleDiv.animate({ opacity: OPAQUE}, ANIMATION_DURATION, hideIfTransparent());
};

const slideFromRight = function () {
    // make sure offscreen/invisible div is in the right spot
    invisibleDiv.css({left: POSITION_BEHIND_MAP, opacity: OPAQUE});

    // then run the animation
    invisibleDiv.animate({left: POSITION_VISIBLE}, ANIMATION_DURATION);
    visibleDiv.animate({left: POSITION_OFFSCREEN_LEFT}, ANIMATION_DURATION, swapDivs());
};

const slideFromLeft = function () {
    // make sure offscreen/invisible div is in the right spot
    invisibleDiv.css({left: POSITION_OFFSCREEN_LEFT, opacity: OPAQUE});

    // then run the animation
    invisibleDiv.animate({left: POSITION_VISIBLE}, ANIMATION_DURATION);
    visibleDiv.animate({left: POSITION_BEHIND_MAP}, ANIMATION_DURATION, swapDivs());
};

export { animateToNewContent, crossfade };