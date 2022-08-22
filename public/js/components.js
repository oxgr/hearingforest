class Button {

    constructor( x = 0, y = 0, size = 0 ) {

        this.x = x;
        this.y = y;
        this.size = size;

        this.stroke = 'white';
        this.strokeWeight = 2;

        const halfSize = size * 0.5;

        this.clickBox = {
            x1: this.x - halfSize,
            y1: this.y - halfSize,
            x2: this.x + halfSize,
            y2: this.y + halfSize,
        }

        this.drawIcon = ( x, y, size, color ) => {} ;
        this.iconSize = this.size * 0.6
        this.iconColorCurrent = '#FFFFFF';
        this.iconColorActive = '#FFFFFF';
        this.iconColorInactive = '#FFFFFF';

        this.name = '';

        this.active = false;

    }

    clearIcon() {

        fill( '#101010' );
        noStroke();
        circle( this.x, this.y, this.size * 0.9 );

    }

    draw() {

        push();
        
        // Draw button border
        noFill();
        stroke( this.stroke );
        strokeWeight( this.strokeWeight );
        circle( this.x, this.y, this.size );

        this.clearIcon();

        // lerpColor( color( this.iconColorCurrent ), this.iconColorActive, 0.5 )

        // Draw icon based on passed function
        this.drawIcon( this.x, this.y, this.iconSize, this.active ? this.iconColorActive : this.iconColorInactive, this.active );
        
        pop();

        return this;

    }

    clicked( x, y ) {

        console.log( {
            xMouse: x,
            yMouse: y,
            xThis: this.x,
            yThis: this.y,
            size: this.size
        })

        const result =
            x > this.clickBox.x1 &&
            y > this.clickBox.y1 &&
            x < this.clickBox.x2 &&
            y < this.clickBox.y2;
        
        return result;
    }

    toggle() {

        this.active = !this.active;

        if ( !this.active ) this.iconColorCurrent = this.iconColorInactive;

    }

}

class ProgressBar {

    constructor( x, y, w, h ) {
        
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.xHalf = x + ( w * 0.5 );
        this.yHalf = y + ( h * 0.5 );
        
        this.waveArray = [...Array( 100 )];

        this.colors = {
            default: '#101010',
            white: '#FFFFFF',
            disabled: '#AAAAAA',
        }
    }

    drawBorder() {
        push();
        noFill();
        stroke( 'white' );
        strokeWeight( 2 );
        rect( x, y, w, h );
        pop();
    }

    drawWave( progress = 0, val = 0, active = 'true' ) {

        push();
        stroke( active ? this.colors.white : this.colors.disabled );
        strokeWeight( 1 );

        const pos = this.x + ( progress * this.w );
        const len = ( val * this.h * 0.9 );  // 0.9 so it doesn't fully reach the edge.
        const lenHalf = len * 0.5;
        line(
            pos,
            this.yHalf - lenHalf,
            pos,
            this.yHalf + lenHalf
        )
        pop();

    }

    addToWave( rms ) {
        this.waveArray.push( rms );
    }

    drawTotalWave( progress = 1 ) {
        
        this.clear();
        this.waveArray.forEach( ( rms, i, arr ) => {
            const ratio = i / arr.length;
            const active = ratio < progress
            this.drawWave( ratio, rms, active )
        });

    }

    clear() {

        noStroke();
        fill( this.colors.default );
        rect( this.x, this.y, this.w, this.h );

    }

    reset() {

        clear();
        this.waveArray = [];

    }
    

    clicked( x, y ) {

        const xPos = x - this.x;
        const yPos = y - this.y;
        const clicked = (
            0 < xPos &&
            0 < yPos &&
            xPos < this.w &&
            yPos < this.h
        );

        

        return clicked
        
    }

    ratio( x ) {

        return ( x - this.x ) / this.width;

    }

}

export { Button, ProgressBar }