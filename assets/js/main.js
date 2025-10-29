jQuery(document).ready(function($) {
    // Variable to track if initial autoplay has happened
    let hasAutoplayedOnce = false;

    // Function to handle video autoplay on scroll
    function handleVideoScroll() {
        const video = document.getElementById('iceland-video');
        if (!video || hasAutoplayedOnce) return;

        const rect = video.getBoundingClientRect();
        const isInViewport = (
            rect.top >= 0 &&
            rect.top <= (window.innerHeight || document.documentElement.clientHeight)
        );

        if (isInViewport && video.paused) {
            video.play();
            hasAutoplayedOnce = true;
            // Remove scroll listener after first autoplay
            $(window).off('scroll', handleVideoScroll);
        }
    }

    // Add scroll event listener for video autoplay
    $(window).on('scroll', handleVideoScroll);

	var mastheadheight = $('.ds-header').outerHeight();
	//console.log(mastheadheight);
	$(".ds-banner,.ds-main-section").css("margin-top" , mastheadheight);

	$(window).scroll(function(){
	    if ($(window).scrollTop() >= 10) {
	        $('.ds-header').addClass('ds-fixed-header');
	    }
	    else {
	        $('.ds-header').removeClass('ds-fixed-header');
	    }
	}).scroll();


});