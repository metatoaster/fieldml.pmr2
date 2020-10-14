$(document).ready(function() {
    var zincjs_wrappers = $('.pmr2_zincjs_wrapper');

    // only doing the first one for now...
    var zincjs_wrapper = zincjs_wrappers[0];
    var controller = zincjs_wrapper.querySelector('.pmr2_zincjs_control')
    window.zjw = zincjs_wrapper;
    controller.addEventListener('click', function(event) {
        var dialog = zincjs_wrapper.querySelector('#MAPcorePortalArea').organViewerDialog;

        // if (zincjs_wrapper.getAttribute("style")) {
        //     zincjs_wrapper.setAttribute("style", "");
        // }
        // else {
        //     zincjs_wrapper.setAttribute(
        //         "style",
        //         "position: absolute; left: 0; top: 0; bottom: 0; " +
        //         "right: 0; padding: 1em;"
        //     );
        // }

        zincjs_wrapper.classList.toggle('maximized');
        controller.querySelector('i').classList.toggle('icon-resize-full');
        controller.querySelector('i').classList.toggle('icon-resize-small');
        dialog.setWidth('100%');
        dialog.setHeight('100%');
    });
});

