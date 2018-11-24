
interface TouchEvent extends UIEvent {
    targetTouches: { pageX: number; pageY: number; }[];    
}

interface Element {
    innerHTML: string;
}

function log(touches: { pageX: number; pageY: number; }[]) {
    var div = document.querySelector('.viewport');    
    div.innerHTML = '<ul>' + 
        touches.map(t => '<li>' + t.pageX + ', ' + 
                          t.pageY + '</li>').join('') +
                    '</ul>';
}

function touchy() {
    document.addEventListener("touchstart", (ev: TouchEvent) => {
        log(ev.targetTouches);
    });
    document.addEventListener("touchend", (ev: TouchEvent) => {
        log(ev.targetTouches);    
    });    
    document.addEventListener("touchmove", (ev: TouchEvent)=> {
        log(ev.targetTouches);
    });
    
}
