function log(touches) {
    var div = document.querySelector('.viewport');
    div.innerHTML = '<ul>' +
        touches.map(function (t) { return '<li>' + t.pageX + ', ' +
            t.pageY + '</li>'; }).join('') +
        '</ul>';
}
function touchy() {
    document.addEventListener("touchstart", function (ev) {
        log(ev.targetTouches);
    });
    document.addEventListener("touchend", function (ev) {
        log(ev.targetTouches);
    });
    document.addEventListener("touchmove", function (ev) {
        log(ev.targetTouches);
    });
}
