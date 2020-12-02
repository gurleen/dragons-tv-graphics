/**
 * DragonsTV Graphics Tools
 * Author: Gurleen Singh <gs585@drexel.edu>
 * https://gurleen.dev/
 */

/*
active = {
    class = 'activeClass',
    text = 'activeText'
}

same for inactive
*/

class ToggleButton {
    constructor(id, active, inactive) {
        this.id = `#${id}`;
        this.active = active;
        this.inactive = inactive;
        this.state = false;
    }

    toggle() {
        this.state = !this.state;
        if(this.state) {
            $(this.id).text(this.active.text);
            $(this.id).removeClass(this.inactive.class).addClass(this.active.class);
        } else {
            $(this.id).text(this.inactive.text);
            $(this.id).removeClass(this.active.class).addClass(this.inactive.class);
        }
    }
}